<?php

namespace Database\Factories;

use App\Models\Warehouse;
use Illuminate\Database\Eloquent\Factories\Factory;

class WarehouseFactory extends Factory
{
    protected $model = Warehouse::class;

    public function definition(): array
    {
        return [
            'name'      => fake()->randomElement(['Depósito Principal', 'Depósito Sur', 'Sala de Ventas']) . ' ' . fake()->numerify('#'),
            'code'      => fake()->unique()->bothify('DEP-##'),
            'is_main'   => false,
            'is_active' => true,
        ];
    }
}
