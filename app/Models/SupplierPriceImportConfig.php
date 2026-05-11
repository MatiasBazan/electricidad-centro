<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SupplierPriceImportConfig extends Model
{
    protected $fillable = [
        'supplier_id', 'name', 'file_type', 'sheet_index', 'header_row',
        'data_start_row', 'csv_delimiter', 'csv_encoding',
        'column_mappings', 'price_list_id', 'markup_pct', 'is_active',
    ];

    protected $casts = [
        'column_mappings' => 'array',
        'markup_pct'      => 'decimal:2',
        'is_active'       => 'boolean',
    ];

    public function supplier(): BelongsTo { return $this->belongsTo(Supplier::class); }
    public function priceList(): BelongsTo { return $this->belongsTo(PriceList::class); }
    public function importLogs(): HasMany { return $this->hasMany(PriceImportLog::class, 'config_id'); }
}
