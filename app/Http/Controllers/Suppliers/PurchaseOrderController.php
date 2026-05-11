<?php

namespace App\Http\Controllers\Suppliers;

use App\Http\Controllers\Controller;
use App\Http\Requests\Suppliers\StorePurchaseOrderRequest;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderItem;
use App\Models\Stock;
use App\Models\Supplier;
use App\Models\Warehouse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class PurchaseOrderController extends Controller
{
    public function index(Request $request): Response
    {
        $query = PurchaseOrder::with('supplier')
            ->withCount('items');

        if ($request->search) {
            $query->where(fn ($q) => $q
                ->where('order_number', 'like', "%{$request->search}%")
                ->orWhereHas('supplier', fn ($sq) => $sq->where('name', 'like', "%{$request->search}%"))
            );
        }
        if ($request->status) {
            $query->where('status', $request->status);
        }
        if ($request->supplier_id) {
            $query->where('supplier_id', $request->supplier_id);
        }

        $orders = $query->orderByDesc('order_date')->paginate(25)->withQueryString()
            ->through(fn (PurchaseOrder $o) => [
                'id'           => $o->id,
                'order_number' => $o->order_number,
                'supplier'     => $o->supplier?->name,
                'supplier_id'  => $o->supplier_id,
                'status'       => $o->status,
                'order_date'   => $o->order_date->format('d/m/Y'),
                'expected_date'=> $o->expected_date?->format('d/m/Y'),
                'total'        => (float) $o->total,
                'items_count'  => $o->items_count,
            ]);

        $stats = [
            'total'    => PurchaseOrder::count(),
            'draft'    => PurchaseOrder::where('status', 'draft')->count(),
            'sent'     => PurchaseOrder::where('status', 'sent')->count(),
            'partial'  => PurchaseOrder::where('status', 'partial')->count(),
            'received' => PurchaseOrder::where('status', 'received')->count(),
        ];

        return Inertia::render('PurchaseOrders/Index', [
            'orders'    => $orders,
            'stats'     => $stats,
            'suppliers' => Supplier::where('is_active', true)->orderBy('name')->get(['id', 'name']),
            'filters'   => $request->only(['search', 'status', 'supplier_id']),
        ]);
    }

    public function create(Request $request): Response
    {
        return Inertia::render('PurchaseOrders/Create', [
            'suppliers' => Supplier::where('is_active', true)->orderBy('name')->get(['id', 'name', 'payment_terms']),
            'products'  => $this->variantsList(),
            'warehouses' => Warehouse::where('is_active', true)->get(['id', 'name', 'code']),
            'preselect_supplier' => $request->query('supplier_id'),
        ]);
    }

    public function store(StorePurchaseOrderRequest $request): RedirectResponse
    {
        $order = DB::transaction(function () use ($request) {
            $orderNumber = $this->nextOrderNumber();

            $order = PurchaseOrder::create([
                'supplier_id'   => $request->supplier_id,
                'user_id'       => auth()->id(),
                'order_number'  => $orderNumber,
                'status'        => 'draft',
                'order_date'    => $request->order_date,
                'expected_date' => $request->expected_date,
                'notes'         => $request->notes,
                'subtotal'      => 0,
                'tax_amount'    => 0,
                'total'         => 0,
            ]);

            $subtotal = 0;

            foreach ($request->items as $item) {
                $sub = round($item['quantity_ordered'] * $item['unit_price'], 2);
                PurchaseOrderItem::create([
                    'purchase_order_id'  => $order->id,
                    'product_variant_id' => $item['product_variant_id'],
                    'quantity_ordered'   => $item['quantity_ordered'],
                    'quantity_received'  => 0,
                    'unit_price'         => $item['unit_price'],
                    'subtotal'           => $sub,
                ]);
                $subtotal += $sub;
            }

            $order->update(['subtotal' => $subtotal, 'total' => $subtotal]);

            return $order;
        });

        return redirect()->route('purchase-orders.show', $order)
            ->with('success', "Orden de compra {$order->order_number} creada.");
    }

    public function show(PurchaseOrder $purchaseOrder): Response
    {
        $purchaseOrder->load([
            'supplier',
            'user',
            'items.variant.product',
            'items.variant.stockItems.warehouse',
        ]);

        return Inertia::render('PurchaseOrders/Show', [
            'order' => $this->serializeOrder($purchaseOrder),
            'warehouses' => Warehouse::where('is_active', true)->get(['id', 'name', 'code']),
        ]);
    }

    public function receive(Request $request, PurchaseOrder $purchaseOrder): RedirectResponse
    {
        if (in_array($purchaseOrder->status, ['received', 'cancelled'])) {
            return back()->with('error', 'Esta orden no se puede recepcionar.');
        }

        $validated = $request->validate([
            'items'                       => 'required|array',
            'items.*.id'                  => 'required|exists:purchase_order_items,id',
            'items.*.quantity_received'   => 'required|numeric|min:0',
            'warehouse_id'                => 'required|exists:warehouses,id',
        ]);

        DB::transaction(function () use ($validated, $purchaseOrder) {
            foreach ($validated['items'] as $itemData) {
                $item = $purchaseOrder->items()->findOrFail($itemData['id']);

                $newReceived = min(
                    (float) $itemData['quantity_received'],
                    (float) $item->quantity_ordered
                );

                if ($newReceived <= 0) continue;

                $delta = $newReceived - (float) $item->quantity_received;
                if ($delta <= 0) continue;

                $item->update(['quantity_received' => $newReceived]);

                Stock::updateOrCreate(
                    [
                        'product_variant_id' => $item->product_variant_id,
                        'warehouse_id'       => $validated['warehouse_id'],
                    ],
                    ['updated_at' => now()]
                );

                Stock::where('product_variant_id', $item->product_variant_id)
                    ->where('warehouse_id', $validated['warehouse_id'])
                    ->increment('quantity', $delta);

                // Update variant cost price
                ProductVariant::where('id', $item->product_variant_id)
                    ->update(['cost_price' => $item->unit_price]);
            }

            $allReceived = $purchaseOrder->items()
                ->whereColumn('quantity_received', '<', 'quantity_ordered')
                ->doesntExist();

            $anyReceived = $purchaseOrder->items()
                ->where('quantity_received', '>', 0)
                ->exists();

            $purchaseOrder->update([
                'status'      => $allReceived ? 'received' : ($anyReceived ? 'partial' : $purchaseOrder->status),
                'received_at' => $allReceived ? now() : $purchaseOrder->received_at,
            ]);
        });

        return back()->with('success', 'Recepción registrada y stock actualizado.');
    }

    public function updateStatus(Request $request, PurchaseOrder $purchaseOrder): RedirectResponse
    {
        $request->validate(['status' => 'required|in:draft,sent,cancelled']);

        if ($purchaseOrder->status === 'received') {
            return back()->with('error', 'No se puede cambiar el estado de una orden ya recibida.');
        }

        $purchaseOrder->update(['status' => $request->status]);

        return back()->with('success', 'Estado actualizado.');
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private function nextOrderNumber(): string
    {
        $last = PurchaseOrder::max('id') ?? 0;
        return 'OC-' . str_pad($last + 1, 6, '0', STR_PAD_LEFT);
    }

    private function variantsList(): array
    {
        return ProductVariant::where('is_active', true)
            ->with('product:id,name,code,unit')
            ->get()
            ->map(fn ($v) => [
                'id'         => $v->id,
                'sku'        => $v->sku,
                'product_id' => $v->product_id,
                'name'       => $v->product?->name,
                'code'       => $v->product?->code,
                'unit'       => $v->product?->unit,
                'cost_price' => (float) $v->cost_price,
            ])
            ->sortBy('name')
            ->values()
            ->all();
    }

    private function serializeOrder(PurchaseOrder $order): array
    {
        return [
            'id'            => $order->id,
            'order_number'  => $order->order_number,
            'status'        => $order->status,
            'order_date'    => $order->order_date->format('d/m/Y'),
            'expected_date' => $order->expected_date?->format('d/m/Y'),
            'notes'         => $order->notes,
            'subtotal'      => (float) $order->subtotal,
            'tax_amount'    => (float) $order->tax_amount,
            'total'         => (float) $order->total,
            'received_at'   => $order->received_at?->format('d/m/Y H:i'),
            'supplier'      => [
                'id'   => $order->supplier?->id,
                'name' => $order->supplier?->name,
                'cuit' => $order->supplier?->cuit,
            ],
            'created_by'    => $order->user?->name,
            'items'         => $order->items->map(fn (PurchaseOrderItem $item) => [
                'id'                  => $item->id,
                'product_variant_id'  => $item->product_variant_id,
                'sku'                 => $item->variant?->sku,
                'product_name'        => $item->variant?->product?->name,
                'product_code'        => $item->variant?->product?->code,
                'unit'                => $item->variant?->product?->unit,
                'quantity_ordered'    => (float) $item->quantity_ordered,
                'quantity_received'   => (float) $item->quantity_received,
                'pending'             => (float) ($item->quantity_ordered - $item->quantity_received),
                'unit_price'          => (float) $item->unit_price,
                'subtotal'            => (float) $item->subtotal,
            ])->values(),
        ];
    }
}
