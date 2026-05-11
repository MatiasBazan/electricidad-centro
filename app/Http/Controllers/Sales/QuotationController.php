<?php

namespace App\Http\Controllers\Sales;

use App\Http\Controllers\Controller;
use App\Http\Requests\Sales\StoreQuotationRequest;
use App\Models\Client;
use App\Models\ProductVariant;
use App\Models\Quotation;
use App\Models\QuotationItem;
use App\Models\SalesOrder;
use App\Models\SalesOrderItem;
use App\Models\Stock;
use App\Models\Warehouse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class QuotationController extends Controller
{
    public function index(Request $request): Response
    {
        $query = Quotation::with('client');

        if ($request->search) {
            $query->where(fn ($q) => $q
                ->where('number', 'like', "%{$request->search}%")
                ->orWhereHas('client', fn ($sq) => $sq->where('name', 'like', "%{$request->search}%"))
            );
        }
        if ($request->status) {
            $query->where('status', $request->status);
        }
        if ($request->client_id) {
            $query->where('client_id', $request->client_id);
        }

        $quotations = $query->orderByDesc('date')->paginate(25)->withQueryString()
            ->through(fn (Quotation $q) => [
                'id'          => $q->id,
                'number'      => $q->number,
                'client'      => $q->client?->name,
                'client_id'   => $q->client_id,
                'status'      => $q->status,
                'date'        => $q->date->format('d/m/Y'),
                'expiry_date' => $q->expiry_date?->format('d/m/Y'),
                'total'       => (float) $q->total,
            ]);

        $stats = [
            'total'    => Quotation::count(),
            'draft'    => Quotation::where('status', 'draft')->count(),
            'sent'     => Quotation::where('status', 'sent')->count(),
            'accepted' => Quotation::where('status', 'accepted')->count(),
            'rejected' => Quotation::where('status', 'rejected')->count(),
        ];

        return Inertia::render('Quotations/Index', [
            'quotations' => $quotations,
            'stats'      => $stats,
            'clients'    => Client::where('is_active', true)->orderBy('name')->get(['id', 'name']),
            'filters'    => $request->only(['search', 'status', 'client_id']),
        ]);
    }

    public function create(Request $request): Response
    {
        return Inertia::render('Quotations/Create', [
            'clients'           => Client::where('is_active', true)->orderBy('name')->get(['id', 'name', 'tax_condition']),
            'products'          => $this->variantsList(),
            'preselect_client'  => $request->query('client_id'),
        ]);
    }

    public function store(StoreQuotationRequest $request): RedirectResponse
    {
        $quotation = DB::transaction(function () use ($request) {
            [$subtotal, $discountAmount, $total] = $this->calcTotals(
                $request->items,
                (float) ($request->discount_pct ?? 0)
            );

            $quotation = Quotation::create([
                'client_id'       => $request->client_id,
                'user_id'         => auth()->id(),
                'number'          => $this->nextNumber(),
                'status'          => 'draft',
                'date'            => $request->date,
                'expiry_date'     => $request->expiry_date,
                'notes'           => $request->notes,
                'subtotal'        => $subtotal,
                'discount_pct'    => $request->discount_pct ?? 0,
                'discount_amount' => $discountAmount,
                'tax_amount'      => 0,
                'total'           => $total,
            ]);

            foreach ($request->items as $i => $item) {
                $sub = $this->itemSubtotal($item);
                QuotationItem::create([
                    'quotation_id'       => $quotation->id,
                    'product_variant_id' => $item['product_variant_id'] ?? null,
                    'description'        => $item['description'],
                    'quantity'           => $item['quantity'],
                    'unit_price'         => $item['unit_price'],
                    'discount_pct'       => $item['discount_pct'] ?? 0,
                    'subtotal'           => $sub,
                    'sort_order'         => $i,
                ]);
            }

            return $quotation;
        });

        return redirect()->route('quotations.show', $quotation)
            ->with('success', "Presupuesto {$quotation->number} creado.");
    }

    public function show(Quotation $quotation): Response
    {
        $quotation->load(['client', 'user', 'items.variant.product', 'salesOrder']);

        return Inertia::render('Quotations/Show', [
            'quotation' => $this->serializeQuotation($quotation),
            'warehouses' => Warehouse::where('is_active', true)->get(['id', 'name', 'code']),
        ]);
    }

    public function updateStatus(Request $request, Quotation $quotation): RedirectResponse
    {
        $request->validate(['status' => 'required|in:draft,sent,rejected,expired']);

        if (in_array($quotation->status, ['accepted'])) {
            return back()->with('error', 'No se puede cambiar el estado de un presupuesto ya aceptado.');
        }

        $quotation->update(['status' => $request->status]);

        return back()->with('success', 'Estado actualizado.');
    }

    public function convert(Request $request, Quotation $quotation): RedirectResponse
    {
        if ($quotation->status === 'accepted' && $quotation->salesOrder) {
            return redirect()->route('sales-orders.show', $quotation->salesOrder)
                ->with('error', 'Este presupuesto ya fue convertido en una orden.');
        }

        $request->validate([
            'warehouse_id'      => 'required|exists:warehouses,id',
            'payment_type'      => 'required|in:contado,cuotas,cuenta_corriente',
            'installments'      => 'nullable|integer|min:1|max:72',
            'cash_discount_pct' => 'nullable|numeric|min:0|max:100',
        ]);

        $order = DB::transaction(function () use ($request, $quotation) {
            $quotation->update(['status' => 'accepted']);

            $cashDiscountPct = $request->payment_type === 'contado'
                ? (float) ($request->cash_discount_pct ?? 0)
                : 0;

            $discountAmount = round($quotation->subtotal * $cashDiscountPct / 100, 2);
            $total          = round($quotation->subtotal - $discountAmount, 2);

            $order = SalesOrder::create([
                'quotation_id'      => $quotation->id,
                'client_id'         => $quotation->client_id,
                'user_id'           => auth()->id(),
                'warehouse_id'      => $request->warehouse_id,
                'number'            => $this->nextOrderNumber(),
                'status'            => 'pending',
                'date'              => today(),
                'payment_type'      => $request->payment_type,
                'installments'      => $request->installments ?? 1,
                'cash_discount_pct' => $cashDiscountPct,
                'notes'             => $quotation->notes,
                'subtotal'          => $quotation->subtotal,
                'discount_amount'   => $discountAmount,
                'tax_amount'        => 0,
                'total'             => $total,
            ]);

            foreach ($quotation->items as $i => $qItem) {
                SalesOrderItem::create([
                    'sales_order_id'     => $order->id,
                    'product_variant_id' => $qItem->product_variant_id,
                    'description'        => $qItem->description,
                    'quantity'           => $qItem->quantity,
                    'quantity_delivered' => 0,
                    'unit_price'         => $qItem->unit_price,
                    'discount_pct'       => $qItem->discount_pct,
                    'subtotal'           => $qItem->subtotal,
                    'sort_order'         => $i,
                ]);

                if ($qItem->product_variant_id) {
                    Stock::firstOrCreate(
                        ['product_variant_id' => $qItem->product_variant_id, 'warehouse_id' => $request->warehouse_id],
                        ['quantity' => 0, 'reserved_quantity' => 0]
                    );
                    Stock::where('product_variant_id', $qItem->product_variant_id)
                        ->where('warehouse_id', $request->warehouse_id)
                        ->increment('reserved_quantity', $qItem->quantity);
                }
            }

            $this->handleCuentaCorriente($order);

            return $order;
        });

        return redirect()->route('sales-orders.show', $order)
            ->with('success', "Orden de venta {$order->number} creada.");
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private function calcTotals(array $items, float $discountPct): array
    {
        $subtotal       = array_sum(array_map(fn ($i) => $this->itemSubtotal($i), $items));
        $discountAmount = round($subtotal * $discountPct / 100, 2);
        $total          = round($subtotal - $discountAmount, 2);
        return [$subtotal, $discountAmount, $total];
    }

    private function itemSubtotal(array $item): float
    {
        return round(
            $item['quantity'] * $item['unit_price'] * (1 - (($item['discount_pct'] ?? 0) / 100)),
            2
        );
    }

    private function nextNumber(): string
    {
        $last = Quotation::max('id') ?? 0;
        return 'PRES-' . str_pad($last + 1, 6, '0', STR_PAD_LEFT);
    }

    private function nextOrderNumber(): string
    {
        $last = SalesOrder::max('id') ?? 0;
        return 'VTA-' . str_pad($last + 1, 6, '0', STR_PAD_LEFT);
    }

    private function handleCuentaCorriente(SalesOrder $order): void
    {
        if ($order->payment_type !== 'cuenta_corriente') return;

        $client  = Client::find($order->client_id);
        $account = $client->account;
        if (! $account) return;

        $account->movements()->create([
            'type'           => 'debit',
            'amount'         => $order->total,
            'description'    => "Orden de venta {$order->number}",
            'reference_type' => 'sales_order',
            'reference_id'   => $order->id,
            'created_at'     => now(),
        ]);
        $account->increment('balance', $order->total);
        $account->touch();
    }

    private function variantsList(): array
    {
        return ProductVariant::where('is_active', true)
            ->with('product:id,name,code,unit')
            ->get()
            ->map(fn ($v) => [
                'id'         => $v->id,
                'sku'        => $v->sku,
                'name'       => $v->product?->name,
                'code'       => $v->product?->code,
                'unit'       => $v->product?->unit,
                'sale_price' => (float) $v->sale_price,
            ])
            ->sortBy('name')
            ->values()
            ->all();
    }

    private function serializeQuotation(Quotation $q): array
    {
        return [
            'id'              => $q->id,
            'number'          => $q->number,
            'status'          => $q->status,
            'date'            => $q->date->format('d/m/Y'),
            'expiry_date'     => $q->expiry_date?->format('d/m/Y'),
            'notes'           => $q->notes,
            'subtotal'        => (float) $q->subtotal,
            'discount_pct'    => (float) $q->discount_pct,
            'discount_amount' => (float) $q->discount_amount,
            'tax_amount'      => (float) $q->tax_amount,
            'total'           => (float) $q->total,
            'created_by'      => $q->user?->name,
            'client'          => [
                'id'            => $q->client?->id,
                'name'          => $q->client?->name,
                'tax_condition' => $q->client?->tax_condition,
            ],
            'sales_order_id'  => $q->salesOrder?->id,
            'sales_order_number' => $q->salesOrder?->number,
            'items'           => $q->items->map(fn ($item) => [
                'id'                 => $item->id,
                'product_variant_id' => $item->product_variant_id,
                'description'        => $item->description,
                'quantity'           => (float) $item->quantity,
                'unit_price'         => (float) $item->unit_price,
                'discount_pct'       => (float) $item->discount_pct,
                'subtotal'           => (float) $item->subtotal,
            ])->values(),
        ];
    }
}
