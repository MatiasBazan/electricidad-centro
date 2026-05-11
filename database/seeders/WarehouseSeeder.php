<?php

namespace Database\Seeders;

use App\Models\Warehouse;
use Illuminate\Database\Seeder;

class WarehouseSeeder extends Seeder
{
    public function run(): void
    {
        Warehouse::updateOrCreate(
            ['code' => 'DEP-01'],
            ['name' => 'Depósito Principal', 'is_main' => true, 'is_active' => true]
        );
    }
}
