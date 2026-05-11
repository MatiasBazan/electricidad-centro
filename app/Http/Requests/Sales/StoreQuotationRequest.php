<?php

namespace App\Http\Requests\Sales;

use Illuminate\Foundation\Http\FormRequest;

class StoreQuotationRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'client_id'              => 'required|exists:clients,id',
            'date'                   => 'required|date',
            'expiry_date'            => 'nullable|date|after_or_equal:date',
            'discount_pct'           => 'nullable|numeric|min:0|max:100',
            'notes'                  => 'nullable|string',
            'items'                  => 'required|array|min:1',
            'items.*.product_variant_id' => 'nullable|exists:product_variants,id',
            'items.*.description'    => 'required|string|max:300',
            'items.*.quantity'       => 'required|numeric|min:0.001',
            'items.*.unit_price'     => 'required|numeric|min:0',
            'items.*.discount_pct'   => 'nullable|numeric|min:0|max:100',
        ];
    }
}
