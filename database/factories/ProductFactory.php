<?php

namespace Database\Factories;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Database\Eloquent\Factories\Factory;

class ProductFactory extends Factory
{
    protected $model = Product::class;

    public function definition(): array
    {
        return [
            'category_id' => Category::factory(),
            'code'        => fake()->unique()->bothify('PROD-####'),
            'name'        => fake()->words(3, true),
            'type'        => 'simple',
            'unit'        => 'unidad',
            'min_stock'   => 0,
            'has_iva'     => true,
            'iva_rate'    => 21.00,
            'is_active'   => true,
        ];
    }

    public function exempt(): static
    {
        return $this->state(['has_iva' => false, 'iva_rate' => 0]);
    }

    public function ivaReduced(): static
    {
        return $this->state(['has_iva' => true, 'iva_rate' => 10.5]);
    }
}
