<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AfipPos extends Model
{
    protected $table = 'afip_pos';

    protected $fillable = ['number', 'name', 'type', 'is_active'];

    protected $casts = ['is_active' => 'boolean'];

    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class);
    }
}
