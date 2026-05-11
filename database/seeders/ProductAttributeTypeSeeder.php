<?php

namespace Database\Seeders;

use App\Models\ProductAttributeType;
use App\Models\ProductAttributeValue;
use Illuminate\Database\Seeder;

class ProductAttributeTypeSeeder extends Seeder
{
    public function run(): void
    {
        $types = [
            [
                'name' => 'Talle',
                'slug' => 'talle',
                'values' => ['XS', 'S', 'M', 'L', 'XL', 'XXL', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45'],
            ],
            [
                'name' => 'Color',
                'slug' => 'color',
                'values' => ['Negro', 'Blanco', 'Gris', 'Rojo', 'Azul', 'Verde', 'Naranja', 'Amarillo', 'Marrón'],
            ],
            [
                'name' => 'Modelo',
                'slug' => 'modelo',
                'values' => ['Estándar', 'Premium', 'Industrial', 'Doméstico', 'Profesional'],
            ],
        ];

        foreach ($types as $typeData) {
            $type = ProductAttributeType::updateOrCreate(
                ['slug' => $typeData['slug']],
                ['name' => $typeData['name']]
            );

            foreach ($typeData['values'] as $sort => $value) {
                ProductAttributeValue::updateOrCreate(
                    ['product_attribute_type_id' => $type->id, 'value' => $value],
                    ['sort_order' => $sort]
                );
            }
        }
    }
}
