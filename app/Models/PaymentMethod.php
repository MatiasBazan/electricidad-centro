<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PaymentMethod extends Model
{
    protected $fillable = ['name', 'type', 'surcharge_pct', 'requires_auth', 'is_active', 'sort_order'];

    protected $casts = [
        'surcharge_pct' => 'decimal:2',
        'requires_auth' => 'boolean',
        'is_active'     => 'boolean',
    ];

    public function payments(): HasMany { return $this->hasMany(Payment::class); }
}
