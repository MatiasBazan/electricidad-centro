<?php

namespace App\Http\Requests\Products;

use Illuminate\Foundation\Http\FormRequest;

class StoreProductRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'name'                          => ['required', 'string', 'max:200'],
            'code'                          => ['required', 'string', 'max:50', 'unique:products,code'],
            'barcode'                       => ['nullable', 'string', 'max:60', 'unique:products,barcode'],
            'category_id'                   => ['required', 'exists:categories,id'],
            'brand_id'                      => ['nullable', 'exists:brands,id'],
            'type'                          => ['required', 'in:simple,variant,bundle'],
            'unit'                          => ['required', 'string', 'max:20'],
            'min_stock'                     => ['numeric', 'min:0'],
            'has_iva'                       => ['boolean'],
            'iva_rate'                      => ['numeric', 'in:0,10.5,21,27'],
            'is_active'                     => ['boolean'],
            'description'                   => ['nullable', 'string'],
            // Variantes
            'variants'                      => ['required', 'array', 'min:1'],
            'variants.*.sku'                => ['required', 'string', 'max:80', 'distinct', 'unique:product_variants,sku'],
            'variants.*.barcode'            => ['nullable', 'string', 'max:60', 'distinct'],
            'variants.*.cost_price'         => ['required', 'numeric', 'min:0'],
            'variants.*.sale_price'         => ['required', 'numeric', 'min:0'],
            'variants.*.attribute_value_ids'=> ['nullable', 'array'],
            'variants.*.attribute_value_ids.*' => ['exists:product_attribute_values,id'],
            'variants.*.stock'              => ['nullable', 'array'],
            'variants.*.stock.*'            => ['nullable', 'numeric', 'min:0'],
            // Bundle
            'bundle_components'             => ['nullable', 'array'],
            'bundle_components.*.product_variant_id' => ['required', 'exists:product_variants,id'],
            'bundle_components.*.quantity'  => ['required', 'numeric', 'min:0.01'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required'        => 'El nombre del producto es obligatorio.',
            'code.required'        => 'El código interno es obligatorio.',
            'code.unique'          => 'Este código ya está en uso.',
            'category_id.required' => 'Seleccioná una categoría.',
            'variants.required'    => 'Debe haber al menos una variante.',
            'variants.*.sku.required' => 'El SKU es obligatorio.',
            'variants.*.sku.unique'   => 'El SKU ya existe en otro producto.',
        ];
    }
}
