<?php

namespace Database\Factories;

use App\Models\AfipPos;
use Illuminate\Database\Eloquent\Factories\Factory;

class AfipPosFactory extends Factory
{
    protected $model = AfipPos::class;

    public function definition(): array
    {
        return [
            'number'    => fake()->unique()->numberBetween(1, 9999),
            'name'      => 'Caja ' . fake()->numerify('#'),
            'type'      => 'REC',
            'is_active' => true,
        ];
    }
}
