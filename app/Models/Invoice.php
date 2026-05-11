<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class Invoice extends Model
{
    use HasFactory;

    protected $fillable = [
        'client_id', 'user_id', 'sales_order_id', 'afip_pos_id',
        'invoice_type', 'cbte_tipo', 'number', 'cae', 'cae_expiry', 'date',
        'cuit_sender', 'tax_condition_sender', 'cuit_receiver', 'tax_condition_receiver',
        'net_taxed', 'net_untaxed', 'net_exempt', 'iva_amount', 'other_taxes', 'total',
        'status', 'afip_result', 'notes',
    ];

    protected $casts = [
        'date'       => 'date',
        'cae_expiry' => 'date',
        'net_taxed'  => 'decimal:2',
        'net_untaxed'=> 'decimal:2',
        'net_exempt' => 'decimal:2',
        'iva_amount' => 'decimal:2',
        'other_taxes'=> 'decimal:2',
        'total'      => 'decimal:2',
        'afip_result'=> 'array',
    ];

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function salesOrder(): BelongsTo
    {
        return $this->belongsTo(SalesOrder::class);
    }

    public function pos(): BelongsTo
    {
        return $this->belongsTo(AfipPos::class, 'afip_pos_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(InvoiceItem::class);
    }

    public function payments(): MorphMany
    {
        return $this->morphMany(Payment::class, 'payable');
    }

    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }

    public function scopeByType($query, string $type)
    {
        return $query->where('invoice_type', $type);
    }
}
