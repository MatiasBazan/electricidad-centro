<?php

namespace Database\Seeders;

use App\Models\CashRegister;
use Illuminate\Database\Seeder;

class CashRegisterSeeder extends Seeder
{
    public function run(): void
    {
        CashRegister::updateOrCreate(
            ['name' => 'Caja 1'],
            ['location' => 'Local principal', 'is_active' => true]
        );
    }
}
