<?php

namespace Tests;

use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    protected function actingAsUser(array $roleAttributes = []): User
    {
        $role = Role::factory()->create(
            $roleAttributes ?: ['name' => 'Vendedor', 'slug' => 'vendedor']
        );
        $user = User::factory()->create(['role_id' => $role->id]);
        $this->actingAs($user);
        return $user;
    }

    protected function actingAsAdmin(): User
    {
        $role = Role::factory()->admin()->create();
        $user = User::factory()->create(['role_id' => $role->id]);
        $this->actingAs($user);
        return $user;
    }
}
