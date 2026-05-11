<?php

namespace App\Http\Middleware;

use App\Models\CashSession;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    public function share(Request $request): array
    {
        $user = $request->user();

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user ? [
                    'id'          => $user->id,
                    'name'        => $user->name,
                    'email'       => $user->email,
                    'role'        => $user->role?->slug,
                    'permissions' => $user->role?->permissions ?? [],
                ] : null,
            ],
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error'   => fn () => $request->session()->get('error'),
                'warning' => fn () => $request->session()->get('warning'),
            ],
            'cashSession' => fn () => $user
                ? CashSession::where('user_id', $user->id)
                    ->where('status', 'open')
                    ->select('id', 'status', 'opened_at', 'cash_register_id')
                    ->first()
                : null,
        ];
    }
}
