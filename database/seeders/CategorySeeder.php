<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $tree = [
            ['name' => 'Ferretería', 'rubro' => 'ferreteria', 'children' => [
                'Herramientas manuales',
                'Herramientas eléctricas',
                'Fijaciones y tornillería',
                'Pinturas y revestimientos',
                'Plomería y sanitarios',
                'Construcción',
                'Adhesivos y selladores',
            ]],
            ['name' => 'Electricidad', 'rubro' => 'electricidad', 'children' => [
                'Iluminación',
                'Cables y conductores',
                'Tableros y protecciones',
                'Enchufes y tomas',
                'Automatización y domótica',
                'Baterías y UPS',
                'Materiales de instalación',
            ]],
            ['name' => 'Ropa de trabajo', 'rubro' => 'ropa', 'children' => [
                'Calzado de seguridad',
                'Ropa ignífuga',
                'Ropa de alta visibilidad',
                'EPP - Equipos de protección',
                'Guantes y accesorios',
            ]],
            ['name' => 'Otros', 'rubro' => 'otros', 'children' => []],
        ];

        foreach ($tree as $sort => $item) {
            $parent = Category::updateOrCreate(
                ['slug' => Str::slug($item['name'])],
                [
                    'name'       => $item['name'],
                    'rubro'      => $item['rubro'],
                    'sort_order' => $sort,
                    'is_active'  => true,
                ]
            );

            foreach ($item['children'] as $childSort => $childName) {
                Category::updateOrCreate(
                    ['slug' => Str::slug($childName)],
                    [
                        'parent_id'  => $parent->id,
                        'name'       => $childName,
                        'rubro'      => $item['rubro'],
                        'sort_order' => $childSort,
                        'is_active'  => true,
                    ]
                );
            }
        }
    }
}
