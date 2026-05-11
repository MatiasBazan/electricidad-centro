<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Role extends Model
{
    protected $fillable = ['name', 'slug', 'permissions'];

    protected $casts = ['permissions' => 'array'];

    protected $attributes = ['permissions' => '[]'];

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function hasPermission(string $permission): bool
    {
        $permissions = $this->permissions ?? [];
        return in_array('*', $permissions) || in_array($permission, $permissions);
    }
}
