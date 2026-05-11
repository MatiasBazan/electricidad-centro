<?php

namespace App\Http\Controllers\Cash;

use App\Http\Controllers\Controller;
use App\Models\CashMovement;
use App\Models\CashRegister;
use App\Models\CashSession;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CashController extends Controller
{
    public function index(): Response
    {
        $openSession = CashSession::with(['user', 'cashRegister'])
            ->where('status', 'open')
            ->first();

        $sessionData = null;
        if ($openSession) {
            $totals = $openSession->payments()
                ->join('payment_methods', 'payments.payment_method_id', '=', 'payment_methods.id')
                ->selectRaw('payment_methods.id, payment_methods.name, payment_methods.type, SUM(payments.amount) as total')
                ->groupBy('payment_methods.id', 'payment_methods.name', 'payment_methods.type')
                ->orderBy('payment_methods.sort_order')
                ->get();

            $movements = $openSession->movements()
                ->with('user:id,name')
                ->orderByDesc('created_at')
                ->get();

            $recentPayments = $openSession->payments()
                ->with('paymentMethod:id,name,type')
                ->orderByDesc('created_at')
                ->limit(30)
                ->get();

            $effectivoTotal = $totals->where('type', 'efectivo')->sum('total');
            $manualIncome   = $movements->where('type', 'income')->sum('amount');
            $manualExpense  = $movements->where('type', 'expense')->sum('amount');
            $expectedCash   = $openSession->opening_amount + $effectivoTotal + $manualIncome - $manualExpense;

            $sessionData = [
                'id'              => $openSession->id,
                'cash_register'   => $openSession->cashRegister->name,
                'opened_by'       => $openSession->user->name,
                'opened_at'       => $openSession->opened_at->format('d/m/Y H:i'),
                'opening_amount'  => (float) $openSession->opening_amount,
                'expected_cash'   => round($expectedCash, 2),
                'total_payments'  => (float) $totals->sum('total'),
                'totals_by_method' => $totals->map(fn ($t) => [
                    'id'    => $t->id,
                    'name'  => $t->name,
                    'type'  => $t->type,
                    'total' => (float) $t->total,
                ])->values(),
                'movements' => $movements->map(fn ($m) => [
                    'id'          => $m->id,
                    'type'        => $m->type,
                    'amount'      => (float) $m->amount,
                    'description' => $m->description,
                    'user'        => $m->user->name,
                    'created_at'  => $m->created_at->format('d/m/Y H:i'),
                ])->values(),
                'recent_payments' => $recentPayments->map(fn ($p) => [
                    'id'             => $p->id,
                    'method_name'    => $p->paymentMethod->name,
                    'method_type'    => $p->paymentMethod->type,
                    'amount'         => (float) $p->amount,
                    'payable_type'   => class_basename($p->payable_type),
                    'payable_id'     => $p->payable_id,
                    'created_at'     => $p->created_at->format('d/m/Y H:i'),
                ])->values(),
            ];
        }

        $recentSessions = CashSession::with(['user:id,name', 'cashRegister:id,name'])
            ->where('status', 'closed')
            ->orderByDesc('closed_at')
            ->limit(10)
            ->get()
            ->map(fn ($s) => [
                'id'              => $s->id,
                'cash_register'   => $s->cashRegister->name,
                'opened_by'       => $s->user->name,
                'opened_at'       => $s->opened_at->format('d/m/Y H:i'),
                'closed_at'       => $s->closed_at?->format('d/m/Y H:i'),
                'opening_amount'  => (float) $s->opening_amount,
                'closing_amount'  => (float) $s->closing_amount,
                'difference'      => (float) $s->difference,
            ]);

        return Inertia::render('Cash/Index', [
            'open_session'    => $sessionData,
            'recent_sessions' => $recentSessions,
            'registers'       => CashRegister::where('is_active', true)->get(['id', 'name', 'location']),
        ]);
    }

    public function open(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'cash_register_id' => 'required|exists:cash_registers,id',
            'opening_amount'   => 'required|numeric|min:0',
            'notes'            => 'nullable|string|max:300',
        ]);

        $alreadyOpen = CashSession::where('cash_register_id', $data['cash_register_id'])
            ->where('status', 'open')
            ->exists();

        if ($alreadyOpen) {
            return back()->with('error', 'Ya hay una sesión abierta en esa caja.');
        }

        CashSession::create([
            'cash_register_id' => $data['cash_register_id'],
            'user_id'          => $request->user()->id,
            'status'           => 'open',
            'opening_amount'   => $data['opening_amount'],
            'notes'            => $data['notes'] ?? null,
            'opened_at'        => now(),
            'created_at'       => now(),
        ]);

        return redirect()->route('cash.index')->with('success', 'Caja abierta correctamente.');
    }

    public function close(Request $request, CashSession $session): RedirectResponse
    {
        if (! $session->isOpen()) {
            return back()->with('error', 'La sesión ya está cerrada.');
        }

        $data = $request->validate([
            'closing_amount' => 'required|numeric|min:0',
            'notes'          => 'nullable|string|max:300',
        ]);

        $effectivoTotal = $session->payments()
            ->join('payment_methods', 'payments.payment_method_id', '=', 'payment_methods.id')
            ->where('payment_methods.type', 'efectivo')
            ->sum('payments.amount');

        $manualIncome  = $session->movements()->where('type', 'income')->sum('amount');
        $manualExpense = $session->movements()->where('type', 'expense')->sum('amount');
        $expectedCash  = $session->opening_amount + $effectivoTotal + $manualIncome - $manualExpense;

        $session->update([
            'status'          => 'closed',
            'closing_amount'  => $data['closing_amount'],
            'expected_cash'   => round($expectedCash, 2),
            'difference'      => round($data['closing_amount'] - $expectedCash, 2),
            'notes'           => $data['notes'] ?? $session->notes,
            'closed_at'       => now(),
        ]);

        return redirect()->route('cash.index')->with('success', 'Caja cerrada correctamente.');
    }

    public function addMovement(Request $request, CashSession $session): RedirectResponse
    {
        if (! $session->isOpen()) {
            return back()->with('error', 'La sesión no está abierta.');
        }

        $data = $request->validate([
            'type'        => 'required|in:income,expense',
            'amount'      => 'required|numeric|min:0.01',
            'description' => 'required|string|max:200',
        ]);

        CashMovement::create([
            'cash_session_id' => $session->id,
            'user_id'         => $request->user()->id,
            'type'            => $data['type'],
            'amount'          => $data['amount'],
            'description'     => $data['description'],
            'created_at'      => now(),
        ]);

        return back()->with('success', 'Movimiento registrado.');
    }

    public function show(CashSession $session): Response
    {
        $session->load(['user:id,name', 'cashRegister:id,name']);

        $totals = $session->payments()
            ->join('payment_methods', 'payments.payment_method_id', '=', 'payment_methods.id')
            ->selectRaw('payment_methods.id, payment_methods.name, payment_methods.type, SUM(payments.amount) as total')
            ->groupBy('payment_methods.id', 'payment_methods.name', 'payment_methods.type')
            ->orderBy('payment_methods.sort_order')
            ->get();

        $movements = $session->movements()->with('user:id,name')->orderBy('created_at')->get();

        $payments = $session->payments()
            ->with('paymentMethod:id,name,type')
            ->orderByDesc('created_at')
            ->get();

        return Inertia::render('Cash/Show', [
            'session' => [
                'id'              => $session->id,
                'cash_register'   => $session->cashRegister->name,
                'opened_by'       => $session->user->name,
                'status'          => $session->status,
                'opened_at'       => $session->opened_at->format('d/m/Y H:i'),
                'closed_at'       => $session->closed_at?->format('d/m/Y H:i'),
                'opening_amount'  => (float) $session->opening_amount,
                'closing_amount'  => (float) $session->closing_amount,
                'expected_cash'   => (float) $session->expected_cash,
                'difference'      => (float) $session->difference,
                'notes'           => $session->notes,
                'totals_by_method' => $totals->map(fn ($t) => [
                    'name'  => $t->name,
                    'type'  => $t->type,
                    'total' => (float) $t->total,
                ])->values(),
                'movements' => $movements->map(fn ($m) => [
                    'id'          => $m->id,
                    'type'        => $m->type,
                    'amount'      => (float) $m->amount,
                    'description' => $m->description,
                    'user'        => $m->user->name,
                    'created_at'  => $m->created_at->format('d/m/Y H:i'),
                ])->values(),
                'payments' => $payments->map(fn ($p) => [
                    'id'           => $p->id,
                    'method_name'  => $p->paymentMethod->name,
                    'method_type'  => $p->paymentMethod->type,
                    'amount'       => (float) $p->amount,
                    'payable_type' => class_basename($p->payable_type),
                    'payable_id'   => $p->payable_id,
                    'created_at'   => $p->created_at->format('d/m/Y H:i'),
                ])->values(),
            ],
        ]);
    }
}
