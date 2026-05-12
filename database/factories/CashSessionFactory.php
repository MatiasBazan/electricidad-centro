<?php

namespace Database\Factories;

use App\Models\CashRegister;
use App\Models\CashSession;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class CashSessionFactory extends Factory
{
    protected $model = CashSession::class;

    public function definition(): array
    {
        return [
            'cash_register_id' => CashRegister::factory(),
            'user_id'          => User::factory(),
            'status'           => 'open',
            'opening_amount'   => 500.00,
            'opened_at'        => now(),
            'created_at'       => now(),
        ];
    }

    public function closed(): static
    {
        return $this->state([
            'status'         => 'closed',
            'closing_amount' => 500.00,
            'expected_cash'  => 500.00,
            'difference'     => 0,
            'closed_at'      => now(),
        ]);
    }
}
