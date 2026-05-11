<?php

namespace App\Http\Requests\Clients;

use Illuminate\Foundation\Http\FormRequest;

class UpdateClientRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        $id = $this->route('client')?->id;

        return [
            'type'            => 'required|in:consumidor_final,empresa',
            'name'            => 'required|string|max:150',
            'fantasy_name'    => 'nullable|string|max:150',
            'cuit_cuil'       => "nullable|string|max:13|unique:clients,cuit_cuil,{$id}",
            'document_type'   => 'required|in:dni,cuit,cuil,pasaporte',
            'document_number' => 'nullable|string|max:20',
            'tax_condition'   => 'required|in:consumidor_final,responsable_inscripto,monotributista,exento',
            'address'         => 'nullable|string|max:200',
            'city'            => 'nullable|string|max:100',
            'province'        => 'nullable|string|max:100',
            'postal_code'     => 'nullable|string|max:10',
            'phone'           => 'nullable|string|max:30',
            'mobile'          => 'nullable|string|max:30',
            'email'           => 'nullable|email|max:100',
            'credit_limit'    => 'nullable|numeric|min:0',
            'notes'           => 'nullable|string',
            'is_active'       => 'boolean',
        ];
    }
}
