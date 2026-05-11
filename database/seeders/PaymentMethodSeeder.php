<?php

namespace Database\Seeders;

use App\Models\PaymentMethod;
use Illuminate\Database\Seeder;

class PaymentMethodSeeder extends Seeder
{
    public function run(): void
    {
        $methods = [
            ['name' => 'Efectivo',              'type' => 'efectivo',        'surcharge_pct' => 0,  'sort_order' => 1],
            ['name' => 'Transferencia',         'type' => 'transferencia',   'surcharge_pct' => 0,  'sort_order' => 2],
            ['name' => 'Tarjeta Débito',        'type' => 'tarjeta_debito',  'surcharge_pct' => 0,  'sort_order' => 3],
            ['name' => 'Tarjeta Crédito 1 cuota','type' => 'tarjeta_credito','surcharge_pct' => 0,  'sort_order' => 4],
            ['name' => 'Tarjeta Crédito cuotas','type' => 'tarjeta_credito', 'surcharge_pct' => 15, 'sort_order' => 5],
            ['name' => 'Cuenta Corriente',      'type' => 'cuenta_corriente','surcharge_pct' => 0,  'sort_order' => 6],
            ['name' => 'QR / Billetera digital','type' => 'qr',              'surcharge_pct' => 0,  'sort_order' => 7],
        ];

        foreach ($methods as $method) {
            PaymentMethod::updateOrCreate(
                ['name' => $method['name']],
                array_merge($method, ['is_active' => true])
            );
        }
    }
}
