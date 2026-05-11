<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class Payment extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'cash_session_id', 'payable_type', 'payable_id',
        'payment_method_id', 'amount',
        'card_last_four', 'card_brand', 'installments',
        'check_id', 'notes',
    ];

    protected $casts = [
        'amount'       => 'decimal:2',
        'installments' => 'integer',
        'created_at'   => 'datetime',
    ];

    public function payable(): MorphTo
    {
        return $this->morphTo();
    }

    public function cashSession(): BelongsTo
    {
        return $this->belongsTo(CashSession::class);
    }

    public function paymentMethod(): BelongsTo
    {
        return $this->belongsTo(PaymentMethod::class);
    }

    public function check(): BelongsTo
    {
        return $this->belongsTo(Check::class);
    }
}
