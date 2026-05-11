<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ClientAccount extends Model
{
    public $timestamps = false;

    protected $fillable = ['client_id', 'balance'];

    protected $casts = ['balance' => 'decimal:2', 'updated_at' => 'datetime'];

    public function client(): BelongsTo { return $this->belongsTo(Client::class); }
    public function movements(): HasMany { return $this->hasMany(ClientAccountMovement::class); }
}
