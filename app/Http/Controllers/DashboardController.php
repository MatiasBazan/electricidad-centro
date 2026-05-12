<?php

namespace App\Http\Controllers;

use App\Models\CashSession;
use App\Models\Client;
use App\Models\Invoice;
use App\Models\Quotation;
use App\Models\SalesOrder;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(): Response
    {
        $openSession = CashSession::where('status', 'open')
            ->with('cashRegister:id,name')
            ->first();

        $cashExpected = null;
        if ($openSession) {
            $efectivo     = $openSession->payments()
                ->join('payment_methods', 'payments.payment_method_id', '=', 'payment_methods.id')
                ->where('payment_methods.type', 'efectivo')
                ->sum('payments.amount');
            $income       = $openSession->movements()->where('type', 'income')->sum('amount');
            $expense      = $openSession->movements()->where('type', 'expense')->sum('amount');
            $cashExpected = round($openSession->opening_amount + $efectivo + $income - $expense, 2);
        }

        $lowStockCount = DB::table('products')
            ->where('products.is_active', true)
            ->whereNull('products.deleted_at')
            ->whereRaw('(
                SELECT COALESCE(SUM(s.quantity), 0)
                FROM product_variants pv
                LEFT JOIN stock s ON pv.id = s.product_variant_id
                WHERE pv.product_id = products.id
            ) <= products.min_stock')
            ->count();

        $stats = [
            'sales_today'       => (float) SalesOrder::whereDate('date', today())->sum('total'),
            'sales_today_count' => SalesOrder::whereDate('date', today())->count(),
            'pending_orders'    => SalesOrder::whereIn('status', ['pending', 'processing', 'partial'])->count(),
            'pending_quotations'=> Quotation::whereIn('status', ['draft', 'sent'])->count(),
            'invoiced_month'    => (float) Invoice::where('status', 'approved')->whereMonth('date', now()->month)->sum('total'),
            'active_clients'    => Client::where('is_active', true)->count(),
            'low_stock_count'   => $lowStockCount,
            'cash_open'         => (bool) $openSession,
            'cash_register'     => $openSession?->cashRegister?->name,
            'cash_expected'     => $cashExpected,
        ];

        $recentSales = SalesOrder::with('client:id,name')
            ->orderByDesc('created_at')
            ->limit(6)
            ->get(['id', 'number', 'client_id', 'status', 'total', 'date'])
            ->map(fn ($o) => [
                'id'     => $o->id,
                'number' => $o->number,
                'client' => $o->client?->name ?? '—',
                'status' => $o->status,
                'total'  => (float) $o->total,
                'date'   => $o->date->format('d/m/Y'),
            ]);

        return Inertia::render('Dashboard', compact('stats', 'recentSales'));
    }
}
