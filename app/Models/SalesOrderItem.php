<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SalesOrderItem extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'sales_order_id', 'product_variant_id', 'description',
        'quantity', 'quantity_delivered', 'unit_price', 'discount_pct', 'subtotal', 'sort_order',
    ];

    protected $casts = [
        'quantity'           => 'decimal:2',
        'quantity_delivered' => 'decimal:2',
        'unit_price'         => 'decimal:2',
        'discount_pct'       => 'decimal:2',
        'subtotal'           => 'decimal:2',
    ];

    public function salesOrder(): BelongsTo { return $this->belongsTo(SalesOrder::class); }
    public function variant(): BelongsTo { return $this->belongsTo(ProductVariant::class, 'product_variant_id'); }

    public function getPendingQuantityAttribute(): float
    {
        return (float) ($this->quantity - $this->quantity_delivered);
    }
}
