<?php

namespace App\Services;

use App\Models\PriceImportLog;
use App\Models\ProductPrice;
use App\Models\ProductVariant;
use App\Models\SupplierPriceImportConfig;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use PhpOffice\PhpSpreadsheet\IOFactory;

class PriceImportService
{
    public function run(PriceImportLog $log, SupplierPriceImportConfig $config): void
    {
        $log->update(['status' => 'processing']);

        try {
            $rows = $this->readFile($log->file_path, $config);
        } catch (\Throwable $e) {
            $log->update(['status' => 'failed', 'error_details' => [['row' => 0, 'error' => 'No se pudo leer el archivo: ' . $e->getMessage()]]]);
            return;
        }

        $mappings      = $config->column_mappings;
        $identifierType = $mappings['identifier_type'];
        $identifierCol  = (int) $mappings['identifier'] - 1;
        $costCol        = isset($mappings['cost_price'])  ? (int) $mappings['cost_price']  - 1 : null;
        $saleCol        = isset($mappings['sale_price'])  ? (int) $mappings['sale_price']  - 1 : null;

        $created   = 0;
        $updated   = 0;
        $skipped   = 0;
        $failed    = 0;
        $errors    = [];

        DB::beginTransaction();
        try {
            foreach ($rows as $i => $row) {
                $rowNum    = $i + $config->data_start_row;
                $identifier = trim((string) ($row[$identifierCol] ?? ''));

                if ($identifier === '') {
                    $skipped++;
                    continue;
                }

                try {
                    $variant = $this->findVariant($identifier, $identifierType);

                    if (! $variant) {
                        $skipped++;
                        continue;
                    }

                    $updates = [];

                    if ($costCol !== null && isset($row[$costCol])) {
                        $cost = $this->parseNumber($row[$costCol]);
                        if ($cost !== null) {
                            $updates['cost_price'] = $cost;
                        }
                    }

                    if ($saleCol !== null && isset($row[$saleCol])) {
                        $sale = $this->parseNumber($row[$saleCol]);
                        if ($sale !== null) {
                            $updates['sale_price'] = $sale;
                        }
                    } elseif ($config->markup_pct && isset($updates['cost_price'])) {
                        $updates['sale_price'] = round($updates['cost_price'] * (1 + $config->markup_pct / 100), 2);
                    }

                    if (empty($updates)) {
                        $skipped++;
                        continue;
                    }

                    $wasChanged = collect($updates)->some(fn ($v, $k) => (string) $variant->$k !== (string) $v);

                    $variant->update($updates);

                    if ($config->price_list_id && isset($updates['sale_price'])) {
                        ProductPrice::updateOrCreate(
                            ['product_variant_id' => $variant->id, 'price_list_id' => $config->price_list_id],
                            ['price' => $updates['sale_price'], 'updated_at' => now()]
                        );
                    }

                    $wasChanged ? $updated++ : $skipped++;
                } catch (\Throwable $e) {
                    $failed++;
                    $errors[] = ['row' => $rowNum, 'identifier' => $identifier, 'error' => $e->getMessage()];
                }
            }

            DB::commit();
        } catch (\Throwable $e) {
            DB::rollBack();
            $log->update(['status' => 'failed', 'error_details' => [['row' => 0, 'error' => $e->getMessage()]]]);
            return;
        }

        $total = $created + $updated + $skipped + $failed;

        $log->update([
            'status'         => 'completed',
            'rows_total'     => $total,
            'rows_processed' => $created + $updated,
            'rows_created'   => $created,
            'rows_updated'   => $updated,
            'rows_skipped'   => $skipped,
            'rows_failed'    => $failed,
            'error_details'  => $errors ?: null,
            'imported_at'    => now(),
        ]);
    }

    private function findVariant(string $identifier, string $type): ?ProductVariant
    {
        return match ($type) {
            'sku'     => ProductVariant::where('sku', $identifier)->first(),
            'barcode' => ProductVariant::where('barcode', $identifier)->first(),
            'code'    => ProductVariant::whereHas('product', fn ($q) => $q->where('code', $identifier))->first(),
            default   => null,
        };
    }

    private function readFile(string $relativePath, SupplierPriceImportConfig $config): array
    {
        $fullPath = Storage::path($relativePath);

        if ($config->file_type === 'csv') {
            return $this->readCsv($fullPath, $config);
        }

        $spreadsheet = IOFactory::load($fullPath);
        $sheet       = $spreadsheet->getSheet($config->sheet_index);
        $all         = $sheet->toArray(null, true, true, false);

        return array_values(array_slice($all, $config->data_start_row - 1));
    }

    private function readCsv(string $fullPath, SupplierPriceImportConfig $config): array
    {
        $rows      = [];
        $handle    = fopen($fullPath, 'r');
        $lineNum   = 0;
        $delimiter = $config->csv_delimiter ?: ',';

        while (($row = fgetcsv($handle, 0, $delimiter)) !== false) {
            $lineNum++;
            if ($lineNum < $config->data_start_row) {
                continue;
            }
            if ($config->csv_encoding && strtoupper($config->csv_encoding) !== 'UTF-8') {
                $row = array_map(fn ($v) => mb_convert_encoding((string) $v, 'UTF-8', $config->csv_encoding), $row);
            }
            $rows[] = $row;
        }

        fclose($handle);
        return $rows;
    }

    private function parseNumber(mixed $value): ?float
    {
        if ($value === null || $value === '') {
            return null;
        }
        // Remove currency symbols, spaces; normalize decimal separator
        $clean = preg_replace('/[^0-9,.-]/', '', (string) $value);
        // If comma is used as decimal separator (e.g. "1.234,56")
        if (preg_match('/,\d{1,2}$/', $clean)) {
            $clean = str_replace(['.', ','], ['', '.'], $clean);
        } else {
            $clean = str_replace(',', '', $clean);
        }
        return is_numeric($clean) ? (float) $clean : null;
    }
}
