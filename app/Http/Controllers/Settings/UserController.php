<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\StoreUserRequest;
use App\Http\Requests\Settings\UpdateUserRequest;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    public function index(Request $request): Response
    {
        $users = User::with('role')
            ->when($request->search, fn ($q, $s) =>
                $q->where('name', 'like', "%{$s}%")->orWhere('email', 'like', "%{$s}%")
            )
            ->orderBy('name')
            ->get()
            ->map(fn (User $u) => [
                'id'         => $u->id,
                'name'       => $u->name,
                'email'      => $u->email,
                'role_id'    => $u->role_id,
                'role_name'  => $u->role?->name,
                'role_slug'  => $u->role?->slug,
                'is_active'  => $u->is_active,
                'created_at' => $u->created_at?->format('d/m/Y'),
                'is_self'    => $u->id === $request->user()->id,
            ]);

        return Inertia::render('Settings/Users/Index', [
            'users'   => $users,
            'roles'   => Role::orderBy('name')->get(['id', 'name', 'slug']),
            'filters' => ['search' => $request->search ?? ''],
        ]);
    }

    public function store(StoreUserRequest $request): RedirectResponse
    {
        User::create([
            'name'      => $request->name,
            'email'     => $request->email,
            'role_id'   => $request->role_id,
            'password'  => Hash::make($request->password),
            'is_active' => $request->boolean('is_active', true),
        ]);

        return back()->with('success', 'Usuario creado correctamente.');
    }

    public function update(UpdateUserRequest $request, User $user): RedirectResponse
    {
        $data = [
            'name'      => $request->name,
            'email'     => $request->email,
            'role_id'   => $request->role_id,
            'is_active' => $request->boolean('is_active', true),
        ];

        if ($request->filled('password')) {
            $data['password'] = Hash::make($request->password);
        }

        // Prevent removing own admin role
        if ($user->id === $request->user()->id) {
            $adminRole = Role::where('slug', 'admin')->value('id');
            $data['role_id'] = $adminRole;
        }

        $user->update($data);

        return back()->with('success', 'Usuario actualizado correctamente.');
    }

    public function destroy(Request $request, User $user): RedirectResponse
    {
        if ($user->id === $request->user()->id) {
            return back()->with('error', 'No podés eliminar tu propia cuenta.');
        }

        $user->delete();

        return back()->with('success', 'Usuario eliminado.');
    }
}
