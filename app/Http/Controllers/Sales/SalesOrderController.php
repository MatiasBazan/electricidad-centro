<?php

namespace App\Http\Controllers\Sales;

use App\Http\Controllers\Controller;
use App\Http\Requests\Sales\StoreSalesOrderRequest;
use App\Models\Client;
use App\Models\ClientAccount;
use App\Models\DeliveryNote;
use App\Models\DeliveryNoteItem;
use App\Models\ProductVariant;
use App\Models\Quotation;
use App\Models\SalesOrder;
use App\Models\SalesOrderItem;
use App\Models\Stock;
use App\Models\Warehouse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class SalesOrderController extends Controller
{
    public function index(Request $request): Response
    {
        $query = SalesOrder::with('client');

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
        if ($request->payment_type) {
            $query->where('payment_type', $request->payment_type);
        }

        $orders = $query->orderByDesc('date')->paginate(25)->withQueryString()
            ->through(fn (SalesOrder $o) => [
                'id'           => $o->id,
                'number'       => $o->number,
                'client'       => $o->client?->name,
                'client_id'    => $o->client_id,
                'status'       => $o->status,
                'payment_type' => $o->payment_type,
                'date'         => $o->date->format('d/m/Y'),
                'total'        => (float) $o->total,
            ]);

        $stats = [
            'total'     => SalesOrder::count(),
            'pending'   => SalesOrder::where('status', 'pending')->count(),
            'partial'   => SalesOrder::where('status', 'partial')->count(),
            'delivered' => SalesOrder::where('status', 'delivered')->count(),
            'invoiced'  => SalesOrder::where('status', 'invoiced')->count(),
        ];

        return Inertia::render('SalesOrders/Index', [
            'orders'  => $orders,
            'stats'   => $stats,
            'clients' => Client::where('is_active', true)->orderBy('name')->get(['id', 'name']),
            'filters' => $request->only(['search', 'status', 'client_id', 'payment_type']),
        ]);
    }

    public function create(Request $request): Response
    {
        $quotation = null;
        if ($request->quotation_id) {
            $q = Quotation::with('items.variant.product', 'client')->find($request->quotation_id);
            if ($q) {
                $quotation = [
                    'id'       => $q->id,
                    'number'   => $q->number,
                    'client_id' => $q->client_id,
                    'client'   => $q->client?->name,
                    'items'    => $q->items->map(fn ($i) => [
                        'product_variant_id' => $i->product_variant_id,
                        'description'        => $i->description,
                        'quantity'           => (float) $i->quantity,
                        'unit_price'         => (float) $i->unit_price,
                        'discount_pct'       => (float) $i->discount_pct,
                    ])->values(),
                ];
            }
        }

        return Inertia::render('SalesOrders/Create', [
            'clients'           => Client::where('is_active', true)->orderBy('name')->get(['id', 'name', 'tax_condition', 'credit_limit']),
            'products'          => $this->variantsList(),
            'warehouses'        => Warehouse::where('is_active', true)->get(['id', 'name', 'code']),
            'preselect_client'  => $request->query('client_id'),
            'from_quotation'    => $quotation,
        ]);
    }

    public function store(StoreSalesOrderRequest $request): RedirectResponse
    {
        $order = DB::transaction(function () use ($request) {
            $cashDiscountPct = $request->payment_type === 'contado'
                ? (float) ($request->cash_discount_pct ?? 0)
                : 0;

            $subtotal       = 0;
            $itemsData      = [];

            foreach ($request->items as $i => $item) {
                $sub = round(
                    $item['quantity'] * $item['unit_price'] * (1 - (($item['discount_pct'] ?? 0) / 100)),
                    2
                );
                $subtotal += $sub;
                $itemsData[] = array_merge($item, ['subtotal' => $sub, 'sort_order' => $i]);
            }

            $discountAmount = round($subtotal * $cashDiscountPct / 100, 2);
            $total          = round($subtotal - $discountAmount, 2);

            $order = SalesOrder::create([
                'quotation_id'      => $request->quotation_id,
                'client_id'         => $request->client_id,
                'user_id'           => auth()->id(),
                'warehouse_id'      => $request->warehouse_id,
                'number'            => $this->nextNumber(),
                'status'            => 'pending',
                'date'              => $request->date,
                'payment_type'      => $request->payment_type,
                'installments'      => $request->installments ?? 1,
                'cash_discount_pct' => $cashDiscountPct,
                'notes'             => $request->notes,
                'subtotal'          => $subtotal,
                'discount_amount'   => $discountAmount,
                'tax_amount'        => 0,
                'total'             => $total,
            ]);

            foreach ($itemsData as $item) {
                SalesOrderItem::create([
                    'sales_order_id'     => $order->id,
                    'product_variant_id' => $item['product_variant_id'] ?? null,
                    'description'        => $item['description'],
                    'quantity'           => $item['quantity'],
                    'quantity_delivered' => 0,
                    'unit_price'         => $item['unit_price'],
                    'discount_pct'       => $item['discount_pct'] ?? 0,
                    'subtotal'           => $item['subtotal'],
                    'sort_order'         => $item['sort_order'],
                ]);

                if (! empty($item['product_variant_id'])) {
                    Stock::firstOrCreate(
                        ['product_variant_id' => $item['product_variant_id'], 'warehouse_id' => $request->warehouse_id],
                        ['quantity' => 0, 'reserved_quantity' => 0]
                    );
                    Stock::where('product_variant_id', $item['product_variant_id'])
                        ->where('warehouse_id', $request->warehouse_id)
                        ->increment('reserved_quantity', $item['quantity']);
                }
            }

            if ($request->quotation_id) {
                Quotation::find($request->quotation_id)?->update(['status' => 'accepted']);
            }

            $this->handleCuentaCorriente($order);

            return $order;
        });

        return redirect()->route('sales-orders.show', $order)
            ->with('success', "Orden de venta {$order->number} creada.");
    }

    public function show(SalesOrder $salesOrder): Response
    {
        $salesOrder->load([
            'client',
            'user',
            'warehouse',
            'quotation',
            'items.variant.product',
            'deliveries.items.variant',
        ]);

        return Inertia::render('SalesOrders/Show', [
            'order'      => $this->serializeOrder($salesOrder),
            'warehouses' => Warehouse::where('is_active', true)->get(['id', 'name', 'code']),
        ]);
    }

    public function dispatch(Request $request, SalesOrder $salesOrder): RedirectResponse
    {
        if (in_array($salesOrder->status, ['delivered', 'invoiced', 'cancelled'])) {
            return back()->with('error', 'Esta orden no admite más entregas.');
        }

        $validated = $request->validate([
            'items'                          => 'required|array|min:1',
            'items.*.sales_order_item_id'    => 'required|exists:sales_order_items,id',
            'items.*.quantity'               => 'required|numeric|min:0.001',
            'notes'                          => 'nullable|string',
        ]);

        DB::transaction(function () use ($validated, $salesOrder) {
            $note = DeliveryNote::create([
                'sales_order_id' => $salesOrder->id,
                'user_id'        => auth()->id(),
                'warehouse_id'   => $salesOrder->warehouse_id,
                'number'         => $this->nextDeliveryNumber(),
                'status'         => 'dispatched',
                'date'           => today(),
                'notes'          => $validated['notes'] ?? null,
                'dispatched_at'  => now(),
            ]);

            foreach ($validated['items'] as $itemData) {
                $orderItem = $salesOrder->items()->findOrFail($itemData['sales_order_item_id']);
                $pending   = (float) $orderItem->quantity - (float) $orderItem->quantity_delivered;
                $qty       = min((float) $itemData['quantity'], $pending);

                if ($qty <= 0) continue;

                DeliveryNoteItem::create([
                    'delivery_note_id'    => $note->id,
                    'sales_order_item_id' => $orderItem->id,
                    'product_variant_id'  => $orderItem->product_variant_id,
                    'quantity'            => $qty,
                ]);

                $orderItem->increment('quantity_delivered', $qty);

                if ($orderItem->product_variant_id) {
                    Stock::where('product_variant_id', $orderItem->product_variant_id)
                        ->where('warehouse_id', $salesOrder->warehouse_id)
                        ->decrement('quantity', $qty);
                    Stock::where('product_variant_id', $orderItem->product_variant_id)
                        ->where('warehouse_id', $salesOrder->warehouse_id)
                        ->decrement('reserved_quantity', $qty);
                }
            }

            $salesOrder->refresh();
            $allDelivered = $salesOrder->items()
                ->whereColumn('quantity_delivered', '<', 'quantity')
                ->doesntExist();
            $anyDelivered = $salesOrder->items()
                ->where('quantity_delivered', '>', 0)
                ->exists();

            $salesOrder->update([
                'status' => $allDelivered ? 'delivered' : ($anyDelivered ? 'partial' : $salesOrder->status),
            ]);
        });

        return back()->with('success', 'Entrega registrada y stock actualizado.');
    }

    public function cancel(SalesOrder $salesOrder): RedirectResponse
    {
        if (in_array($salesOrder->status, ['invoiced', 'cancelled'])) {
            return back()->with('error', 'Esta orden no se puede cancelar.');
        }

        DB::transaction(function () use ($salesOrder) {
            foreach ($salesOrder->items as $item) {
                if (! $item->product_variant_id) continue;

                $pending = (float) $item->quantity - (float) $item->quantity_delivered;
                if ($pending <= 0) continue;

                Stock::where('product_variant_id', $item->product_variant_id)
                    ->where('warehouse_id', $salesOrder->warehouse_id)
                    ->decrement('reserved_quantity', $pending);
            }

            $salesOrder->update(['status' => 'cancelled']);

            // Reverse CC movement
            if ($salesOrder->payment_type === 'cuenta_corriente') {
                $client  = Client::find($salesOrder->client_id);
                $account = $client?->account;
                if ($account) {
                    $account->movements()->create([
                        'type'           => 'credit',
                        'amount'         => $salesOrder->total,
                        'description'    => "Cancelación orden {$salesOrder->number}",
                        'reference_type' => 'sales_order',
                        'reference_id'   => $salesOrder->id,
                        'created_at'     => now(),
                    ]);
                    $account->decrement('balance', $salesOrder->total);
                    $account->touch();
                }
            }
        });

        return back()->with('success', 'Orden cancelada y stock liberado.');
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private function nextNumber(): string
    {
        $last = SalesOrder::max('id') ?? 0;
        return 'VTA-' . str_pad($last + 1, 6, '0', STR_PAD_LEFT);
    }

    private function nextDeliveryNumber(): string
    {
        $last = DeliveryNote::max('id') ?? 0;
        return 'REM-' . str_pad($last + 1, 6, '0', STR_PAD_LEFT);
    }

    private function handleCuentaCorriente(SalesOrder $order): void
    {
        if ($order->payment_type !== 'cuenta_corriente') return;

        $client  = Client::find($order->client_id);
        $account = $client?->account ?? ClientAccount::create(['client_id' => $client->id, 'balance' => 0]);

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

    private function serializeOrder(SalesOrder $order): array
    {
        return [
            'id'                => $order->id,
            'number'            => $order->number,
            'status'            => $order->status,
            'payment_type'      => $order->payment_type,
            'installments'      => $order->installments,
            'cash_discount_pct' => (float) $order->cash_discount_pct,
            'date'              => $order->date->format('d/m/Y'),
            'notes'             => $order->notes,
            'subtotal'          => (float) $order->subtotal,
            'discount_amount'   => (float) $order->discount_amount,
            'tax_amount'        => (float) $order->tax_amount,
            'total'             => (float) $order->total,
            'created_by'        => $order->user?->name,
            'warehouse'         => $order->warehouse?->name,
            'warehouse_id'      => $order->warehouse_id,
            'client'            => [
                'id'   => $order->client?->id,
                'name' => $order->client?->name,
            ],
            'quotation_number'  => $order->quotation?->number,
            'items'             => $order->items->map(fn (SalesOrderItem $item) => [
                'id'                 => $item->id,
                'product_variant_id' => $item->product_variant_id,
                'description'        => $item->description,
                'quantity'           => (float) $item->quantity,
                'quantity_delivered' => (float) $item->quantity_delivered,
                'pending'            => (float) ($item->quantity - $item->quantity_delivered),
                'unit_price'         => (float) $item->unit_price,
                'discount_pct'       => (float) $item->discount_pct,
                'subtotal'           => (float) $item->subtotal,
            ])->values(),
            'deliveries'        => $order->deliveries->map(fn (DeliveryNote $d) => [
                'id'            => $d->id,
                'number'        => $d->number,
                'status'        => $d->status,
                'date'          => $d->date->format('d/m/Y'),
                'dispatched_at' => $d->dispatched_at?->format('d/m/Y H:i'),
                'items'         => $d->items->map(fn ($di) => [
                    'description' => $di->variant?->product?->name ?? '—',
                    'quantity'    => (float) $di->quantity,
                ])->values(),
            ])->values(),
        ];
    }
}
