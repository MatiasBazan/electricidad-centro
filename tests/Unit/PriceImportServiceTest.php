<?php

namespace Tests\Unit;

use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\PriceImportLog;
use App\Models\Supplier;
use App\Models\SupplierPriceImportConfig;
use App\Models\User;
use App\Services\PriceImportService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use ReflectionMethod;
use Tests\TestCase;

class PriceImportServiceTest extends TestCase
{
    use RefreshDatabase;

    private function parseNumber(mixed $value): ?float
    {
        $service = new PriceImportService();
        $method  = new ReflectionMethod($service, 'parseNumber');
        $method->setAccessible(true);
        return $method->invoke($service, $value);
    }

    // ── parseNumber ───────────────────────────────────────────────────────────

    public function test_parse_number_handles_standard_dot_decimal(): void
    {
        $this->assertEquals(1234.56, $this->parseNumber('1234.56'));
    }

    public function test_parse_number_handles_comma_decimal_format(): void
    {
        $this->assertEqualsWithDelta(1234.56, $this->parseNumber('1.234,56'), 0.001);
    }

    public function test_parse_number_strips_peso_sign(): void
    {
        $this->assertEqualsWithDelta(999.99, $this->parseNumber('$999.99'), 0.001);
    }

    public function test_parse_number_handles_integer_string(): void
    {
        $this->assertEqualsWithDelta(500.00, $this->parseNumber('500'), 0.001);
    }

    public function test_parse_number_returns_null_for_empty_string(): void
    {
        $this->assertNull($this->parseNumber(''));
    }

    public function test_parse_number_returns_null_for_null(): void
    {
        $this->assertNull($this->parseNumber(null));
    }

    public function test_parse_number_returns_null_for_non_numeric(): void
    {
        $this->assertNull($this->parseNumber('N/A'));
        $this->assertNull($this->parseNumber('precio'));
    }

    public function test_parse_number_handles_native_integer(): void
    {
        $this->assertEquals(1500.0, $this->parseNumber(1500));
    }

    public function test_parse_number_handles_thousands_separator_with_dot(): void
    {
        $this->assertEqualsWithDelta(1234.0, $this->parseNumber('1.234'), 0.01);
    }

    // ── findVariant ───────────────────────────────────────────────────────────

    public function test_find_variant_by_sku(): void
    {
        $variant = ProductVariant::factory()->create(['sku' => 'SKU-TEST-001']);

        $service = new PriceImportService();
        $method  = new ReflectionMethod($service, 'findVariant');
        $method->setAccessible(true);

        $found = $method->invoke($service, 'SKU-TEST-001', 'sku');

        $this->assertNotNull($found);
        $this->assertEquals($variant->id, $found->id);
    }

    public function test_find_variant_returns_null_for_unknown_sku(): void
    {
        $service = new PriceImportService();
        $method  = new ReflectionMethod($service, 'findVariant');
        $method->setAccessible(true);

        $this->assertNull($method->invoke($service, 'SKU-NONEXISTENT', 'sku'));
    }

    public function test_find_variant_by_barcode(): void
    {
        $variant = ProductVariant::factory()->create(['sku' => 'S1', 'barcode' => '7891234567890']);

        $service = new PriceImportService();
        $method  = new ReflectionMethod($service, 'findVariant');
        $method->setAccessible(true);

        $found = $method->invoke($service, '7891234567890', 'barcode');

        $this->assertNotNull($found);
        $this->assertEquals($variant->id, $found->id);
    }

    public function test_find_variant_by_product_code(): void
    {
        $product = Product::factory()->create(['code' => 'CABLE-001']);
        $variant = ProductVariant::factory()->create(['product_id' => $product->id]);

        $service = new PriceImportService();
        $method  = new ReflectionMethod($service, 'findVariant');
        $method->setAccessible(true);

        $found = $method->invoke($service, 'CABLE-001', 'code');

        $this->assertNotNull($found);
        $this->assertEquals($variant->id, $found->id);
    }

    // ── run() integration ─────────────────────────────────────────────────────

    private function makeSupplierAndConfig(array $configOverrides = []): array
    {
        $supplier = Supplier::create(['name' => 'Proveedor Test', 'is_active' => true]);
        $config   = SupplierPriceImportConfig::create(array_merge([
            'supplier_id'     => $supplier->id,
            'name'            => 'Config Test',
            'file_type'       => 'csv',
            'sheet_index'     => 0,
            'header_row'      => 1,
            'data_start_row'  => 1,
            'csv_delimiter'   => ',',
            'csv_encoding'    => 'UTF-8',
            'column_mappings' => [
                'identifier_type' => 'sku',
                'identifier'      => 1,
                'cost_price'      => 2,
                'sale_price'      => 3,
            ],
        ], $configOverrides));
        return [$supplier, $config];
    }

    private function makeLog(int $supplierId, int $configId, int $userId, string $filePath, string $fileName = 'test.csv'): PriceImportLog
    {
        return PriceImportLog::create([
            'supplier_id' => $supplierId,
            'config_id'   => $configId,
            'user_id'     => $userId,
            'file_name'   => $fileName,
            'file_path'   => $filePath,
            'status'      => 'pending',
        ]);
    }

    public function test_run_updates_variant_cost_and_sale_price(): void
    {
        Storage::fake('local');

        $user    = User::factory()->create();
        $variant = ProductVariant::factory()->create(['sku' => 'SKU-UPDATE', 'cost_price' => 50.00, 'sale_price' => 60.00]);

        Storage::put('imports/test.csv', "SKU-UPDATE,80.00,100.00\n");

        [$supplier, $config] = $this->makeSupplierAndConfig();
        $log = $this->makeLog($supplier->id, $config->id, $user->id, 'imports/test.csv');

        (new PriceImportService())->run($log, $config);

        $log->refresh();
        $this->assertEquals('completed', $log->status);
        $this->assertEquals(1, $log->rows_updated);

        $variant->refresh();
        $this->assertEquals(80.00, (float) $variant->cost_price);
        $this->assertEquals(100.00, (float) $variant->sale_price);
    }

    public function test_run_skips_rows_with_unknown_sku(): void
    {
        Storage::fake('local');

        $user = User::factory()->create();
        Storage::put('imports/unknown.csv', "SKU-NONEXISTENT,80.00,100.00\n");

        [$supplier, $config] = $this->makeSupplierAndConfig();
        $log = $this->makeLog($supplier->id, $config->id, $user->id, 'imports/unknown.csv', 'unknown.csv');

        (new PriceImportService())->run($log, $config);

        $log->refresh();
        $this->assertEquals('completed', $log->status);
        $this->assertEquals(0, $log->rows_updated);
        $this->assertEquals(1, $log->rows_skipped);
    }

    public function test_run_applies_markup_when_no_sale_price_column(): void
    {
        Storage::fake('local');

        $user    = User::factory()->create();
        $variant = ProductVariant::factory()->create(['sku' => 'SKU-MARKUP', 'cost_price' => 50.00, 'sale_price' => 0.00]);

        Storage::put('imports/markup.csv', "SKU-MARKUP,100.00\n");

        [$supplier, $config] = $this->makeSupplierAndConfig([
            'markup_pct'      => 30.0,
            'column_mappings' => [
                'identifier_type' => 'sku',
                'identifier'      => 1,
                'cost_price'      => 2,
            ],
        ]);

        $log = $this->makeLog($supplier->id, $config->id, $user->id, 'imports/markup.csv', 'markup.csv');

        (new PriceImportService())->run($log, $config);

        $variant->refresh();
        $this->assertEquals(100.00, (float) $variant->cost_price);
        $this->assertEquals(130.00, (float) $variant->sale_price); // 100 * 1.30
    }

    public function test_run_marks_log_as_failed_when_file_not_found(): void
    {
        Storage::fake('local');

        $user = User::factory()->create();

        [$supplier, $config] = $this->makeSupplierAndConfig();
        $log = $this->makeLog($supplier->id, $config->id, $user->id, 'imports/nonexistent.csv', 'nonexistent.csv');

        (new PriceImportService())->run($log, $config);

        $log->refresh();
        $this->assertEquals('failed', $log->status);
    }
}
