<?php

namespace App\Http\Controllers\Invoicing;

use App\Http\Controllers\Controller;
use App\Models\AfipPos;
use App\Models\Invoice;
use App\Models\SalesOrder;
use App\Services\Afip\AfipAuthService;
use App\Services\Afip\AfipInvoiceService;
use App\Services\Afip\AfipWsfeService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Inertia\Inertia;
use Inertia\Response;

class InvoiceController extends Controller
{
    public function index(Request $request): Response
    {
        $q = Invoice::with(['client:id,name', 'pos:id,number,name', 'user:id,name'])
            ->orderByDesc('date')
            ->orderByDesc('id');

        if ($request->search) {
            $q->where(fn ($s) => $s
                ->where('number', 'like', "%{$request->search}%")
                ->orWhere('cae', 'like', "%{$request->search}%")
                ->orWhereHas('client', fn ($c) => $c->where('name', 'like', "%{$request->search}%"))
            );
        }
        if ($request->type)   $q->where('invoice_type', $request->type);
        if ($request->status) $q->where('status', $request->status);
        if ($request->from)   $q->whereDate('date', '>=', $request->from);
        if ($request->to)     $q->whereDate('date', '<=', $request->to);

        $invoices = $q->paginate(30)->withQueryString()->through(fn ($i) => [
            'id'           => $i->id,
            'formatted'    => $this->formatNumber($i),
            'invoice_type' => $i->invoice_type,
            'cbte_tipo'    => $i->cbte_tipo,
            'date'         => $i->date->format('d/m/Y'),
            'client'       => $i->client?->name ?? '—',
            'status'       => $i->status,
            'cae'          => $i->cae,
            'cae_expiry'   => $i->cae_expiry?->format('d/m/Y'),
            'total'        => (float) $i->total,
        ]);

        $stats = [
            'approved'       => Invoice::where('status', 'approved')->count(),
            'rejected'       => Invoice::where('status', 'rejected')->count(),
            'total_month'    => Invoice::where('status', 'approved')
                ->whereMonth('date', now()->month)->sum('total'),
        ];

        return Inertia::render('Invoices/Index', [
            'invoices' => $invoices,
            'stats'    => $stats,
            'filters'  => $request->only(['search', 'type', 'status', 'from', 'to']),
        ]);
    }

    public function create(Request $request): Response
    {
        $order = SalesOrder::with([
            'client',
            'items.variant.product.category',
        ])->findOrFail($request->sales_order_id);

        $existing = Invoice::where('sales_order_id', $order->id)
            ->where('status', 'approved')
            ->first();

        $invoiceType = config(
            'afip.tax_to_invoice_type.' . $order->client->tax_condition,
            'B'
        );

        $pos = AfipPos::where('is_active', true)->orderBy('number')->get(['id', 'number', 'name']);

        return Inertia::render('Invoices/Create', [
            'order' => [
                'id'           => $order->id,
                'number'       => $order->number,
                'date'         => $order->date->format('d/m/Y'),
                'client'       => [
                    'id'            => $order->client->id,
                    'name'          => $order->client->name,
                    'cuit_cuil'     => $order->client->cuit_cuil,
                    'tax_condition' => $order->client->tax_condition,
                ],
                'subtotal'     => (float) $order->subtotal,
                'tax_amount'   => (float) $order->tax_amount,
                'total'        => (float) $order->total,
                'items'        => $order->items->map(fn ($i) => [
                    'description' => $i->description,
                    'quantity'    => (float) $i->quantity,
                    'unit_price'  => (float) $i->unit_price,
                    'discount_pct'=> (float) $i->discount_pct,
                    'subtotal'    => (float) $i->subtotal,
                    'iva_rate'    => (float) ($i->variant?->product?->iva_rate ?? 21),
                    'has_iva'     => (bool)  ($i->variant?->product?->has_iva  ?? true),
                ])->values(),
            ],
            'invoice_type' => $invoiceType,
            'already_invoiced' => (bool) $existing,
            'pos_list' => $pos,
            'afip_configured' => (bool) config('afip.cuit'),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'sales_order_id' => 'required|exists:sales_orders,id',
            'pos_id'         => 'required|exists:afip_pos,id',
            'concepto'       => 'required|integer|in:1,2,3',
        ]);

        $order = SalesOrder::findOrFail($data['sales_order_id']);

        try {
            $auth    = app(AfipAuthService::class);
            $wsfe    = app(AfipWsfeService::class, ['authService' => $auth]);
            $service = new AfipInvoiceService($wsfe);

            $invoice = $service->authorizeFromOrder(
                $order,
                (int) $data['pos_id'],
                (int) $data['concepto'],
                $request->user()->id
            );
        } catch (\Throwable $e) {
            return back()->with('error', 'Error AFIP: ' . $e->getMessage());
        }

        if ($invoice->status === 'approved') {
            return redirect()->route('invoices.show', $invoice)
                ->with('success', "Comprobante autorizado. CAE: {$invoice->cae}");
        }

        return redirect()->route('invoices.show', $invoice)
            ->with('error', 'AFIP rechazó el comprobante. Revisá los detalles.');
    }

    public function show(Invoice $invoice): Response
    {
        $invoice->load(['client', 'items', 'pos', 'user:id,name', 'salesOrder:id,number']);

        return Inertia::render('Invoices/Show', [
            'invoice' => [
                'id'                    => $invoice->id,
                'formatted'             => $this->formatNumber($invoice),
                'invoice_type'          => $invoice->invoice_type,
                'cbte_tipo'             => $invoice->cbte_tipo,
                'date'                  => $invoice->date->format('d/m/Y'),
                'status'                => $invoice->status,
                'cae'                   => $invoice->cae,
                'cae_expiry'            => $invoice->cae_expiry?->format('d/m/Y'),
                'cuit_sender'           => $invoice->cuit_sender,
                'tax_condition_sender'  => $invoice->tax_condition_sender,
                'cuit_receiver'         => $invoice->cuit_receiver,
                'tax_condition_receiver'=> $invoice->tax_condition_receiver,
                'net_taxed'             => (float) $invoice->net_taxed,
                'net_exempt'            => (float) $invoice->net_exempt,
                'iva_amount'            => (float) $invoice->iva_amount,
                'total'                 => (float) $invoice->total,
                'notes'                 => $invoice->notes,
                'afip_result'           => $invoice->afip_result,
                'pos'                   => $invoice->pos ? [
                    'number' => str_pad($invoice->pos->number, 5, '0', STR_PAD_LEFT),
                    'name'   => $invoice->pos->name,
                ] : null,
                'client' => [
                    'name'          => $invoice->client?->name,
                    'cuit_cuil'     => $invoice->client?->cuit_cuil,
                    'tax_condition' => $invoice->client?->tax_condition,
                    'address'       => $invoice->client?->address,
                ],
                'user'       => $invoice->user?->name,
                'sales_order'=> $invoice->salesOrder ? [
                    'id'     => $invoice->salesOrder->id,
                    'number' => $invoice->salesOrder->number,
                ] : null,
                'items' => $invoice->items->map(fn ($i) => [
                    'description' => $i->description,
                    'quantity'    => (float) $i->quantity,
                    'unit_price'  => (float) $i->unit_price,
                    'iva_rate'    => (float) $i->iva_rate,
                    'iva_amount'  => (float) $i->iva_amount,
                    'subtotal'    => (float) $i->subtotal,
                    'total'       => (float) $i->total,
                ])->values(),
            ],
        ]);
    }

    public function pdf(Invoice $invoice): HttpResponse
    {
        $invoice->load(['client', 'items', 'pos', 'salesOrder:id,number']);

        $pdf = Pdf::loadView('invoices.pdf', ['invoice' => $invoice])
            ->setPaper('a4', 'portrait');

        $filename = "factura-{$this->formatNumber($invoice)}.pdf";

        return $pdf->download($filename);
    }

    public function cancel(Request $request, Invoice $invoice): RedirectResponse
    {
        if ($invoice->status !== 'approved') {
            return back()->with('error', 'Solo se pueden anular comprobantes aprobados.');
        }

        $invoice->update([
            'status' => 'cancelled',
            'notes'  => ($invoice->notes ? $invoice->notes . "\n" : '') . 'Anulado el ' . now()->format('d/m/Y H:i') . ' por ' . $request->user()->name,
        ]);

        return back()->with('success', 'Comprobante marcado como anulado.');
    }

    private function formatNumber(Invoice $invoice): string
    {
        $pos = str_pad($invoice->pos?->number ?? 0, 5, '0', STR_PAD_LEFT);
        $num = str_pad($invoice->number, 8, '0', STR_PAD_LEFT);
        return "Fcta {$invoice->invoice_type} {$pos}-{$num}";
    }
}
