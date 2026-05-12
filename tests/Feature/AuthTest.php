<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_page_is_accessible_to_guests(): void
    {
        $response = $this->get('/login');
        $response->assertStatus(200);
    }

    public function test_authenticated_user_is_redirected_from_login_page(): void
    {
        $this->actingAsUser();
        $response = $this->get('/login');
        $response->assertRedirect('/dashboard');
    }

    public function test_guest_is_redirected_to_login_when_accessing_protected_route(): void
    {
        $response = $this->get('/dashboard');
        $response->assertRedirect('/login');
    }

    public function test_user_can_login_with_valid_credentials(): void
    {
        $role = Role::factory()->create(['slug' => 'vendedor']);
        $user = User::factory()->create([
            'role_id'  => $role->id,
            'email'    => 'test@test.com',
            'password' => Hash::make('secret123'),
        ]);

        $response = $this->post('/login', [
            'email'    => 'test@test.com',
            'password' => 'secret123',
        ]);

        $response->assertRedirect('/dashboard');
        $this->assertAuthenticatedAs($user);
    }

    public function test_login_fails_with_wrong_password(): void
    {
        $role = Role::factory()->create(['slug' => 'vendedor']);
        User::factory()->create([
            'role_id'  => $role->id,
            'email'    => 'test@test.com',
            'password' => Hash::make('correct'),
        ]);

        $response = $this->post('/login', [
            'email'    => 'test@test.com',
            'password' => 'wrong',
        ]);

        $response->assertSessionHasErrors();
        $this->assertGuest();
    }

    public function test_login_fails_with_inactive_user(): void
    {
        $role = Role::factory()->create(['slug' => 'vendedor']);
        User::factory()->create([
            'role_id'   => $role->id,
            'email'     => 'inactive@test.com',
            'password'  => Hash::make('password'),
            'is_active' => false,
        ]);

        $response = $this->post('/login', [
            'email'    => 'inactive@test.com',
            'password' => 'password',
        ]);

        $response->assertSessionHasErrors();
        $this->assertGuest();
    }

    public function test_authenticated_user_can_logout(): void
    {
        $this->actingAsUser();

        $response = $this->post('/logout');

        $response->assertRedirect('/login');
        $this->assertGuest();
    }
}
