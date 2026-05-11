<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InvoiceItem extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'invoice_id', 'description', 'quantity',
        'unit_price', 'iva_rate', 'iva_amount', 'subtotal', 'total',
    ];

    protected $casts = [
        'quantity'   => 'decimal:2',
        'unit_price' => 'decimal:2',
        'iva_rate'   => 'decimal:2',
        'iva_amount' => 'decimal:2',
        'subtotal'   => 'decimal:2',
        'total'      => 'decimal:2',
    ];

    public function invoice(): BelongsTo { return $this->belongsTo(Invoice::class); }
}
