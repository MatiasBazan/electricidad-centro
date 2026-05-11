<?php

namespace App\Http\Controllers\Suppliers;

use App\Http\Controllers\Controller;
use App\Http\Requests\Suppliers\StoreSupplierRequest;
use App\Http\Requests\Suppliers\UpdateSupplierRequest;
use App\Models\Supplier;
use App\Models\SupplierAccount;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SupplierController extends Controller
{
    public function index(Request $request): Response
    {
        $query = Supplier::withCount('purchaseOrders')
            ->with('account');

        if ($request->search) {
            $query->where(fn ($q) => $q
                ->where('name', 'like', "%{$request->search}%")
                ->orWhere('cuit', 'like', "%{$request->search}%")
                ->orWhere('city', 'like', "%{$request->search}%")
            );
        }

        if ($request->active !== null && $request->active !== '') {
            $query->where('is_active', $request->boolean('active'));
        }

        $suppliers = $query->orderBy('name')->paginate(25)->withQueryString()
            ->through(fn (Supplier $s) => [
                'id'                  => $s->id,
                'name'                => $s->name,
                'cuit'                => $s->cuit,
                'city'                => $s->city,
                'province'            => $s->province,
                'phone'               => $s->phone,
                'email'               => $s->email,
                'contact_name'        => $s->contact_name,
                'payment_terms'       => $s->payment_terms,
                'is_active'           => $s->is_active,
                'purchase_orders_count' => $s->purchase_orders_count,
                'balance'             => (float) ($s->account?->balance ?? 0),
            ]);

        $stats = [
            'total'  => Supplier::count(),
            'active' => Supplier::where('is_active', true)->count(),
        ];

        return Inertia::render('Suppliers/Index', [
            'suppliers' => $suppliers,
            'stats'     => $stats,
            'filters'   => $request->only(['search', 'active']),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Suppliers/Create');
    }

    public function store(StoreSupplierRequest $request): RedirectResponse
    {
        $supplier = Supplier::create($request->validated());

        SupplierAccount::create(['supplier_id' => $supplier->id, 'balance' => 0]);

        return redirect()->route('suppliers.show', $supplier)
            ->with('success', 'Proveedor creado correctamente.');
    }

    public function show(Supplier $supplier): Response
    {
        $supplier->load(['account.movements' => fn ($q) => $q->orderByDesc('created_at')->limit(50)]);

        $orders = $supplier->purchaseOrders()
            ->orderByDesc('order_date')
            ->limit(10)
            ->get(['id', 'order_number', 'status', 'order_date', 'total']);

        return Inertia::render('Suppliers/Show', [
            'supplier' => [
                'id'            => $supplier->id,
                'name'          => $supplier->name,
                'cuit'          => $supplier->cuit,
                'address'       => $supplier->address,
                'city'          => $supplier->city,
                'province'      => $supplier->province,
                'phone'         => $supplier->phone,
                'email'         => $supplier->email,
                'contact_name'  => $supplier->contact_name,
                'payment_terms' => $supplier->payment_terms,
                'notes'         => $supplier->notes,
                'is_active'     => $supplier->is_active,
                'balance'       => (float) ($supplier->account?->balance ?? 0),
                'movements'     => ($supplier->account?->movements ?? collect())->map(fn ($m) => [
                    'id'             => $m->id,
                    'type'           => $m->type,
                    'amount'         => (float) $m->amount,
                    'description'    => $m->description,
                    'reference_type' => $m->reference_type,
                    'reference_id'   => $m->reference_id,
                    'created_at'     => $m->created_at?->format('d/m/Y H:i'),
                ])->values(),
            ],
            'recent_orders' => $orders->map(fn ($o) => [
                'id'           => $o->id,
                'order_number' => $o->order_number,
                'status'       => $o->status,
                'order_date'   => $o->order_date->format('d/m/Y'),
                'total'        => (float) $o->total,
            ])->values(),
        ]);
    }

    public function edit(Supplier $supplier): Response
    {
        return Inertia::render('Suppliers/Edit', [
            'supplier' => $supplier->only([
                'id', 'name', 'cuit', 'address', 'city', 'province',
                'phone', 'email', 'contact_name', 'payment_terms', 'notes', 'is_active',
            ]),
        ]);
    }

    public function update(UpdateSupplierRequest $request, Supplier $supplier): RedirectResponse
    {
        $supplier->update($request->validated());

        return redirect()->route('suppliers.show', $supplier)
            ->with('success', 'Proveedor actualizado correctamente.');
    }

    public function destroy(Supplier $supplier): RedirectResponse
    {
        $supplier->delete();

        return redirect()->route('suppliers.index')
            ->with('success', 'Proveedor eliminado.');
    }

    public function addMovement(Request $request, Supplier $supplier): RedirectResponse
    {
        $data = $request->validate([
            'type'        => 'required|in:debit,credit',
            'amount'      => 'required|numeric|min:0.01',
            'description' => 'nullable|string|max:200',
        ]);

        $account = $supplier->account ?? SupplierAccount::create(['supplier_id' => $supplier->id, 'balance' => 0]);

        $account->movements()->create([
            'type'        => $data['type'],
            'amount'      => $data['amount'],
            'description' => $data['description'] ?? null,
            'created_at'  => now(),
        ]);

        $delta = $data['type'] === 'credit' ? $data['amount'] : -$data['amount'];
        $account->increment('balance', $delta);
        $account->touch();

        return back()->with('success', 'Movimiento registrado.');
    }
}
