<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, sans-serif; font-size: 11px; color: #1a1a1a; }

  .header { display: flex; justify-content: space-between; border-bottom: 2px solid #2D4C73; padding-bottom: 12px; margin-bottom: 14px; }
  .company h1 { font-size: 18px; font-weight: bold; color: #2D4C73; }
  .company p  { font-size: 10px; color: #555; margin-top: 2px; }

  .cbte-box { border: 2px solid #2D4C73; padding: 8px 16px; text-align: center; min-width: 120px; }
  .cbte-box .letter { font-size: 32px; font-weight: bold; color: #2D4C73; line-height: 1; }
  .cbte-box .tipo   { font-size: 10px; color: #555; margin-top: 2px; }
  .cbte-box .number { font-size: 13px; font-weight: bold; margin-top: 6px; }

  .meta { display: flex; gap: 20px; margin-bottom: 14px; }
  .meta-block { flex: 1; background: #f7f8fa; border: 1px solid #e0e0e0; border-radius: 6px; padding: 8px 10px; }
  .meta-block .label { font-size: 9px; color: #888; text-transform: uppercase; letter-spacing: .5px; }
  .meta-block .val   { font-size: 11px; font-weight: bold; margin-top: 2px; }

  table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
  thead tr { background: #2D4C73; color: white; }
  thead th { padding: 6px 8px; text-align: left; font-size: 10px; font-weight: bold; }
  thead th.r { text-align: right; }
  tbody tr { border-bottom: 1px solid #eee; }
  tbody tr:nth-child(even) { background: #f9f9f9; }
  tbody td { padding: 5px 8px; }
  tbody td.r { text-align: right; }

  .totals { float: right; width: 260px; }
  .totals table td { padding: 4px 8px; }
  .totals .total-row { font-weight: bold; background: #2D4C73; color: white; }

  .cae-box { clear: both; margin-top: 20px; border: 1px solid #ccc; border-radius: 6px; padding: 10px 14px; background: #f7f8fa; }
  .cae-box .cae-title { font-size: 9px; color: #888; text-transform: uppercase; }
  .cae-box .cae-num   { font-size: 14px; font-weight: bold; letter-spacing: 1px; color: #2D4C73; margin-top: 2px; }
  .cae-box .cae-exp   { font-size: 10px; color: #555; margin-top: 3px; }

  .rejected { border: 2px solid #e53e3e; border-radius: 6px; padding: 10px 14px; background: #fff5f5; color: #e53e3e; margin-bottom: 14px; text-align: center; font-weight: bold; }

  .footer { margin-top: 20px; border-top: 1px solid #eee; padding-top: 8px; font-size: 9px; color: #aaa; text-align: center; }
</style>
</head>
<body>

{{-- Header --}}
<div class="header">
  <div class="company">
    <h1>Electricidad Centro</h1>
    <p>CUIT: {{ config('afip.cuit') }}</p>
    <p>Responsable Inscripto</p>
  </div>
  <div class="cbte-box">
    <div class="letter">{{ $invoice->invoice_type }}</div>
    <div class="tipo">
      @if($invoice->cbte_tipo == 1) Factura A
      @elseif($invoice->cbte_tipo == 6) Factura B
      @elseif($invoice->cbte_tipo == 3) Nota de Crédito A
      @elseif($invoice->cbte_tipo == 8) Nota de Crédito B
      @else Comprobante {{ $invoice->cbte_tipo }}
      @endif
    </div>
    <div class="number">
      {{ str_pad($invoice->pos->number ?? 0, 5, '0', STR_PAD_LEFT) }}-{{ str_pad($invoice->number, 8, '0', STR_PAD_LEFT) }}
    </div>
  </div>
</div>

{{-- Meta --}}
<div class="meta">
  <div class="meta-block">
    <div class="label">Fecha</div>
    <div class="val">{{ $invoice->date->format('d/m/Y') }}</div>
  </div>
  <div class="meta-block" style="flex:3">
    <div class="label">Cliente</div>
    <div class="val">{{ $invoice->client->name }}</div>
    @if($invoice->client->cuit_cuil)
    <div style="font-size:10px;color:#555;margin-top:2px">CUIT/CUIL: {{ $invoice->client->cuit_cuil }}</div>
    @endif
    @if($invoice->client->address)
    <div style="font-size:10px;color:#555">{{ $invoice->client->address }}</div>
    @endif
  </div>
  <div class="meta-block">
    <div class="label">Cond. IVA</div>
    <div class="val">{{ ucfirst(str_replace('_', ' ', $invoice->client->tax_condition)) }}</div>
  </div>
</div>

@if($invoice->status === 'rejected')
<div class="rejected">⚠ COMPROBANTE RECHAZADO POR AFIP — NO VÁLIDO</div>
@endif

{{-- Items --}}
<table>
  <thead>
    <tr>
      <th>Descripción</th>
      <th class="r">Cantidad</th>
      <th class="r">Precio unit. neto</th>
      @if($invoice->invoice_type === 'A')
      <th class="r">% IVA</th>
      <th class="r">IVA</th>
      @endif
      <th class="r">Total</th>
    </tr>
  </thead>
  <tbody>
    @foreach($invoice->items as $item)
    <tr>
      <td>{{ $item->description }}</td>
      <td class="r">{{ number_format($item->quantity, 2, ',', '.') }}</td>
      <td class="r">${{ number_format($item->unit_price, 2, ',', '.') }}</td>
      @if($invoice->invoice_type === 'A')
      <td class="r">{{ number_format($item->iva_rate, 0) }}%</td>
      <td class="r">${{ number_format($item->iva_amount, 2, ',', '.') }}</td>
      @endif
      <td class="r">${{ number_format($item->total, 2, ',', '.') }}</td>
    </tr>
    @endforeach
  </tbody>
</table>

{{-- Totals --}}
<div class="totals">
  <table>
    @if($invoice->net_taxed > 0)
    <tr>
      <td>Neto gravado</td>
      <td class="r">${{ number_format($invoice->net_taxed, 2, ',', '.') }}</td>
    </tr>
    @endif
    @if($invoice->net_exempt > 0)
    <tr>
      <td>No gravado / Exento</td>
      <td class="r">${{ number_format($invoice->net_exempt, 2, ',', '.') }}</td>
    </tr>
    @endif
    @if($invoice->iva_amount > 0)
    <tr>
      <td>IVA</td>
      <td class="r">${{ number_format($invoice->iva_amount, 2, ',', '.') }}</td>
    </tr>
    @endif
    <tr class="total-row">
      <td>TOTAL</td>
      <td class="r">${{ number_format($invoice->total, 2, ',', '.') }}</td>
    </tr>
  </table>
</div>

{{-- CAE --}}
<div class="cae-box">
  <div class="cae-title">Código de Autorización Electrónico (CAE)</div>
  <div class="cae-num">{{ $invoice->cae ?? '—' }}</div>
  @if($invoice->cae_expiry)
  <div class="cae-exp">Fecha de vencimiento: {{ $invoice->cae_expiry->format('d/m/Y') }}</div>
  @endif
</div>

<div class="footer">
  Comprobante generado mediante AFIP WSFE · {{ config('afip.testing') ? 'HOMOLOGACIÓN' : 'PRODUCCIÓN' }}
</div>

</body>
</html>
