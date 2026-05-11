<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckRole
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $userRole = $request->user()?->role?->slug;

        if (! $userRole || ! in_array($userRole, $roles)) {
            if ($request->inertia()) {
                abort(403, 'No tenés permiso para acceder a esta sección.');
            }
            return redirect()->route('dashboard')->with('error', 'Acceso no autorizado.');
        }

        return $next($request);
    }
}
