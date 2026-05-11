<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class QuotationItem extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'quotation_id', 'product_variant_id', 'description',
        'quantity', 'unit_price', 'discount_pct', 'subtotal', 'sort_order',
    ];

    protected $casts = [
        'quantity'     => 'decimal:2',
        'unit_price'   => 'decimal:2',
        'discount_pct' => 'decimal:2',
        'subtotal'     => 'decimal:2',
    ];

    public function quotation(): BelongsTo { return $this->belongsTo(Quotation::class); }
    public function variant(): BelongsTo { return $this->belongsTo(ProductVariant::class, 'product_variant_id'); }
}
