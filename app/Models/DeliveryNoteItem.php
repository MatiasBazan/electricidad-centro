<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DeliveryNoteItem extends Model
{
    public $timestamps = false;

    protected $fillable = ['delivery_note_id', 'sales_order_item_id', 'product_variant_id', 'quantity'];

    protected $casts = ['quantity' => 'decimal:2'];

    public function deliveryNote(): BelongsTo { return $this->belongsTo(DeliveryNote::class); }
    public function salesOrderItem(): BelongsTo { return $this->belongsTo(SalesOrderItem::class); }
    public function variant(): BelongsTo { return $this->belongsTo(ProductVariant::class, 'product_variant_id'); }
}
