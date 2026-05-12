<?php

namespace Database\Factories;

use App\Models\Client;
use App\Models\SalesOrder;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class SalesOrderFactory extends Factory
{
    protected $model = SalesOrder::class;

    public function definition(): array
    {
        return [
            'client_id'       => Client::factory(),
            'user_id'         => User::factory(),
            'number'          => 'VTA-' . fake()->unique()->numerify('######'),
            'status'          => 'pending',
            'date'            => today(),
            'payment_type'    => 'contado',
            'installments'    => 1,
            'cash_discount_pct' => 0,
            'subtotal'        => 1000.00,
            'discount_amount' => 0,
            'tax_amount'      => 0,
            'total'           => 1000.00,
        ];
    }

    public function cuentaCorriente(): static
    {
        return $this->state(['payment_type' => 'cuenta_corriente']);
    }

    public function delivered(): static
    {
        return $this->state(['status' => 'delivered']);
    }

    public function cancelled(): static
    {
        return $this->state(['status' => 'cancelled']);
    }
}
