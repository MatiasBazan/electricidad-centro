<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Stock extends Model
{
    public $timestamps = false;

    protected $table = 'stock';

    protected $fillable = ['product_variant_id', 'warehouse_id', 'quantity', 'reserved_quantity'];

    protected $casts = [
        'quantity'          => 'decimal:2',
        'reserved_quantity' => 'decimal:2',
        'updated_at'        => 'datetime',
    ];

    public function variant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class, 'product_variant_id');
    }

    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class);
    }

    public function getAvailableAttribute(): float
    {
        return (float) ($this->quantity - $this->reserved_quantity);
    }
}
