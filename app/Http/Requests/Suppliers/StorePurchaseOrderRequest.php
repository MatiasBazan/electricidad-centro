<?php

namespace App\Http\Requests\Suppliers;

use Illuminate\Foundation\Http\FormRequest;

class StorePurchaseOrderRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'supplier_id'              => 'required|exists:suppliers,id',
            'order_date'               => 'required|date',
            'expected_date'            => 'nullable|date|after_or_equal:order_date',
            'notes'                    => 'nullable|string',
            'items'                    => 'required|array|min:1',
            'items.*.product_variant_id' => 'required|exists:product_variants,id',
            'items.*.quantity_ordered' => 'required|numeric|min:0.01',
            'items.*.unit_price'       => 'required|numeric|min:0',
        ];
    }
}
