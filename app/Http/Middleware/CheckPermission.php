<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckPermission
{
    public function handle(Request $request, Closure $next, string $permission): Response
    {
        $permissions = $request->user()?->role?->permissions ?? [];

        $hasPermission = in_array('*', $permissions) || in_array($permission, $permissions);

        if (! $hasPermission) {
            abort(403, 'No tenés permiso para realizar esta acción.');
        }

        return $next($request);
    }
}
