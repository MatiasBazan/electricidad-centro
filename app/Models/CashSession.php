<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CashSession extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $fillable = [
        'cash_register_id', 'user_id', 'status',
        'opening_amount', 'closing_amount', 'expected_cash', 'difference',
        'opened_at', 'closed_at', 'notes',
    ];

    protected $casts = [
        'opening_amount' => 'decimal:2',
        'closing_amount' => 'decimal:2',
        'expected_cash'  => 'decimal:2',
        'difference'     => 'decimal:2',
        'opened_at'      => 'datetime',
        'closed_at'      => 'datetime',
        'created_at'     => 'datetime',
    ];

    public function cashRegister(): BelongsTo
    {
        return $this->belongsTo(CashRegister::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    public function totalByMethod(): array
    {
        return $this->payments()
            ->join('payment_methods', 'payments.payment_method_id', '=', 'payment_methods.id')
            ->selectRaw('payment_methods.name, payment_methods.type, SUM(payments.amount) as total')
            ->groupBy('payment_methods.id', 'payment_methods.name', 'payment_methods.type')
            ->get()
            ->toArray();
    }

    public function isOpen(): bool
    {
        return $this->status === 'open';
    }
}
