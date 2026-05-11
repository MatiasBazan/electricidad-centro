<?php

namespace App\Http\Middleware;

use App\Models\CashSession;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureCashSessionOpen
{
    public function handle(Request $request, Closure $next): Response
    {
        $hasOpenSession = CashSession::where('user_id', $request->user()->id)
            ->where('status', 'open')
            ->exists();

        if (! $hasOpenSession) {
            if ($request->inertia()) {
                return redirect()->route('cash.index')
                    ->with('warning', 'Necesitás abrir la caja antes de registrar ventas.');
            }
            abort(403, 'No hay caja abierta.');
        }

        return $next($request);
    }
}
