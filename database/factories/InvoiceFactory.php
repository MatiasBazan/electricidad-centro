<?php

namespace Database\Factories;

use App\Models\AfipPos;
use App\Models\Client;
use App\Models\Invoice;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class InvoiceFactory extends Factory
{
    protected $model = Invoice::class;

    public function definition(): array
    {
        return [
            'client_id'              => Client::factory(),
            'user_id'                => User::factory(),
            'afip_pos_id'            => AfipPos::factory(),
            'invoice_type'           => 'B',
            'cbte_tipo'              => 6,
            'number'                 => fake()->unique()->numberBetween(1, 99999),
            'date'                   => today(),
            'cuit_sender'            => '20123456789',
            'tax_condition_sender'   => 'responsable_inscripto',
            'tax_condition_receiver' => 'consumidor_final',
            'net_taxed'              => 826.45,
            'net_untaxed'            => 0,
            'net_exempt'             => 0,
            'iva_amount'             => 173.55,
            'other_taxes'            => 0,
            'total'                  => 1000.00,
            'status'                 => 'approved',
            'cae'                    => '12345678901234',
            'cae_expiry'             => today()->addDays(10),
        ];
    }

    public function approved(): static
    {
        return $this->state([
            'status'     => 'approved',
            'cae'        => '12345678901234',
            'cae_expiry' => today()->addDays(10),
        ]);
    }

    public function rejected(): static
    {
        return $this->state([
            'status'      => 'rejected',
            'cae'         => null,
            'cae_expiry'  => null,
            'afip_result' => ['errores' => [['Msg' => 'Error de prueba']]],
        ]);
    }

    public function pending(): static
    {
        return $this->state(['status' => 'pending', 'cae' => null, 'cae_expiry' => null]);
    }

    public function typeA(): static
    {
        return $this->state(['invoice_type' => 'A', 'cbte_tipo' => 1]);
    }
}
