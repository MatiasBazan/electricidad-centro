<?php

namespace App\Http\Requests\Products;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProductRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        $productId = $this->route('product')->id;

        return [
            'name'        => ['required', 'string', 'max:200'],
            'code'        => ['required', 'string', 'max:50', "unique:products,code,{$productId}"],
            'barcode'     => ['nullable', 'string', 'max:60', "unique:products,barcode,{$productId}"],
            'category_id' => ['required', 'exists:categories,id'],
            'brand_id'    => ['nullable', 'exists:brands,id'],
            'unit'        => ['required', 'string', 'max:20'],
            'min_stock'   => ['numeric', 'min:0'],
            'has_iva'     => ['boolean'],
            'iva_rate'    => ['numeric', 'in:0,10.5,21,27'],
            'is_active'   => ['boolean'],
            'description' => ['nullable', 'string'],
            // Variantes existentes
            'variants'                      => ['required', 'array', 'min:1'],
            'variants.*.id'                 => ['nullable', 'exists:product_variants,id'],
            'variants.*.sku'                => ['required', 'string', 'max:80'],
            'variants.*.barcode'            => ['nullable', 'string', 'max:60'],
            'variants.*.cost_price'         => ['required', 'numeric', 'min:0'],
            'variants.*.sale_price'         => ['required', 'numeric', 'min:0'],
            'variants.*.is_active'          => ['boolean'],
            'variants.*.attribute_value_ids'=> ['nullable', 'array'],
            'variants.*.attribute_value_ids.*' => ['exists:product_attribute_values,id'],
            // Bundle
            'bundle_components'             => ['nullable', 'array'],
            'bundle_components.*.product_variant_id' => ['required', 'exists:product_variants,id'],
            'bundle_components.*.quantity'  => ['required', 'numeric', 'min:0.01'],
        ];
    }
}
