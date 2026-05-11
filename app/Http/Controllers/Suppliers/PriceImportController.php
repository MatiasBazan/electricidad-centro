<?php

namespace App\Http\Controllers\Suppliers;

use App\Http\Controllers\Controller;
use App\Models\PriceImportLog;
use App\Models\PriceList;
use App\Models\Supplier;
use App\Models\SupplierPriceImportConfig;
use App\Services\PriceImportService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class PriceImportController extends Controller
{
    public function index(): Response
    {
        $suppliers = Supplier::where('is_active', true)
            ->with(['importConfigs.priceList'])
            ->orderBy('name')
            ->get()
            ->map(fn ($s) => [
                'id'      => $s->id,
                'name'    => $s->name,
                'configs' => $s->importConfigs->map(fn ($c) => [
                    'id'             => $c->id,
                    'name'           => $c->name,
                    'file_type'      => $c->file_type,
                    'price_list'     => $c->priceList?->name,
                    'markup_pct'     => (float) $c->markup_pct,
                    'is_active'      => $c->is_active,
                    'column_mappings'=> $c->column_mappings,
                    'header_row'     => $c->header_row,
                    'data_start_row' => $c->data_start_row,
                    'sheet_index'    => $c->sheet_index,
                    'csv_delimiter'  => $c->csv_delimiter,
                    'csv_encoding'   => $c->csv_encoding,
                    'price_list_id'  => $c->price_list_id,
                ])->values(),
            ]);

        $recentLogs = PriceImportLog::with(['supplier:id,name', 'config:id,name', 'user:id,name'])
            ->orderByDesc('created_at')
            ->limit(30)
            ->get()
            ->map(fn ($l) => [
                'id'             => $l->id,
                'supplier'       => $l->supplier->name,
                'config'         => $l->config?->name,
                'file_name'      => $l->file_name,
                'status'         => $l->status,
                'rows_total'     => $l->rows_total,
                'rows_updated'   => $l->rows_updated,
                'rows_created'   => $l->rows_created,
                'rows_skipped'   => $l->rows_skipped,
                'rows_failed'    => $l->rows_failed,
                'has_errors'     => ! empty($l->error_details),
                'imported_at'    => $l->imported_at?->format('d/m/Y H:i'),
                'created_at'     => $l->created_at?->format('d/m/Y H:i'),
            ]);

        return Inertia::render('Imports/Index', [
            'suppliers'   => $suppliers,
            'recent_logs' => $recentLogs,
            'price_lists' => PriceList::orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function storeConfig(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'supplier_id'    => 'required|exists:suppliers,id',
            'name'           => 'required|string|max:100',
            'file_type'      => 'required|in:excel,csv',
            'sheet_index'    => 'integer|min:0|max:20',
            'header_row'     => 'integer|min:1|max:50',
            'data_start_row' => 'integer|min:1|max:50',
            'csv_delimiter'  => 'nullable|string|max:1',
            'csv_encoding'   => 'nullable|string|max:20',
            'price_list_id'  => 'nullable|exists:price_lists,id',
            'markup_pct'     => 'nullable|numeric|min:0|max:500',
            'column_mappings.identifier_type' => 'required|in:sku,barcode,code',
            'column_mappings.identifier'      => 'required|integer|min:1',
            'column_mappings.cost_price'      => 'nullable|integer|min:1',
            'column_mappings.sale_price'      => 'nullable|integer|min:1',
        ]);

        SupplierPriceImportConfig::create([
            'supplier_id'    => $data['supplier_id'],
            'name'           => $data['name'],
            'file_type'      => $data['file_type'],
            'sheet_index'    => $data['sheet_index'] ?? 0,
            'header_row'     => $data['header_row'] ?? 1,
            'data_start_row' => $data['data_start_row'] ?? 2,
            'csv_delimiter'  => $data['csv_delimiter'] ?? ',',
            'csv_encoding'   => $data['csv_encoding'] ?? 'UTF-8',
            'price_list_id'  => $data['price_list_id'] ?? null,
            'markup_pct'     => $data['markup_pct'] ?? null,
            'is_active'      => true,
            'column_mappings' => array_filter([
                'identifier_type' => $data['column_mappings']['identifier_type'],
                'identifier'      => (int) $data['column_mappings']['identifier'],
                'cost_price'      => isset($data['column_mappings']['cost_price']) ? (int) $data['column_mappings']['cost_price'] : null,
                'sale_price'      => isset($data['column_mappings']['sale_price']) ? (int) $data['column_mappings']['sale_price'] : null,
            ], fn ($v) => $v !== null),
        ]);

        return back()->with('success', 'Configuración creada.');
    }

    public function updateConfig(Request $request, SupplierPriceImportConfig $config): RedirectResponse
    {
        $data = $request->validate([
            'name'           => 'required|string|max:100',
            'file_type'      => 'required|in:excel,csv',
            'sheet_index'    => 'integer|min:0|max:20',
            'header_row'     => 'integer|min:1|max:50',
            'data_start_row' => 'integer|min:1|max:50',
            'csv_delimiter'  => 'nullable|string|max:1',
            'csv_encoding'   => 'nullable|string|max:20',
            'price_list_id'  => 'nullable|exists:price_lists,id',
            'markup_pct'     => 'nullable|numeric|min:0|max:500',
            'column_mappings.identifier_type' => 'required|in:sku,barcode,code',
            'column_mappings.identifier'      => 'required|integer|min:1',
            'column_mappings.cost_price'      => 'nullable|integer|min:1',
            'column_mappings.sale_price'      => 'nullable|integer|min:1',
        ]);

        $config->update([
            'name'           => $data['name'],
            'file_type'      => $data['file_type'],
            'sheet_index'    => $data['sheet_index'] ?? $config->sheet_index,
            'header_row'     => $data['header_row'] ?? $config->header_row,
            'data_start_row' => $data['data_start_row'] ?? $config->data_start_row,
            'csv_delimiter'  => $data['csv_delimiter'] ?? $config->csv_delimiter,
            'csv_encoding'   => $data['csv_encoding'] ?? $config->csv_encoding,
            'price_list_id'  => $data['price_list_id'] ?? null,
            'markup_pct'     => $data['markup_pct'] ?? null,
            'column_mappings' => array_filter([
                'identifier_type' => $data['column_mappings']['identifier_type'],
                'identifier'      => (int) $data['column_mappings']['identifier'],
                'cost_price'      => isset($data['column_mappings']['cost_price']) ? (int) $data['column_mappings']['cost_price'] : null,
                'sale_price'      => isset($data['column_mappings']['sale_price']) ? (int) $data['column_mappings']['sale_price'] : null,
            ], fn ($v) => $v !== null),
        ]);

        return back()->with('success', 'Configuración actualizada.');
    }

    public function destroyConfig(SupplierPriceImportConfig $config): RedirectResponse
    {
        $config->delete();
        return back()->with('success', 'Configuración eliminada.');
    }

    public function upload(Request $request, SupplierPriceImportConfig $config): RedirectResponse
    {
        $request->validate([
            'file' => 'required|file|mimes:xlsx,xls,csv,txt|max:20480',
        ]);

        $file     = $request->file('file');
        $fileName = $file->getClientOriginalName();
        $path     = $file->store('imports');

        $log = PriceImportLog::create([
            'supplier_id' => $config->supplier_id,
            'config_id'   => $config->id,
            'user_id'     => $request->user()->id,
            'file_name'   => $fileName,
            'file_path'   => $path,
            'status'      => 'pending',
            'created_at'  => now(),
        ]);

        app(PriceImportService::class)->run($log, $config);

        $log->refresh();

        $msg = "Importación completada: {$log->rows_updated} actualizados, {$log->rows_skipped} sin cambios";
        if ($log->rows_failed > 0) {
            $msg .= ", {$log->rows_failed} con error";
        }

        return back()->with($log->rows_failed > 0 ? 'warning' : 'success', $msg . '.');
    }

    public function showLog(PriceImportLog $log): Response
    {
        $log->load(['supplier:id,name', 'config:id,name', 'user:id,name']);

        return Inertia::render('Imports/LogDetail', [
            'log' => [
                'id'             => $log->id,
                'supplier'       => $log->supplier->name,
                'config'         => $log->config?->name,
                'user'           => $log->user->name,
                'file_name'      => $log->file_name,
                'status'         => $log->status,
                'rows_total'     => $log->rows_total,
                'rows_updated'   => $log->rows_updated,
                'rows_created'   => $log->rows_created,
                'rows_skipped'   => $log->rows_skipped,
                'rows_failed'    => $log->rows_failed,
                'error_details'  => $log->error_details ?? [],
                'imported_at'    => $log->imported_at?->format('d/m/Y H:i'),
                'created_at'     => $log->created_at?->format('d/m/Y H:i'),
            ],
        ]);
    }
}
