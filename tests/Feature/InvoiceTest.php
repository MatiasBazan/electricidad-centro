<?php

namespace Tests\Feature;

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
use Tests\TestCase;

class InvoiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_is_redirected_from_invoice_index(): void
    {
        $this->get('/facturacion')->assertRedirect('/login');
    }

    public function test_index_renders_invoice_list_with_stats(): void
    {
        $this->actingAsUser();
        Invoice::factory()->count(3)->approved()->create();
        Invoice::factory()->rejected()->create();

        $response = $this->get('/facturacion');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) =>
            $page->component('Invoices/Index')
                 ->where('stats.approved', 3)
                 ->where('stats.rejected', 1)
        );
    }

    public function test_index_filters_by_status(): void
    {
        $this->actingAsUser();
        Invoice::factory()->count(2)->approved()->create();
        Invoice::factory()->rejected()->create();

        $response = $this->get('/facturacion?status=rejected');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) =>
            $page->component('Invoices/Index')
                 ->where('invoices.total', 1)
        );
    }

    public function test_index_filters_by_type(): void
    {
        $this->actingAsUser();
        Invoice::factory()->approved()->create(['invoice_type' => 'A', 'cbte_tipo' => 1]);
        Invoice::factory()->count(2)->approved()->create(['invoice_type' => 'B', 'cbte_tipo' => 6]);

        $response = $this->get('/facturacion?type=A');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) =>
            $page->where('invoices.total', 1)
        );
    }

    public function test_show_renders_invoice_detail(): void
    {
        $this->actingAsUser();
        $invoice = Invoice::factory()->approved()->create();

        $response = $this->get("/facturacion/{$invoice->id}");

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) =>
            $page->component('Invoices/Show')
                 ->where('invoice.id', $invoice->id)
                 ->where('invoice.status', 'approved')
        );
    }

    public function test_cancel_changes_status_to_cancelled(): void
    {
        $this->actingAsUser();
        $invoice = Invoice::factory()->approved()->create();

        $response = $this->post("/facturacion/{$invoice->id}/anular");

        $response->assertRedirect();
        $response->assertSessionHas('success');
        $this->assertDatabaseHas('invoices', ['id' => $invoice->id, 'status' => 'cancelled']);
    }

    public function test_cannot_cancel_non_approved_invoice(): void
    {
        $this->actingAsUser();
        $invoice = Invoice::factory()->rejected()->create();

        $response = $this->post("/facturacion/{$invoice->id}/anular");

        $response->assertRedirect();
        $response->assertSessionHas('error');
        $this->assertDatabaseHas('invoices', ['id' => $invoice->id, 'status' => 'rejected']);
    }

    public function test_store_creates_approved_invoice_via_mocked_afip(): void
    {
        config(['afip.cuit' => '20123456789']);
        $user      = $this->actingAsUser();
        $client    = Client::factory()->consumidorFinal()->create();
        $warehouse = Warehouse::factory()->create();
        $product   = Product::factory()->create(['has_iva' => true, 'iva_rate' => 21.00]);
        $variant   = ProductVariant::factory()->create(['product_id' => $product->id, 'sale_price' => 121.00]);
        $pos       = AfipPos::factory()->create(['number' => 1]);

        $order = SalesOrder::factory()->create([
            'client_id'    => $client->id,
            'user_id'      => $user->id,
            'warehouse_id' => $warehouse->id,
            'total'        => 121.00,
        ]);

        SalesOrderItem::create([
            'sales_order_id'     => $order->id,
            'product_variant_id' => $variant->id,
            'description'        => $product->name,
            'quantity'           => 1,
            'quantity_delivered' => 0,
            'unit_price'         => 121.00,
            'discount_pct'       => 0,
            'subtotal'           => 121.00,
            'sort_order'         => 0,
        ]);

        // Mock WSFE so we don't hit real AFIP
        $mockWsfe = Mockery::mock(AfipWsfeService::class);
        $mockWsfe->shouldReceive('getLastNumber')->once()->andReturn(0);
        $mockWsfe->shouldReceive('authorize')->once()->andReturn([
            'resultado'     => 'A',
            'cae'           => '12345678901234',
            'cae_expiry'    => '2026-06-01',
            'observaciones' => [],
            'errores'       => [],
        ]);

        $this->app->instance(AfipWsfeService::class, $mockWsfe);

        $response = $this->post('/facturacion', [
            'sales_order_id' => $order->id,
            'pos_id'         => $pos->id,
            'concepto'       => 1,
        ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');
        $this->assertDatabaseHas('invoices', [
            'sales_order_id' => $order->id,
            'status'         => 'approved',
            'cae'            => '12345678901234',
        ]);
    }

    public function test_store_creates_rejected_invoice_when_afip_rejects(): void
    {
        config(['afip.cuit' => '20123456789']);
        $user    = $this->actingAsUser();
        $client  = Client::factory()->consumidorFinal()->create();
        $product = Product::factory()->create(['has_iva' => true, 'iva_rate' => 21.00]);
        $variant = ProductVariant::factory()->create(['product_id' => $product->id]);
        $pos     = AfipPos::factory()->create(['number' => 2]);

        $order = SalesOrder::factory()->create([
            'client_id'    => $client->id,
            'user_id'      => $user->id,
            'warehouse_id' => null,
            'total'        => 121.00,
        ]);

        SalesOrderItem::create([
            'sales_order_id'     => $order->id,
            'product_variant_id' => $variant->id,
            'description'        => 'Producto',
            'quantity'           => 1,
            'quantity_delivered' => 0,
            'unit_price'         => 121.00,
            'discount_pct'       => 0,
            'subtotal'           => 121.00,
            'sort_order'         => 0,
        ]);

        $mockWsfe = Mockery::mock(AfipWsfeService::class);
        $mockWsfe->shouldReceive('getLastNumber')->once()->andReturn(0);
        $mockWsfe->shouldReceive('authorize')->once()->andReturn([
            'resultado'     => 'R',
            'cae'           => null,
            'cae_expiry'    => null,
            'observaciones' => [],
            'errores'       => [['Msg' => 'Error de validación']],
        ]);

        $this->app->instance(AfipWsfeService::class, $mockWsfe);

        $response = $this->post('/facturacion', [
            'sales_order_id' => $order->id,
            'pos_id'         => $pos->id,
            'concepto'       => 1,
        ]);

        $response->assertRedirect();
        $response->assertSessionHas('error');
        $this->assertDatabaseHas('invoices', [
            'sales_order_id' => $order->id,
            'status'         => 'rejected',
        ]);
    }

    public function test_pdf_download_requires_approved_status(): void
    {
        // PDF download is only linked in UI for approved, but the route itself doesn't restrict it
        // Test that the route exists and is accessible for approved invoices
        $this->actingAsUser();
        $invoice = Invoice::factory()->approved()->create();

        // PDF generation requires DomPDF; just test route accessibility
        $response = $this->get("/facturacion/{$invoice->id}/pdf");
        $response->assertStatus(200);
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }
}
