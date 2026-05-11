<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class Product extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'category_id', 'brand_id', 'code', 'barcode', 'name',
        'description', 'type', 'unit', 'min_stock', 'has_iva', 'iva_rate', 'is_active',
    ];

    protected $casts = [
        'min_stock' => 'decimal:2',
        'iva_rate'  => 'decimal:2',
        'has_iva'   => 'boolean',
        'is_active' => 'boolean',
    ];

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function brand(): BelongsTo
    {
        return $this->belongsTo(Brand::class);
    }

    public function variants(): HasMany
    {
        return $this->hasMany(ProductVariant::class);
    }

    public function bundle(): HasOne
    {
        return $this->hasOne(ProductBundle::class);
    }

    public function getTotalStockAttribute(): float
    {
        return (float) $this->variants()->join('stock', 'product_variants.id', '=', 'stock.product_variant_id')
            ->sum('stock.quantity');
    }

    public function getIsBelowMinStockAttribute(): bool
    {
        return $this->total_stock <= $this->min_stock;
    }
}
