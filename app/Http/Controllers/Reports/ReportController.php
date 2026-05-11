<?php

namespace App\Http\Controllers\Reports;

use App\Exports\CashExport;
use App\Exports\PurchasesExport;
use App\Exports\SalesExport;
use App\Exports\StockExport;
use App\Http\Controllers\Controller;
use App\Models\CashSession;
use App\Models\PurchaseOrder;
use App\Models\SalesOrder;
use App\Models\Stock;
use App\Models\Supplier;
use App\Models\Warehouse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class ReportController extends Controller
{
    public function index(Request $request): Response
    {
        $report  = $request->get('report', '');
        $filters = $request->only(['from', 'to', 'status', 'supplier_id', 'warehouse_id', 'below_min']);

        $rows     = collect();
        $summary  = [];

        if ($report) {
            [$rows, $summary] = match ($report) {
                'ventas'  => $this->salesPreview($filters),
                'stock'   => $this->stockPreview($filters),
                'compras' => $this->purchasesPreview($filters),
                'caja'    => $this->cashPreview($filters),
                default   => [collect(), []],
            };
        }

        return Inertia::render('Reports/Index', [
            'report'     => $report,
            'filters'    => $filters,
            'rows'       => $rows->take(300)->values(),
            'total_rows' => $rows->count(),
            'summary'    => $summary,
            'suppliers'  => Supplier::where('is_active', true)->orderBy('name')->get(['id', 'name']),
            'warehouses' => Warehouse::orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function export(Request $request, string $type): BinaryFileResponse
    {
        $filters  = $request->only(['from', 'to', 'status', 'supplier_id', 'warehouse_id', 'below_min']);
        $fileName = "{$type}-" . now()->format('Y-m-d') . '.xlsx';

        $export = match ($type) {
            'ventas'  => new SalesExport($filters),
            'stock'   => new StockExport($filters),
            'compras' => new PurchasesExport($filters),
            'caja'    => new CashExport($filters),
            default   => abort(404),
        };

        return Excel::download($export, $fileName);
    }

    // ─── Previews ────────────────────────────────────────────

    private function salesPreview(array $f): array
    {
        $q = SalesOrder::with(['client:id,name', 'user:id,name'])->orderByDesc('date');

        if (! empty($f['from'])) $q->whereDate('date', '>=', $f['from']);
        if (! empty($f['to']))   $q->whereDate('date', '<=', $f['to']);
        if (! empty($f['status'])) $q->where('status', $f['status']);

        $rows = $q->get()->map(fn ($o) => [
            'number'          => $o->number,
            'date'            => $o->date->format('d/m/Y'),
            'client'          => $o->client?->name ?? '—',
            'user'            => $o->user?->name ?? '—',
            'status'          => $o->status,
            'payment_type'    => $o->payment_type,
            'subtotal'        => (float) $o->subtotal,
            'discount_amount' => (float) $o->discount_amount,
            'tax_amount'      => (float) $o->tax_amount,
            'total'           => (float) $o->total,
        ]);

        $summary = [
            'total_orders'  => $rows->count(),
            'total_revenue' => $rows->sum('total'),
            'total_tax'     => $rows->sum('tax_amount'),
            'avg_order'     => $rows->count() ? round($rows->avg('total'), 2) : 0,
        ];

        return [$rows, $summary];
    }

    private function stockPreview(array $f): array
    {
        $q = Stock::with([
            'variant:id,product_id,sku,cost_price,sale_price',
            'variant.product:id,code,name,category_id',
            'variant.product.category:id,name',
            'warehouse:id,name',
        ]);

        if (! empty($f['warehouse_id'])) $q->where('warehouse_id', $f['warehouse_id']);

        $rows = $q->get()->map(fn ($s) => [
            'code'       => $s->variant?->product?->code ?? '—',
            'sku'        => $s->variant?->sku ?? '—',
            'name'       => $s->variant?->product?->name ?? '—',
            'category'   => $s->variant?->product?->category?->name ?? '—',
            'warehouse'  => $s->warehouse?->name ?? '—',
            'quantity'   => (float) $s->quantity,
            'reserved'   => (float) $s->reserved_quantity,
            'available'  => (float) $s->quantity - (float) $s->reserved_quantity,
            'cost_price' => (float) ($s->variant?->cost_price ?? 0),
            'sale_price' => (float) ($s->variant?->sale_price ?? 0),
            'value'      => round(((float) $s->quantity - (float) $s->reserved_quantity) * (float) ($s->variant?->cost_price ?? 0), 2),
        ]);

        if (! empty($f['below_min'])) {
            $rows = $rows->filter(fn ($r) => $r['available'] <= 0);
        }

        $summary = [
            'total_skus'      => $rows->count(),
            'total_value'     => round($rows->sum('value'), 2),
            'out_of_stock'    => $rows->where('available', '<=', 0)->count(),
        ];

        return [$rows, $summary];
    }

    private function purchasesPreview(array $f): array
    {
        $q = PurchaseOrder::with(['supplier:id,name', 'user:id,name'])->orderByDesc('order_date');

        if (! empty($f['from']))        $q->whereDate('order_date', '>=', $f['from']);
        if (! empty($f['to']))          $q->whereDate('order_date', '<=', $f['to']);
        if (! empty($f['status']))      $q->where('status', $f['status']);
        if (! empty($f['supplier_id'])) $q->where('supplier_id', $f['supplier_id']);

        $rows = $q->get()->map(fn ($o) => [
            'order_number'  => $o->order_number,
            'date'          => $o->order_date->format('d/m/Y'),
            'supplier'      => $o->supplier?->name ?? '—',
            'user'          => $o->user?->name ?? '—',
            'status'        => $o->status,
            'expected_date' => $o->expected_date?->format('d/m/Y') ?? '—',
            'subtotal'      => (float) $o->subtotal,
            'tax_amount'    => (float) $o->tax_amount,
            'total'         => (float) $o->total,
        ]);

        $summary = [
            'total_orders' => $rows->count(),
            'total_spent'  => $rows->sum('total'),
        ];

        return [$rows, $summary];
    }

    private function cashPreview(array $f): array
    {
        $q = CashSession::with(['user:id,name', 'cashRegister:id,name'])->orderByDesc('opened_at');

        if (! empty($f['from']))   $q->whereDate('opened_at', '>=', $f['from']);
        if (! empty($f['to']))     $q->whereDate('opened_at', '<=', $f['to']);
        if (! empty($f['status'])) $q->where('status', $f['status']);

        $rows = $q->get()->map(fn ($s) => [
            'id'              => $s->id,
            'opened_at'       => $s->opened_at->format('d/m/Y H:i'),
            'closed_at'       => $s->closed_at?->format('d/m/Y H:i') ?? '—',
            'user'            => $s->user?->name ?? '—',
            'cash_register'   => $s->cashRegister?->name ?? '—',
            'status'          => $s->status,
            'opening_amount'  => (float) $s->opening_amount,
            'expected_cash'   => (float) ($s->expected_cash ?? 0),
            'closing_amount'  => (float) ($s->closing_amount ?? 0),
            'difference'      => (float) ($s->difference ?? 0),
        ]);

        $closed = $rows->where('status', 'closed');
        $summary = [
            'total_sessions'  => $rows->count(),
            'closed_sessions' => $closed->count(),
            'total_diff'      => round($closed->sum('difference'), 2),
        ];

        return [$rows, $summary];
    }
}
