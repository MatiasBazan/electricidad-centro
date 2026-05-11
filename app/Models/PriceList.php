<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PriceList extends Model
{
    protected $fillable = ['name', 'is_default', 'currency', 'valid_from', 'valid_to'];

    protected $casts = [
        'is_default' => 'boolean',
        'valid_from' => 'date',
        'valid_to'   => 'date',
    ];

    public function prices(): HasMany
    {
        return $this->hasMany(ProductPrice::class);
    }
}
