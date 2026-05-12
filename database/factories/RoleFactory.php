<?php

namespace Database\Factories;

use App\Models\Role;
use Illuminate\Database\Eloquent\Factories\Factory;

class RoleFactory extends Factory
{
    protected $model = Role::class;

    public function definition(): array
    {
        return [
            'name'        => fake()->unique()->word(),
            'slug'        => fake()->unique()->slug(2),
            'permissions' => [],
        ];
    }

    public function admin(): static
    {
        return $this->state(['name' => 'Administrador', 'slug' => 'admin', 'permissions' => ['*']]);
    }

    public function vendedor(): static
    {
        return $this->state(['name' => 'Vendedor', 'slug' => 'vendedor']);
    }
}
