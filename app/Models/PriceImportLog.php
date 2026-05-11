<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PriceImportLog extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'supplier_id', 'config_id', 'user_id', 'file_name', 'file_path',
        'status', 'rows_total', 'rows_processed', 'rows_created',
        'rows_updated', 'rows_skipped', 'rows_failed', 'error_details', 'imported_at',
    ];

    protected $casts = [
        'error_details' => 'array',
        'imported_at'   => 'datetime',
        'created_at'    => 'datetime',
    ];

    public function supplier(): BelongsTo { return $this->belongsTo(Supplier::class); }
    public function config(): BelongsTo { return $this->belongsTo(SupplierPriceImportConfig::class, 'config_id'); }
    public function user(): BelongsTo { return $this->belongsTo(User::class); }
}
