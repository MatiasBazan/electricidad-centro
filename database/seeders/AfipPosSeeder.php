<?php

namespace Database\Seeders;

use App\Models\AfipPos;
use Illuminate\Database\Seeder;

class AfipPosSeeder extends Seeder
{
    public function run(): void
    {
        AfipPos::updateOrCreate(
            ['number' => 1],
            ['name' => 'Punto de venta 00001', 'type' => 'REC', 'is_active' => true]
        );
    }
}
