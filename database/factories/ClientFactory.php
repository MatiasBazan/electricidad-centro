<?php

namespace Database\Factories;

use App\Models\Client;
use Illuminate\Database\Eloquent\Factories\Factory;

class ClientFactory extends Factory
{
    protected $model = Client::class;

    public function definition(): array
    {
        return [
            'type'          => 'empresa',
            'name'          => fake()->company(),
            'tax_condition' => 'consumidor_final',
            'document_type' => 'dni',
            'is_active'     => true,
        ];
    }

    public function responsableInscripto(): static
    {
        return $this->state([
            'type'          => 'empresa',
            'tax_condition' => 'responsable_inscripto',
            'cuit_cuil'     => '20' . fake()->unique()->numerify('#########'),
        ]);
    }

    public function consumidorFinal(): static
    {
        return $this->state([
            'type'          => 'consumidor_final',
            'tax_condition' => 'consumidor_final',
        ]);
    }

    public function monotributista(): static
    {
        return $this->state([
            'tax_condition' => 'monotributista',
            'cuit_cuil'     => '27' . fake()->unique()->numerify('#########'),
        ]);
    }
}
