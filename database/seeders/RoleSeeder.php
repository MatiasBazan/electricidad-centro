<?php

namespace Database\Seeders;

use App\Models\Role;
use Illuminate\Database\Seeder;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        Role::upsert([
            [
                'name'        => 'Administrador',
                'slug'        => 'admin',
                'permissions' => json_encode(['*']),
            ],
            [
                'name'        => 'Vendedor',
                'slug'        => 'vendedor',
                'permissions' => json_encode([
                    'products.view',
                    'products.search',
                    'clients.view',
                    'clients.create',
                    'clients.update',
                    'sales.quotations.*',
                    'sales.orders.*',
                    'sales.deliveries.*',
                    'invoicing.view',
                    'invoicing.create',
                    'cash.view',
                    'cash.payments',
                ]),
            ],
        ], ['slug'], ['name', 'permissions']);
    }
}
