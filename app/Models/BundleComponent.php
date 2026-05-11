<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BundleComponent extends Model
{
    public $timestamps = false;

    protected $fillable = ['bundle_id', 'product_variant_id', 'quantity'];

    protected $casts = ['quantity' => 'decimal:2'];

    public function bundle(): BelongsTo
    {
        return $this->belongsTo(ProductBundle::class);
    }

    public function variant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class, 'product_variant_id');
    }
}
