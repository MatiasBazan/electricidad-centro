<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DeliveryNote extends Model
{
    protected $fillable = [
        'sales_order_id', 'user_id', 'warehouse_id', 'number',
        'status', 'date', 'notes', 'dispatched_at',
    ];

    protected $casts = [
        'date'          => 'date',
        'dispatched_at' => 'datetime',
    ];

    public function salesOrder(): BelongsTo { return $this->belongsTo(SalesOrder::class); }
    public function user(): BelongsTo { return $this->belongsTo(User::class); }
    public function warehouse(): BelongsTo { return $this->belongsTo(Warehouse::class); }
    public function items(): HasMany { return $this->hasMany(DeliveryNoteItem::class); }
}
