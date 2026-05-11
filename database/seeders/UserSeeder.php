<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $adminRole   = Role::where('slug', 'admin')->value('id');
        $vendedorRole = Role::where('slug', 'vendedor')->value('id');

        User::upsert([
            [
                'role_id'   => $adminRole,
                'name'      => 'Administrador',
                'email'     => 'admin@electricidadcentro.com',
                'password'  => Hash::make('password'),
                'is_active' => 1,
            ],
            [
                'role_id'   => $vendedorRole,
                'name'      => 'Vendedor Demo',
                'email'     => 'vendedor@electricidadcentro.com',
                'password'  => Hash::make('password'),
                'is_active' => 1,
            ],
        ], ['email'], ['name', 'role_id', 'is_active']);
    }
}
