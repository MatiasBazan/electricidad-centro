<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Warehouse extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'code', 'address', 'is_main', 'is_active'];

    protected $casts = ['is_main' => 'boolean', 'is_active' => 'boolean'];

    public function stockItems(): HasMany
    {
        return $this->hasMany(Stock::class);
    }
}
