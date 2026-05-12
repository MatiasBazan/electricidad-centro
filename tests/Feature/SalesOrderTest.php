<?php

namespace Tests\Feature;

use App\Models\Client;
use App\Models\ClientAccount;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\SalesOrder;
use App\Models\SalesOrderItem;
use App\Models\Stock;
use App\Models\Warehouse;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SalesOrderTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_is_redirected_from_sales_index(): void
    {
        $this->get('/ventas')->assertRedirect('/login');
    }

    public function test_index_renders_order_list(): void
    {
        $this->actingAsUser();
        SalesOrder::factory()->count(2)->create();

        $this->get('/ventas')
             ->assertStatus(200)
             ->assertInertia(fn ($p) => $p->component('SalesOrders/Index'));
    }

    public function test_store_creates_order_and_reserves_stock(): void
    {
        $user      = $this->actingAsUser();
        $client    = Client::factory()->create();
        $warehouse = Warehouse::factory()->create();
        $product   = Product::factory()->create(['iva_rate' => 21.00, 'has_iva' => true]);
        $variant   = ProductVariant::factory()->create(['product_id' => $product->id, 'sale_price' => 100.00]);

        Stock::create([
            'product_variant_id' => $variant->id,
            'warehouse_id'       => $warehouse->id,
            'quantity'           => 10,
            'reserved_quantity'  => 0,
        ]);

        $response = $this->post('/ventas', [
            'client_id'    => $client->id,
            'warehouse_id' => $warehouse->id,
            'date'         => today()->format('Y-m-d'),
            'payment_type' => 'contado',
            'installments' => 1,
            'items'        => [
                [
                    'product_variant_id' => $variant->id,
                    'description'        => $product->name,
                    'quantity'           => 3,
                    'unit_price'         => 100.00,
                    'discount_pct'       => 0,
                ],
            ],
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('sales_orders', ['client_id' => $client->id, 'status' => 'pending']);
        $this->assertDatabaseHas('stock', [
            'product_variant_id' => $variant->id,
            'warehouse_id'       => $warehouse->id,
            'reserved_quantity'  => 3,
        ]);
    }

    public function test_store_with_cuenta_corriente_debits_client_account(): void
    {
        $this->actingAsUser();
        $client    = Client::factory()->create();
        $warehouse = Warehouse::factory()->create();
        $account   = ClientAccount::create(['client_id' => $client->id, 'balance' => 0]);

        $this->post('/ventas', [
            'client_id'    => $client->id,
            'warehouse_id' => $warehouse->id,
            'date'         => today()->format('Y-m-d'),
            'payment_type' => 'cuenta_corriente',
            'installments' => 1,
            'items'        => [
                [
                    'product_variant_id' => null,
                    'description'        => 'Servicio',
                    'quantity'           => 1,
                    'unit_price'         => 500.00,
                    'discount_pct'       => 0,
                ],
            ],
        ]);

        $this->assertDatabaseHas('client_accounts', ['id' => $account->id, 'balance' => 500.00]);
        $this->assertDatabaseHas('client_account_movements', [
            'client_account_id' => $account->id,
            'type'              => 'debit',
            'amount'            => 500.00,
        ]);
    }

    public function test_dispatch_decrements_stock_and_updates_status_to_delivered(): void
    {
        $user      = $this->actingAsUser();
        $client    = Client::factory()->create();
        $warehouse = Warehouse::factory()->create();
        $product   = Product::factory()->create();
        $variant   = ProductVariant::factory()->create(['product_id' => $product->id]);

        $order = SalesOrder::factory()->create([
            'client_id'    => $client->id,
            'user_id'      => $user->id,
            'warehouse_id' => $warehouse->id,
        ]);

        $item = SalesOrderItem::create([
            'sales_order_id'     => $order->id,
            'product_variant_id' => $variant->id,
            'description'        => 'Cable',
            'quantity'           => 5,
            'quantity_delivered' => 0,
            'unit_price'         => 100,
            'discount_pct'       => 0,
            'subtotal'           => 500,
            'sort_order'         => 0,
        ]);

        Stock::create([
            'product_variant_id' => $variant->id,
            'warehouse_id'       => $warehouse->id,
            'quantity'           => 10,
            'reserved_quantity'  => 5,
        ]);

        $response = $this->post("/ventas/{$order->id}/entregar", [
            'items' => [
                ['sales_order_item_id' => $item->id, 'quantity' => 5],
            ],
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('sales_orders', ['id' => $order->id, 'status' => 'delivered']);
        $this->assertDatabaseHas('stock', [
            'product_variant_id' => $variant->id,
            'quantity'           => 5,
            'reserved_quantity'  => 0,
        ]);
    }

    public function test_dispatch_partial_delivery_sets_status_to_partial(): void
    {
        $user      = $this->actingAsUser();
        $client    = Client::factory()->create();
        $warehouse = Warehouse::factory()->create();
        $variant   = ProductVariant::factory()->create();

        $order = SalesOrder::factory()->create([
            'client_id'    => $client->id,
            'user_id'      => $user->id,
            'warehouse_id' => $warehouse->id,
        ]);

        $item = SalesOrderItem::create([
            'sales_order_id'     => $order->id,
            'product_variant_id' => $variant->id,
            'description'        => 'Producto',
            'quantity'           => 10,
            'quantity_delivered' => 0,
            'unit_price'         => 50,
            'discount_pct'       => 0,
            'subtotal'           => 500,
            'sort_order'         => 0,
        ]);

        Stock::create([
            'product_variant_id' => $variant->id,
            'warehouse_id'       => $warehouse->id,
            'quantity'           => 10,
            'reserved_quantity'  => 10,
        ]);

        $this->post("/ventas/{$order->id}/entregar", [
            'items' => [['sales_order_item_id' => $item->id, 'quantity' => 4]],
        ]);

        $this->assertDatabaseHas('sales_orders', ['id' => $order->id, 'status' => 'partial']);
    }

    public function test_cancel_releases_reserved_stock(): void
    {
        $user      = $this->actingAsUser();
        $client    = Client::factory()->create();
        $warehouse = Warehouse::factory()->create();
        $variant   = ProductVariant::factory()->create();

        $order = SalesOrder::factory()->create([
            'client_id'    => $client->id,
            'user_id'      => $user->id,
            'warehouse_id' => $warehouse->id,
            'status'       => 'pending',
        ]);

        SalesOrderItem::create([
            'sales_order_id'     => $order->id,
            'product_variant_id' => $variant->id,
            'description'        => 'Item',
            'quantity'           => 3,
            'quantity_delivered' => 0,
            'unit_price'         => 100,
            'discount_pct'       => 0,
            'subtotal'           => 300,
            'sort_order'         => 0,
        ]);

        Stock::create([
            'product_variant_id' => $variant->id,
            'warehouse_id'       => $warehouse->id,
            'quantity'           => 10,
            'reserved_quantity'  => 3,
        ]);

        $response = $this->post("/ventas/{$order->id}/cancelar");

        $response->assertRedirect();
        $this->assertDatabaseHas('sales_orders', ['id' => $order->id, 'status' => 'cancelled']);
        $this->assertDatabaseHas('stock', [
            'product_variant_id' => $variant->id,
            'reserved_quantity'  => 0,
        ]);
    }

    public function test_cancel_cuenta_corriente_order_reverses_cc_movement(): void
    {
        $user      = $this->actingAsUser();
        $client    = Client::factory()->create();
        $warehouse = Warehouse::factory()->create();

        $order = SalesOrder::factory()->create([
            'client_id'    => $client->id,
            'user_id'      => $user->id,
            'warehouse_id' => $warehouse->id,
            'payment_type' => 'cuenta_corriente',
            'total'        => 800.00,
            'status'       => 'pending',
        ]);

        $account = ClientAccount::create(['client_id' => $client->id, 'balance' => 800.00]);

        $this->post("/ventas/{$order->id}/cancelar");

        $this->assertDatabaseHas('client_accounts', ['id' => $account->id, 'balance' => 0.00]);
        $this->assertDatabaseHas('client_account_movements', [
            'client_account_id' => $account->id,
            'type'              => 'credit',
            'amount'            => 800.00,
        ]);
    }

    public function test_cannot_cancel_invoiced_order(): void
    {
        $this->actingAsUser();
        $order = SalesOrder::factory()->create(['status' => 'invoiced']);

        $response = $this->post("/ventas/{$order->id}/cancelar");

        $response->assertRedirect();
        $response->assertSessionHas('error');
        $this->assertDatabaseHas('sales_orders', ['id' => $order->id, 'status' => 'invoiced']);
    }

    public function test_cannot_dispatch_delivered_order(): void
    {
        $this->actingAsUser();
        $order = SalesOrder::factory()->delivered()->create();

        $response = $this->post("/ventas/{$order->id}/entregar", [
            'items' => [['sales_order_item_id' => 999, 'quantity' => 1]],
        ]);

        $response->assertRedirect();
        $response->assertSessionHas('error');
    }
}
