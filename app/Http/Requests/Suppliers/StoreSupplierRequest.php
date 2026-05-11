<?php

namespace App\Http\Requests\Suppliers;

use Illuminate\Foundation\Http\FormRequest;

class StoreSupplierRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'name'          => 'required|string|max:150',
            'cuit'          => 'nullable|string|max:13|unique:suppliers,cuit',
            'address'       => 'nullable|string|max:200',
            'city'          => 'nullable|string|max:100',
            'province'      => 'nullable|string|max:100',
            'phone'         => 'nullable|string|max:30',
            'email'         => 'nullable|email|max:100',
            'contact_name'  => 'nullable|string|max:100',
            'payment_terms' => 'nullable|string|max:100',
            'notes'         => 'nullable|string',
            'is_active'     => 'boolean',
        ];
    }
}
