<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class Supplier extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name', 'cuit', 'address', 'city', 'province',
        'phone', 'email', 'contact_name', 'payment_terms', 'notes', 'is_active',
    ];

    protected $casts = ['is_active' => 'boolean'];

    public function account(): HasOne
    {
        return $this->hasOne(SupplierAccount::class);
    }

    public function purchaseOrders(): HasMany
    {
        return $this->hasMany(PurchaseOrder::class);
    }

    public function importConfigs(): HasMany
    {
        return $this->hasMany(SupplierPriceImportConfig::class);
    }

    public function importLogs(): HasMany
    {
        return $this->hasMany(PriceImportLog::class);
    }
}
