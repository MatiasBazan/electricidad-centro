<?php

namespace App\Http\Requests\Suppliers;

use Illuminate\Foundation\Http\FormRequest;

class UpdateSupplierRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        $id = $this->route('supplier')?->id;

        return [
            'name'          => 'required|string|max:150',
            'cuit'          => "nullable|string|max:13|unique:suppliers,cuit,{$id}",
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
