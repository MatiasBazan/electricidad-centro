<?php

namespace Tests\Feature;

use App\Models\CashMovement;
use App\Models\CashRegister;
use App\Models\CashSession;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CashTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_is_redirected_from_cash_index(): void
    {
        $this->get('/caja')->assertRedirect('/login');
    }

    public function test_index_renders_when_no_session_open(): void
    {
        $this->actingAsUser();

        $this->get('/caja')
             ->assertStatus(200)
             ->assertInertia(fn ($p) =>
                 $p->component('Cash/Index')->where('open_session', null)
             );
    }

    public function test_open_creates_cash_session(): void
    {
        $user     = $this->actingAsUser();
        $register = CashRegister::factory()->create();

        $response = $this->post('/caja/abrir', [
            'cash_register_id' => $register->id,
            'opening_amount'   => 500.00,
        ]);

        $response->assertRedirect('/caja');
        $response->assertSessionHas('success');
        $this->assertDatabaseHas('cash_sessions', [
            'cash_register_id' => $register->id,
            'user_id'          => $user->id,
            'status'           => 'open',
            'opening_amount'   => 500.00,
        ]);
    }

    public function test_cannot_open_second_session_for_same_register(): void
    {
        $user     = $this->actingAsUser();
        $register = CashRegister::factory()->create();

        CashSession::factory()->create([
            'cash_register_id' => $register->id,
            'user_id'          => $user->id,
            'status'           => 'open',
        ]);

        $response = $this->post('/caja/abrir', [
            'cash_register_id' => $register->id,
            'opening_amount'   => 200.00,
        ]);

        $response->assertRedirect();
        $response->assertSessionHas('error');
        $this->assertDatabaseCount('cash_sessions', 1);
    }

    public function test_open_validates_required_fields(): void
    {
        $this->actingAsUser();

        $response = $this->post('/caja/abrir', []);

        $response->assertSessionHasErrors(['cash_register_id', 'opening_amount']);
    }

    public function test_close_calculates_expected_cash_correctly(): void
    {
        $user     = $this->actingAsUser();
        $register = CashRegister::factory()->create();

        $session = CashSession::factory()->create([
            'cash_register_id' => $register->id,
            'user_id'          => $user->id,
            'status'           => 'open',
            'opening_amount'   => 1000.00,
        ]);

        // Add manual movements
        CashMovement::create([
            'cash_session_id' => $session->id,
            'user_id'         => $user->id,
            'type'            => 'income',
            'amount'          => 200.00,
            'description'     => 'Ingreso extra',
            'created_at'      => now(),
        ]);
        CashMovement::create([
            'cash_session_id' => $session->id,
            'user_id'         => $user->id,
            'type'            => 'expense',
            'amount'          => 100.00,
            'description'     => 'Gasto',
            'created_at'      => now(),
        ]);

        // expected_cash = 1000 (opening) + 0 (efectivo payments) + 200 (income) - 100 (expense) = 1100
        $response = $this->post("/caja/{$session->id}/cerrar", [
            'closing_amount' => 1050.00,
        ]);

        $response->assertRedirect('/caja');
        $response->assertSessionHas('success');

        $session->refresh();
        $this->assertEquals('closed', $session->status);
        $this->assertEquals(1100.00, (float) $session->expected_cash);
        $this->assertEquals(-50.00, (float) $session->difference); // 1050 - 1100
    }

    public function test_cannot_close_already_closed_session(): void
    {
        $user     = $this->actingAsUser();
        $register = CashRegister::factory()->create();

        $session = CashSession::factory()->closed()->create([
            'cash_register_id' => $register->id,
            'user_id'          => $user->id,
        ]);

        $response = $this->post("/caja/{$session->id}/cerrar", [
            'closing_amount' => 500.00,
        ]);

        $response->assertRedirect();
        $response->assertSessionHas('error');
        $this->assertDatabaseHas('cash_sessions', ['id' => $session->id, 'status' => 'closed']);
    }

    public function test_add_movement_creates_income_record(): void
    {
        $user     = $this->actingAsUser();
        $register = CashRegister::factory()->create();

        $session = CashSession::factory()->create([
            'cash_register_id' => $register->id,
            'user_id'          => $user->id,
            'status'           => 'open',
        ]);

        $response = $this->post("/caja/{$session->id}/movimiento", [
            'type'        => 'income',
            'amount'      => 350.00,
            'description' => 'Cobro adicional',
        ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');
        $this->assertDatabaseHas('cash_movements', [
            'cash_session_id' => $session->id,
            'type'            => 'income',
            'amount'          => 350.00,
        ]);
    }

    public function test_add_movement_rejects_on_closed_session(): void
    {
        $user     = $this->actingAsUser();
        $register = CashRegister::factory()->create();

        $session = CashSession::factory()->closed()->create([
            'cash_register_id' => $register->id,
            'user_id'          => $user->id,
        ]);

        $response = $this->post("/caja/{$session->id}/movimiento", [
            'type'        => 'expense',
            'amount'      => 50.00,
            'description' => 'Test',
        ]);

        $response->assertRedirect();
        $response->assertSessionHas('error');
        $this->assertDatabaseCount('cash_movements', 0);
    }

    public function test_add_movement_validates_required_fields(): void
    {
        $user     = $this->actingAsUser();
        $register = CashRegister::factory()->create();

        $session = CashSession::factory()->create([
            'cash_register_id' => $register->id,
            'user_id'          => $user->id,
        ]);

        $response = $this->post("/caja/{$session->id}/movimiento", []);

        $response->assertSessionHasErrors(['type', 'amount', 'description']);
    }
}
