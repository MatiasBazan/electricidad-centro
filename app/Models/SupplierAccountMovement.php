<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SupplierAccountMovement extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'supplier_account_id', 'type', 'amount',
        'description', 'reference_type', 'reference_id',
    ];

    protected $casts = ['amount' => 'decimal:2', 'created_at' => 'datetime'];

    public function account(): BelongsTo { return $this->belongsTo(SupplierAccount::class, 'supplier_account_id'); }
}
