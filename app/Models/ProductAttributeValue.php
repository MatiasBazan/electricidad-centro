<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class ProductAttributeValue extends Model
{
    protected $fillable = ['product_attribute_type_id', 'value', 'sort_order'];

    public function type(): BelongsTo
    {
        return $this->belongsTo(ProductAttributeType::class, 'product_attribute_type_id');
    }

    public function variants(): BelongsToMany
    {
        return $this->belongsToMany(
            ProductVariant::class,
            'variant_attribute_values',
            'product_attribute_value_id',
            'product_variant_id'
        );
    }
}
