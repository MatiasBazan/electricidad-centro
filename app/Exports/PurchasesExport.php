<?php

namespace App\Exports;

use App\Models\PurchaseOrder;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class PurchasesExport implements FromQuery, WithHeadings, WithMapping, WithStyles, WithColumnWidths, WithTitle
{
    public function __construct(private readonly array $filters) {}

    public function title(): string { return 'Compras'; }

    public function query()
    {
        $q = PurchaseOrder::with(['supplier:id,name', 'user:id,name'])
            ->orderByDesc('order_date');

        if (! empty($this->filters['from'])) {
            $q->whereDate('order_date', '>=', $this->filters['from']);
        }
        if (! empty($this->filters['to'])) {
            $q->whereDate('order_date', '<=', $this->filters['to']);
        }
        if (! empty($this->filters['status'])) {
            $q->where('status', $this->filters['status']);
        }
        if (! empty($this->filters['supplier_id'])) {
            $q->where('supplier_id', $this->filters['supplier_id']);
        }

        return $q;
    }

    public function headings(): array
    {
        return ['#Orden', 'Fecha', 'Proveedor', 'Solicitó', 'Estado', 'F. Esperada', 'Subtotal', 'IVA', 'Total'];
    }

    public function map($row): array
    {
        return [
            $row->order_number,
            $row->order_date->format('d/m/Y'),
            $row->supplier?->name ?? '—',
            $row->user?->name ?? '—',
            $row->status,
            $row->expected_date?->format('d/m/Y') ?? '—',
            number_format((float) $row->subtotal, 2, ',', '.'),
            number_format((float) $row->tax_amount, 2, ',', '.'),
            number_format((float) $row->total, 2, ',', '.'),
        ];
    }

    public function styles(Worksheet $sheet): array
    {
        return [
            1 => [
                'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
                'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '2D4C73']],
            ],
        ];
    }

    public function columnWidths(): array
    {
        return ['A' => 14, 'B' => 12, 'C' => 28, 'D' => 20, 'E' => 14, 'F' => 14, 'G' => 14, 'H' => 14, 'I' => 14];
    }
}
