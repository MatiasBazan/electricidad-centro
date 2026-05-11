<?php

namespace Database\Seeders;

use App\Models\PriceList;
use Illuminate\Database\Seeder;

class PriceListSeeder extends Seeder
{
    public function run(): void
    {
        PriceList::updateOrCreate(
            ['name' => 'Lista Minorista'],
            ['is_default' => true, 'currency' => 'ARS']
        );
        PriceList::updateOrCreate(
            ['name' => 'Lista Mayorista'],
            ['is_default' => false, 'currency' => 'ARS']
        );
    }
}
