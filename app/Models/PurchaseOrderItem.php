<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PurchaseOrderItem extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'purchase_order_id', 'product_variant_id',
        'quantity_ordered', 'quantity_received', 'unit_price', 'subtotal',
    ];

    protected $casts = [
        'quantity_ordered'  => 'decimal:2',
        'quantity_received' => 'decimal:2',
        'unit_price'        => 'decimal:2',
        'subtotal'          => 'decimal:2',
    ];

    public function purchaseOrder(): BelongsTo { return $this->belongsTo(PurchaseOrder::class); }
    public function variant(): BelongsTo { return $this->belongsTo(ProductVariant::class, 'product_variant_id'); }

    public function getPendingQuantityAttribute(): float
    {
        return (float) ($this->quantity_ordered - $this->quantity_received);
    }
}
