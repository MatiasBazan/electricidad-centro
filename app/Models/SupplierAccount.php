<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SupplierAccount extends Model
{
    public $timestamps = false;

    protected $fillable = ['supplier_id', 'balance'];

    protected $casts = ['balance' => 'decimal:2', 'updated_at' => 'datetime'];

    public function supplier(): BelongsTo { return $this->belongsTo(Supplier::class); }
    public function movements(): HasMany { return $this->hasMany(SupplierAccountMovement::class); }
}
