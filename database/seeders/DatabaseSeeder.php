<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Datos base — corren siempre (idempotentes con updateOrCreate)
        $this->call([
            RoleSeeder::class,
            UserSeeder::class,
            CategorySeeder::class,
            ProductAttributeTypeSeeder::class,
            WarehouseSeeder::class,
            PriceListSeeder::class,
            PaymentMethodSeeder::class,
            CashRegisterSeeder::class,
            AfipPosSeeder::class,
        ]);
    }
}
