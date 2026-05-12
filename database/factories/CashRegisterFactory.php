<?php

namespace Database\Factories;

use App\Models\CashRegister;
use Illuminate\Database\Eloquent\Factories\Factory;

class CashRegisterFactory extends Factory
{
    protected $model = CashRegister::class;

    public function definition(): array
    {
        return [
            'name'      => 'Caja ' . fake()->numerify('#'),
            'location'  => 'Mostrador',
            'is_active' => true,
        ];
    }
}
