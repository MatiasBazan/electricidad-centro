<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductPrice extends Model
{
    public $timestamps = false;

    protected $fillable = ['product_variant_id', 'price_list_id', 'price'];

    protected $casts = ['price' => 'decimal:2', 'updated_at' => 'datetime'];

    public function variant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class, 'product_variant_id');
    }

    public function priceList(): BelongsTo
    {
        return $this->belongsTo(PriceList::class);
    }
}
