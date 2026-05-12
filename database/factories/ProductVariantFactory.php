<?php

namespace Database\Factories;

use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Database\Eloquent\Factories\Factory;

class ProductVariantFactory extends Factory
{
    protected $model = ProductVariant::class;

    public function definition(): array
    {
        return [
            'product_id'  => Product::factory(),
            'sku'         => fake()->unique()->bothify('SKU-#####'),
            'cost_price'  => 100.00,
            'sale_price'  => 121.00,
            'is_active'   => true,
        ];
    }
}
