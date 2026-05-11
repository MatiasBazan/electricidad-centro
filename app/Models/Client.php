<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class Client extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'type', 'name', 'fantasy_name', 'cuit_cuil', 'document_type', 'document_number',
        'tax_condition', 'address', 'city', 'province', 'postal_code',
        'phone', 'mobile', 'email', 'credit_limit', 'notes', 'is_active',
    ];

    protected $casts = [
        'credit_limit' => 'decimal:2',
        'is_active'    => 'boolean',
    ];

    public function account(): HasOne
    {
        return $this->hasOne(ClientAccount::class);
    }

    public function quotations(): HasMany
    {
        return $this->hasMany(Quotation::class);
    }

    public function salesOrders(): HasMany
    {
        return $this->hasMany(SalesOrder::class);
    }

    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class);
    }

    public function isConsumidorFinal(): bool
    {
        return $this->tax_condition === 'consumidor_final';
    }
}
