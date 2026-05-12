<?php

namespace Tests\Unit;

use App\Models\AfipPos;
use App\Models\Client;
use App\Models\Invoice;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\SalesOrder;
use App\Models\SalesOrderItem;
use App\Models\Warehouse;
use App\Services\Afip\AfipInvoiceService;
use App\Services\Afip\AfipWsfeService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Mockery;
use ReflectionMethod;
use Tests\TestCase;

class AfipInvoiceServiceTest extends TestCase
{
    use RefreshDatabase;

    private function makeService(array $wsfeExpectations = []): AfipInvoiceService
    {
        $mock = Mockery::mock(AfipWsfeService::class);
        $mock->shouldReceive('getLastNumber')->andReturn(0)->byDefault();
        $mock->shouldReceive('authorize')->andReturn([
            'resultado'     => 'A',
            'cae'           => '12345678901234',
            'cae_expiry'    => '2026-06-01',
            'observaciones' => [],
            'errores'       => [],
        ])->byDefault();

        foreach ($wsfeExpectations as $method => $return) {
            $mock->shouldReceive($method)->andReturn($return);
        }

        return new AfipInvoiceService($mock);
    }

    private function makeOrder(Client $client, array $items): SalesOrder
    {
        $order = SalesOrder::factory()->create(['client_id' => $client->id]);
        foreach ($items as $i => $itemData) {
            SalesOrderItem::create(array_merge([
                'sales_order_id'     => $order->id,
                'description'        => 'Item',
                'quantity'           => 1,
                'quantity_delivered' => 0,
                'unit_price'         => 100,
                'discount_pct'       => 0,
                'sort_order'         => $i,
            ], $itemData));
        }
        return $order->load('items.variant.product');
    }

    // ── resolveDoc ────────────────────────────────────────────────────────────

    public function test_resolve_doc_returns_cuit_for_factura_a(): void
    {
        $client = new Client(['tax_condition' => 'responsable_inscripto', 'cuit_cuil' => '20-12345678-9']);
        $service = $this->makeService();

        $method = new ReflectionMethod($service, 'resolveDoc');
        $method->setAccessible(true);
        [$docTipo, $docNro] = $method->invoke($service, $client, 'A');

        $this->assertEquals(80, $docTipo);
        $this->assertEquals('20123456789', $docNro);
    }

    public function test_resolve_doc_returns_cf_for_consumidor_final_factura_b(): void
    {
        $client  = new Client(['tax_condition' => 'consumidor_final', 'cuit_cuil' => null]);
        $service = $this->makeService();

        $method = new ReflectionMethod($service, 'resolveDoc');
        $method->setAccessible(true);
        [$docTipo, $docNro] = $method->invoke($service, $client, 'B');

        $this->assertEquals(99, $docTipo);
        $this->assertEquals(0, $docNro);
    }

    public function test_resolve_doc_uses_cuit_for_monotributista_factura_b(): void
    {
        $client  = new Client(['tax_condition' => 'monotributista', 'cuit_cuil' => '27-98765432-1']);
        $service = $this->makeService();

        $method = new ReflectionMethod($service, 'resolveDoc');
        $method->setAccessible(true);
        [$docTipo, $docNro] = $method->invoke($service, $client, 'B');

        $this->assertEquals(80, $docTipo);
        $this->assertEquals('27987654321', $docNro);
    }

    // ── buildItems ────────────────────────────────────────────────────────────

    public function test_build_items_calculates_21_pct_iva_correctly(): void
    {
        $product = Product::factory()->create(['has_iva' => true, 'iva_rate' => 21.00]);
        $variant = ProductVariant::factory()->create(['product_id' => $product->id]);
        $client  = Client::factory()->consumidorFinal()->create();

        // 1 unit at 121 (with IVA): net = 100, iva = 21
        $order = $this->makeOrder($client, [[
            'product_variant_id' => $variant->id,
            'quantity'           => 1,
            'subtotal'           => 121.00,
        ]]);

        $service = $this->makeService();
        $method  = new ReflectionMethod($service, 'buildItems');
        $method->setAccessible(true);

        [$items, $netTaxed, $netExempt, $ivaTotal, $breakdown] = $method->invoke($service, $order);

        $this->assertEqualsWithDelta(100.00, $netTaxed, 0.01);
        $this->assertEqualsWithDelta(0.00, $netExempt, 0.01);
        $this->assertEqualsWithDelta(21.00, $ivaTotal, 0.01);
        $this->assertCount(1, $breakdown);
        $this->assertEquals(5, $breakdown[0]['Id']); // 21% iva_id=5
        $this->assertEqualsWithDelta(100.00, $breakdown[0]['BaseImp'], 0.01);
        $this->assertEqualsWithDelta(21.00, $breakdown[0]['Importe'], 0.01);
    }

    public function test_build_items_handles_exempt_products(): void
    {
        $product = Product::factory()->exempt()->create();
        $variant = ProductVariant::factory()->create(['product_id' => $product->id]);
        $client  = Client::factory()->consumidorFinal()->create();

        $order = $this->makeOrder($client, [[
            'product_variant_id' => $variant->id,
            'quantity'           => 1,
            'subtotal'           => 100.00,
        ]]);

        $service = $this->makeService();
        $method  = new ReflectionMethod($service, 'buildItems');
        $method->setAccessible(true);

        [$items, $netTaxed, $netExempt, $ivaTotal, $breakdown] = $method->invoke($service, $order);

        $this->assertEqualsWithDelta(0.00, $netTaxed, 0.01);
        $this->assertEqualsWithDelta(100.00, $netExempt, 0.01);
        $this->assertEqualsWithDelta(0.00, $ivaTotal, 0.01);
        $this->assertCount(0, $breakdown);
    }

    public function test_build_items_handles_mixed_iva_rates(): void
    {
        $product21  = Product::factory()->create(['has_iva' => true, 'iva_rate' => 21.00]);
        $product105 = Product::factory()->ivaReduced()->create();
        $variant21  = ProductVariant::factory()->create(['product_id' => $product21->id]);
        $variant105 = ProductVariant::factory()->create(['product_id' => $product105->id]);
        $client     = Client::factory()->create();

        // 121 at 21%, 110.5 at 10.5%
        $order = $this->makeOrder($client, [
            ['product_variant_id' => $variant21->id,  'quantity' => 1, 'subtotal' => 121.00],
            ['product_variant_id' => $variant105->id, 'quantity' => 1, 'subtotal' => 110.50],
        ]);

        $service = $this->makeService();
        $method  = new ReflectionMethod($service, 'buildItems');
        $method->setAccessible(true);

        [$items, $netTaxed, $netExempt, $ivaTotal, $breakdown] = $method->invoke($service, $order);

        // net21 = 100, iva21 = 21; net105 = 100, iva105 = 10.5
        $this->assertEqualsWithDelta(200.00, $netTaxed, 0.01);
        $this->assertEqualsWithDelta(31.50, $ivaTotal, 0.02);
        $this->assertCount(2, $breakdown);
    }

    // ── buildWsfeRequest ──────────────────────────────────────────────────────

    public function test_build_wsfe_request_uses_single_object_for_one_iva_rate(): void
    {
        $service = $this->makeService();
        $method  = new ReflectionMethod($service, 'buildWsfeRequest');
        $method->setAccessible(true);

        $req = $method->invoke(
            $service,
            1, 6, 1, 1, 99, 0,
            100.00, 0.00, 21.00, 121.00,
            [['Id' => 5, 'BaseImp' => 100.00, 'Importe' => 21.00]]
        );

        // With single aliciva, it should be the object itself (not an array of objects)
        $this->assertIsArray($req['FeDetReq']['FECAEDetRequest']['Iva']['AlicIva']);
        $this->assertArrayHasKey('Id', $req['FeDetReq']['FECAEDetRequest']['Iva']['AlicIva']);
    }

    public function test_build_wsfe_request_uses_array_for_multiple_iva_rates(): void
    {
        $service = $this->makeService();
        $method  = new ReflectionMethod($service, 'buildWsfeRequest');
        $method->setAccessible(true);

        $breakdown = [
            ['Id' => 5,  'BaseImp' => 100.00, 'Importe' => 21.00],
            ['Id' => 4,  'BaseImp' => 100.00, 'Importe' => 10.50],
        ];

        $req = $method->invoke(
            $service,
            1, 6, 1, 1, 99, 0,
            200.00, 0.00, 31.50, 231.50,
            $breakdown
        );

        $alicIva = $req['FeDetReq']['FECAEDetRequest']['Iva']['AlicIva'];
        $this->assertCount(2, $alicIva);
        $this->assertArrayHasKey(0, $alicIva);
    }

    public function test_build_wsfe_request_omits_iva_when_no_breakdown(): void
    {
        $service = $this->makeService();
        $method  = new ReflectionMethod($service, 'buildWsfeRequest');
        $method->setAccessible(true);

        $req = $method->invoke(
            $service,
            1, 6, 1, 1, 99, 0,
            0.00, 100.00, 0.00, 100.00,
            []
        );

        $this->assertArrayNotHasKey('Iva', $req['FeDetReq']['FECAEDetRequest']);
    }

    // ── authorizeFromOrder integration ────────────────────────────────────────

    public function test_authorize_from_order_creates_approved_invoice(): void
    {
        config(['afip.cuit' => '20123456789']);

        $client  = Client::factory()->consumidorFinal()->create();
        $product = Product::factory()->create(['has_iva' => true, 'iva_rate' => 21.00]);
        $variant = ProductVariant::factory()->create(['product_id' => $product->id]);
        $pos     = AfipPos::factory()->create(['number' => 1]);
        $user    = \App\Models\User::factory()->create();

        $order = $this->makeOrder($client, [[
            'product_variant_id' => $variant->id,
            'quantity'           => 1,
            'subtotal'           => 121.00,
        ]]);

        $service = $this->makeService();
        $invoice = $service->authorizeFromOrder($order, $pos->id, 1, $user->id);

        $this->assertEquals('approved', $invoice->status);
        $this->assertEquals('12345678901234', $invoice->cae);
        $this->assertDatabaseHas('invoice_items', ['invoice_id' => $invoice->id]);
    }

    public function test_authorize_from_order_creates_rejected_invoice_on_afip_rejection(): void
    {
        config(['afip.cuit' => '20123456789']);

        $client  = Client::factory()->consumidorFinal()->create();
        $product = Product::factory()->create(['has_iva' => true, 'iva_rate' => 21.00]);
        $variant = ProductVariant::factory()->create(['product_id' => $product->id]);
        $pos     = AfipPos::factory()->create(['number' => 3]);
        $user    = \App\Models\User::factory()->create();

        $order = $this->makeOrder($client, [[
            'product_variant_id' => $variant->id,
            'quantity'           => 1,
            'subtotal'           => 121.00,
        ]]);

        $mock = Mockery::mock(AfipWsfeService::class);
        $mock->shouldReceive('getLastNumber')->andReturn(0);
        $mock->shouldReceive('authorize')->andReturn([
            'resultado'     => 'R',
            'cae'           => null,
            'cae_expiry'    => null,
            'observaciones' => [],
            'errores'       => [['Msg' => 'CUIT inválido']],
        ]);

        $service = new AfipInvoiceService($mock);
        $invoice = $service->authorizeFromOrder($order, $pos->id, 1, $user->id);

        $this->assertEquals('rejected', $invoice->status);
        $this->assertNull($invoice->cae);
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }
}
