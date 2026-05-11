<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class SalesOrder extends Model
{
    use HasFactory;

    protected $fillable = [
        'quotation_id', 'client_id', 'user_id', 'warehouse_id', 'number',
        'status', 'date', 'payment_type', 'installments', 'cash_discount_pct',
        'notes', 'subtotal', 'discount_amount', 'tax_amount', 'total',
    ];

    protected $casts = [
        'date'              => 'date',
        'installments'      => 'integer',
        'cash_discount_pct' => 'decimal:2',
        'subtotal'          => 'decimal:2',
        'discount_amount'   => 'decimal:2',
        'tax_amount'        => 'decimal:2',
        'total'             => 'decimal:2',
    ];

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function quotation(): BelongsTo
    {
        return $this->belongsTo(Quotation::class);
    }

    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(SalesOrderItem::class);
    }

    public function deliveries(): HasMany
    {
        return $this->hasMany(DeliveryNote::class);
    }

    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class);
    }

    public function payments(): MorphMany
    {
        return $this->morphMany(Payment::class, 'payable');
    }

    public function scopePending($query)
    {
        return $query->whereIn('status', ['pending', 'processing', 'partial']);
    }
}
