<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CashRegister extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'location', 'is_active'];

    protected $casts = ['is_active' => 'boolean'];

    public function sessions(): HasMany { return $this->hasMany(CashSession::class); }

    public function openSession(): ?CashSession
    {
        return $this->sessions()->where('status', 'open')->first();
    }
}
