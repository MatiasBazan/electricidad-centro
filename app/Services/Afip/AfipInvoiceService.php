<?php

namespace App\Services\Afip;

use App\Models\AfipPos;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\SalesOrder;
use Illuminate\Support\Facades\DB;

class AfipInvoiceService
{
    public function __construct(
        private readonly AfipWsfeService $wsfe
    ) {}

    public function authorizeFromOrder(SalesOrder $order, int $posId, int $concepto, int $userId): Invoice
    {
        $pos    = AfipPos::findOrFail($posId);
        $client = $order->client;

        $invoiceType = config('afip.tax_to_invoice_type.' . $client->tax_condition, 'B');
        $cbteTipo    = config('afip.cbte_tipos.' . $invoiceType);

        // Get next number
        $lastNumber = $this->wsfe->getLastNumber($pos->number, $cbteTipo);
        $nextNumber = $lastNumber + 1;

        // Build items and amounts
        [$items, $netTaxed, $netExempt, $ivaTotal, $ivaBreakdown] = $this->buildItems($order);

        $total = round($netTaxed + $netExempt + $ivaTotal, 2);

        // Doc tipo/nro
        [$docTipo, $docNro] = $this->resolveDoc($client, $invoiceType);

        // Create invoice record (pending)
        return DB::transaction(function () use (
            $order, $client, $pos, $userId,
            $invoiceType, $cbteTipo, $nextNumber, $concepto,
            $docTipo, $docNro, $netTaxed, $netExempt, $ivaTotal, $total,
            $items, $ivaBreakdown
        ) {
            $invoice = Invoice::create([
                'client_id'            => $client->id,
                'user_id'              => $userId,
                'sales_order_id'       => $order->id,
                'afip_pos_id'          => $pos->id,
                'invoice_type'         => $invoiceType,
                'cbte_tipo'            => $cbteTipo,
                'number'               => $nextNumber,
                'date'                 => today(),
                'cuit_sender'          => config('afip.cuit'),
                'tax_condition_sender' => 'responsable_inscripto',
                'cuit_receiver'        => $client->cuit_cuil,
                'tax_condition_receiver' => $client->tax_condition,
                'net_taxed'            => $netTaxed,
                'net_untaxed'          => 0,
                'net_exempt'           => $netExempt,
                'iva_amount'           => $ivaTotal,
                'other_taxes'          => 0,
                'total'                => $total,
                'status'               => 'pending',
            ]);

            foreach ($items as $item) {
                InvoiceItem::create(array_merge(['invoice_id' => $invoice->id], $item));
            }

            // Call AFIP
            $wsfeReq = $this->buildWsfeRequest(
                $pos->number, $cbteTipo, $nextNumber, $concepto,
                $docTipo, $docNro,
                $netTaxed, $netExempt, $ivaTotal, $total,
                $ivaBreakdown
            );

            try {
                $afipResponse = $this->wsfe->authorize($wsfeReq);
            } catch (\Throwable $e) {
                $invoice->update(['status' => 'rejected', 'afip_result' => ['error' => $e->getMessage()]]);
                throw $e;
            }

            if ($afipResponse['resultado'] === 'A') {
                $invoice->update([
                    'cae'         => $afipResponse['cae'],
                    'cae_expiry'  => $afipResponse['cae_expiry'],
                    'status'      => 'approved',
                    'afip_result' => $afipResponse,
                ]);
            } else {
                $invoice->update([
                    'status'      => 'rejected',
                    'afip_result' => $afipResponse,
                ]);
            }

            return $invoice->fresh();
        });
    }

    private function buildItems(SalesOrder $order): array
    {
        $order->load(['items.variant.product']);

        $invoiceItems  = [];
        $totalNetTaxed = 0;
        $totalNetExempt= 0;
        $totalIva      = 0;
        $ivaByRate     = [];

        foreach ($order->items as $item) {
            $ivaRate  = (float) ($item->variant?->product?->iva_rate ?? 21.00);
            $hasIva   = (bool)  ($item->variant?->product?->has_iva  ?? true);
            if (! $hasIva) $ivaRate = 0;

            $subtotalConIva = (float) $item->subtotal; // already discounted
            $divisor        = 1 + $ivaRate / 100;
            $subtotalNeto   = round($subtotalConIva / $divisor, 2);
            $subtotalIva    = round($subtotalConIva - $subtotalNeto, 2);

            if ($ivaRate > 0) {
                $totalNetTaxed += $subtotalNeto;
                $ivaByRate[$ivaRate] = ($ivaByRate[$ivaRate] ?? ['base' => 0, 'iva' => 0]);
                $ivaByRate[$ivaRate]['base'] += $subtotalNeto;
                $ivaByRate[$ivaRate]['iva']  += $subtotalIva;
            } else {
                $totalNetExempt += $subtotalNeto;
            }
            $totalIva += $subtotalIva;

            $invoiceItems[] = [
                'description' => $item->description,
                'quantity'    => (float) $item->quantity,
                'unit_price'  => (float) $item->unit_price / $divisor, // net price
                'iva_rate'    => $ivaRate,
                'iva_amount'  => $subtotalIva,
                'subtotal'    => $subtotalNeto,
                'total'       => $subtotalConIva,
            ];
        }

        // Build IVA breakdown for WSFE
        $ivaBreakdown = [];
        foreach ($ivaByRate as $rate => $data) {
            $afipId = config('afip.iva_ids.' . $rate, 5);
            $ivaBreakdown[] = [
                'Id'      => $afipId,
                'BaseImp' => round($data['base'], 2),
                'Importe' => round($data['iva'], 2),
            ];
        }

        return [
            $invoiceItems,
            round($totalNetTaxed, 2),
            round($totalNetExempt, 2),
            round($totalIva, 2),
            $ivaBreakdown,
        ];
    }

    private function resolveDoc(\App\Models\Client $client, string $invoiceType): array
    {
        if ($invoiceType === 'A') {
            $cuit = preg_replace('/\D/', '', $client->cuit_cuil ?? '');
            return [80, $cuit ?: 0];
        }

        if ($client->tax_condition === 'consumidor_final') {
            return [99, 0];
        }

        $cuit = preg_replace('/\D/', '', $client->cuit_cuil ?? '');
        return $cuit ? [80, $cuit] : [99, 0];
    }

    private function buildWsfeRequest(
        int $posNumber, int $cbteTipo, int $number, int $concepto,
        int $docTipo, int|string $docNro,
        float $netTaxed, float $netExempt, float $ivaTotal, float $total,
        array $ivaBreakdown
    ): array {
        $req = [
            'FeCabReq' => [
                'CantReg'  => 1,
                'PtoVta'   => $posNumber,
                'CbteTipo' => $cbteTipo,
            ],
            'FeDetReq' => [
                'FECAEDetRequest' => [
                    'Concepto'   => $concepto,
                    'DocTipo'    => $docTipo,
                    'DocNro'     => $docNro,
                    'CbteDesde'  => $number,
                    'CbteHasta'  => $number,
                    'CbteFch'    => now()->format('Ymd'),
                    'ImpTotal'   => $total,
                    'ImpTotConc' => 0,
                    'ImpNeto'    => $netTaxed,
                    'ImpOpEx'    => $netExempt,
                    'ImpTrib'    => 0,
                    'ImpIVA'     => $ivaTotal,
                    'MonId'      => 'PES',
                    'MonCotiz'   => 1,
                ],
            ],
        ];

        if (! empty($ivaBreakdown)) {
            $req['FeDetReq']['FECAEDetRequest']['Iva'] = [
                'AlicIva' => count($ivaBreakdown) === 1 ? $ivaBreakdown[0] : $ivaBreakdown,
            ];
        }

        return $req;
    }
}
