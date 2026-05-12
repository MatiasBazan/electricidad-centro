<?php

namespace Tests\Feature;

use App\Models\Client;
use App\Models\ClientAccount;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ClientTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_is_redirected_from_clients_index(): void
    {
        $this->get('/clientes')->assertRedirect('/login');
    }

    public function test_index_renders_client_list(): void
    {
        $this->actingAsUser();
        Client::factory()->count(3)->create();

        $response = $this->get('/clientes');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page->component('Clients/Index'));
    }

    public function test_index_filters_by_name_search(): void
    {
        $this->actingAsUser();
        Client::factory()->create(['name' => 'Empresa ABC']);
        Client::factory()->create(['name' => 'Otro Cliente']);

        $response = $this->get('/clientes?search=ABC');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) =>
            $page->component('Clients/Index')
                 ->where('clients.total', 1)
        );
    }

    public function test_store_creates_client_and_account(): void
    {
        $this->actingAsUser();

        $response = $this->post('/clientes', [
            'type'          => 'empresa',
            'name'          => 'Test SA',
            'tax_condition' => 'responsable_inscripto',
            'document_type' => 'cuit',
            'is_active'     => true,
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('clients', ['name' => 'Test SA']);
        $client = Client::where('name', 'Test SA')->first();
        $this->assertDatabaseHas('client_accounts', ['client_id' => $client->id, 'balance' => 0]);
    }

    public function test_store_validates_required_fields(): void
    {
        $this->actingAsUser();

        $response = $this->post('/clientes', []);

        $response->assertSessionHasErrors(['name', 'type', 'tax_condition']);
    }

    public function test_show_displays_client_detail(): void
    {
        $this->actingAsUser();
        $client = Client::factory()->create();
        ClientAccount::create(['client_id' => $client->id, 'balance' => 0]);

        $response = $this->get("/clientes/{$client->id}");

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) =>
            $page->component('Clients/Show')
                 ->where('client.id', $client->id)
        );
    }

    public function test_update_modifies_client(): void
    {
        $this->actingAsUser();
        $client = Client::factory()->create(['name' => 'Nombre Viejo']);

        $response = $this->put("/clientes/{$client->id}", [
            'type'          => $client->type,
            'name'          => 'Nombre Nuevo',
            'tax_condition' => $client->tax_condition,
            'document_type' => $client->document_type,
            'is_active'     => true,
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('clients', ['id' => $client->id, 'name' => 'Nombre Nuevo']);
    }

    public function test_destroy_soft_deletes_client(): void
    {
        $this->actingAsUser();
        $client = Client::factory()->create();

        $response = $this->delete("/clientes/{$client->id}");

        $response->assertRedirect('/clientes');
        $this->assertSoftDeleted('clients', ['id' => $client->id]);
    }

    public function test_add_movement_debits_account(): void
    {
        $this->actingAsUser();
        $client  = Client::factory()->create();
        $account = ClientAccount::create(['client_id' => $client->id, 'balance' => 0]);

        $response = $this->post("/clientes/{$client->id}/movimiento", [
            'type'        => 'debit',
            'amount'      => 500.00,
            'description' => 'Venta manual',
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('client_account_movements', [
            'client_account_id' => $account->id,
            'type'              => 'debit',
            'amount'            => 500.00,
        ]);
        $this->assertDatabaseHas('client_accounts', ['id' => $account->id, 'balance' => 500.00]);
    }

    public function test_add_movement_credits_account(): void
    {
        $this->actingAsUser();
        $client  = Client::factory()->create();
        $account = ClientAccount::create(['client_id' => $client->id, 'balance' => 1000.00]);

        $this->post("/clientes/{$client->id}/movimiento", [
            'type'        => 'credit',
            'amount'      => 300.00,
            'description' => 'Pago parcial',
        ]);

        $this->assertDatabaseHas('client_accounts', ['id' => $account->id, 'balance' => 700.00]);
    }

    public function test_add_movement_rejects_invalid_type(): void
    {
        $this->actingAsUser();
        $client = Client::factory()->create();
        ClientAccount::create(['client_id' => $client->id, 'balance' => 0]);

        $response = $this->post("/clientes/{$client->id}/movimiento", [
            'type'   => 'invalid',
            'amount' => 100,
        ]);

        $response->assertSessionHasErrors(['type']);
    }
}
