<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Check extends Model
{
    protected $fillable = [
        'bank', 'branch', 'number', 'amount', 'check_date', 'due_date',
        'type', 'status', 'client_id', 'supplier_id', 'notes',
    ];

    protected $casts = [
        'amount'     => 'decimal:2',
        'check_date' => 'date',
        'due_date'   => 'date',
    ];

    public function client(): BelongsTo { return $this->belongsTo(Client::class); }
    public function supplier(): BelongsTo { return $this->belongsTo(Supplier::class); }
    public function payments(): HasMany { return $this->hasMany(Payment::class); }

    public function scopeDueThisWeek($query)
    {
        return $query->whereBetween('due_date', [now(), now()->addWeek()]);
    }
}
