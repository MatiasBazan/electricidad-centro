<?php

namespace App\Http\Controllers\Clients;

use App\Http\Controllers\Controller;
use App\Http\Requests\Clients\StoreClientRequest;
use App\Http\Requests\Clients\UpdateClientRequest;
use App\Models\Client;
use App\Models\ClientAccount;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ClientController extends Controller
{
    public function index(Request $request): Response
    {
        $query = Client::with('account');

        if ($request->search) {
            $query->where(fn ($q) => $q
                ->where('name', 'like', "%{$request->search}%")
                ->orWhere('fantasy_name', 'like', "%{$request->search}%")
                ->orWhere('document_number', 'like', "%{$request->search}%")
                ->orWhere('cuit_cuil', 'like', "%{$request->search}%")
                ->orWhere('phone', 'like', "%{$request->search}%")
                ->orWhere('mobile', 'like', "%{$request->search}%")
                ->orWhere('email', 'like', "%{$request->search}%")
            );
        }

        if ($request->type) {
            $query->where('type', $request->type);
        }

        if ($request->tax_condition) {
            $query->where('tax_condition', $request->tax_condition);
        }

        if ($request->active !== null && $request->active !== '') {
            $query->where('is_active', $request->boolean('active'));
        }

        $clients = $query->orderBy('name')->paginate(25)->withQueryString()
            ->through(fn (Client $c) => [
                'id'              => $c->id,
                'type'            => $c->type,
                'name'            => $c->name,
                'fantasy_name'    => $c->fantasy_name,
                'cuit_cuil'       => $c->cuit_cuil,
                'document_type'   => $c->document_type,
                'document_number' => $c->document_number,
                'tax_condition'   => $c->tax_condition,
                'city'            => $c->city,
                'province'        => $c->province,
                'phone'           => $c->phone,
                'mobile'          => $c->mobile,
                'email'           => $c->email,
                'credit_limit'    => (float) $c->credit_limit,
                'is_active'       => $c->is_active,
                'balance'         => (float) ($c->account?->balance ?? 0),
            ]);

        $stats = [
            'total'            => Client::count(),
            'empresa'          => Client::where('type', 'empresa')->count(),
            'consumidor_final' => Client::where('type', 'consumidor_final')->count(),
            'active'           => Client::where('is_active', true)->count(),
            'with_balance'     => Client::whereHas('account', fn ($q) => $q->where('balance', '!=', 0))->count(),
        ];

        return Inertia::render('Clients/Index', [
            'clients' => $clients,
            'stats'   => $stats,
            'filters' => $request->only(['search', 'type', 'tax_condition', 'active']),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Clients/Create');
    }

    public function store(StoreClientRequest $request): RedirectResponse
    {
        $client = Client::create($request->validated());

        ClientAccount::create(['client_id' => $client->id, 'balance' => 0]);

        return redirect()->route('clients.show', $client)
            ->with('success', 'Cliente creado correctamente.');
    }

    public function show(Client $client): Response
    {
        $client->load(['account.movements' => fn ($q) => $q->orderByDesc('created_at')->limit(50)]);

        $recentSales = $client->salesOrders()
            ->orderByDesc('created_at')
            ->limit(10)
            ->get(['id', 'number', 'status', 'total', 'created_at']);

        return Inertia::render('Clients/Show', [
            'client' => [
                'id'              => $client->id,
                'type'            => $client->type,
                'name'            => $client->name,
                'fantasy_name'    => $client->fantasy_name,
                'cuit_cuil'       => $client->cuit_cuil,
                'document_type'   => $client->document_type,
                'document_number' => $client->document_number,
                'tax_condition'   => $client->tax_condition,
                'address'         => $client->address,
                'city'            => $client->city,
                'province'        => $client->province,
                'postal_code'     => $client->postal_code,
                'phone'           => $client->phone,
                'mobile'          => $client->mobile,
                'email'           => $client->email,
                'credit_limit'    => (float) $client->credit_limit,
                'notes'           => $client->notes,
                'is_active'       => $client->is_active,
                'balance'         => (float) ($client->account?->balance ?? 0),
                'movements'       => ($client->account?->movements ?? collect())->map(fn ($m) => [
                    'id'             => $m->id,
                    'type'           => $m->type,
                    'amount'         => (float) $m->amount,
                    'description'    => $m->description,
                    'reference_type' => $m->reference_type,
                    'reference_id'   => $m->reference_id,
                    'due_date'       => $m->due_date?->format('d/m/Y'),
                    'created_at'     => $m->created_at?->format('d/m/Y H:i'),
                ])->values(),
            ],
            'recent_sales' => $recentSales->map(fn ($s) => [
                'id'           => $s->id,
                'order_number' => $s->number,
                'status'       => $s->status,
                'total'        => (float) $s->total,
                'created_at'   => $s->created_at->format('d/m/Y'),
            ])->values(),
        ]);
    }

    public function edit(Client $client): Response
    {
        return Inertia::render('Clients/Edit', [
            'client' => $client->only([
                'id', 'type', 'name', 'fantasy_name', 'cuit_cuil',
                'document_type', 'document_number', 'tax_condition',
                'address', 'city', 'province', 'postal_code',
                'phone', 'mobile', 'email', 'credit_limit', 'notes', 'is_active',
            ]),
        ]);
    }

    public function update(UpdateClientRequest $request, Client $client): RedirectResponse
    {
        $client->update($request->validated());

        return redirect()->route('clients.show', $client)
            ->with('success', 'Cliente actualizado correctamente.');
    }

    public function destroy(Client $client): RedirectResponse
    {
        $client->delete();

        return redirect()->route('clients.index')
            ->with('success', 'Cliente eliminado.');
    }

    public function addMovement(Request $request, Client $client): RedirectResponse
    {
        $data = $request->validate([
            'type'        => 'required|in:debit,credit',
            'amount'      => 'required|numeric|min:0.01',
            'description' => 'nullable|string|max:200',
            'due_date'    => 'nullable|date',
        ]);

        $account = $client->account ?? ClientAccount::create(['client_id' => $client->id, 'balance' => 0]);

        $account->movements()->create([
            'type'        => $data['type'],
            'amount'      => $data['amount'],
            'description' => $data['description'] ?? null,
            'due_date'    => $data['due_date'] ?? null,
            'created_at'  => now(),
        ]);

        $delta = $data['type'] === 'debit' ? $data['amount'] : -$data['amount'];
        $account->increment('balance', $delta);
        $account->touch();

        return back()->with('success', 'Movimiento registrado.');
    }
}
