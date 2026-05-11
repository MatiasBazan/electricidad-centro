<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ProductVariant extends Model
{
    use HasFactory;

    protected $fillable = ['product_id', 'sku', 'barcode', 'cost_price', 'sale_price', 'is_active'];

    protected $casts = [
        'cost_price' => 'decimal:2',
        'sale_price' => 'decimal:2',
        'is_active'  => 'boolean',
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function attributeValues(): BelongsToMany
    {
        return $this->belongsToMany(
            ProductAttributeValue::class,
            'variant_attribute_values',
            'product_variant_id',
            'product_attribute_value_id'
        );
    }

    public function stockItems(): HasMany
    {
        return $this->hasMany(Stock::class);
    }

    public function prices(): HasMany
    {
        return $this->hasMany(ProductPrice::class);
    }

    public function bundleUsages(): HasMany
    {
        return $this->hasMany(BundleComponent::class);
    }

    public function getAvailableStockAttribute(): float
    {
        return (float) $this->stockItems()->sum(\DB::raw('quantity - reserved_quantity'));
    }

    public function stockInWarehouse(int $warehouseId): float
    {
        $stock = $this->stockItems()->where('warehouse_id', $warehouseId)->first();
        return $stock ? (float) ($stock->quantity - $stock->reserved_quantity) : 0.0;
    }
}
