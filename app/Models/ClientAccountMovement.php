<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ClientAccountMovement extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'client_account_id', 'type', 'amount',
        'description', 'reference_type', 'reference_id', 'due_date',
    ];

    protected $casts = [
        'amount'     => 'decimal:2',
        'due_date'   => 'date',
        'created_at' => 'datetime',
    ];

    public function account(): BelongsTo { return $this->belongsTo(ClientAccount::class, 'client_account_id'); }
}
