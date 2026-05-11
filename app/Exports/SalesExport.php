<?php

namespace App\Exports;

use App\Models\SalesOrder;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class SalesExport implements FromQuery, WithHeadings, WithMapping, WithStyles, WithColumnWidths, WithTitle
{
    public function __construct(private readonly array $filters) {}

    public function title(): string { return 'Ventas'; }

    public function query()
    {
        $q = SalesOrder::with(['client:id,name', 'user:id,name'])
            ->orderByDesc('date');

        if (! empty($this->filters['from'])) {
            $q->whereDate('date', '>=', $this->filters['from']);
        }
        if (! empty($this->filters['to'])) {
            $q->whereDate('date', '<=', $this->filters['to']);
        }
        if (! empty($this->filters['status'])) {
            $q->where('status', $this->filters['status']);
        }

        return $q;
    }

    public function headings(): array
    {
        return ['#Orden', 'Fecha', 'Cliente', 'Vendedor', 'Estado', 'Tipo pago', 'Subtotal', 'Descuento', 'IVA', 'Total'];
    }

    public function map($row): array
    {
        return [
            $row->number,
            $row->date->format('d/m/Y'),
            $row->client?->name ?? '—',
            $row->user?->name ?? '—',
            $row->status,
            $row->payment_type,
            number_format((float) $row->subtotal, 2, ',', '.'),
            number_format((float) $row->discount_amount, 2, ',', '.'),
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
        return ['A' => 14, 'B' => 12, 'C' => 28, 'D' => 20, 'E' => 14, 'F' => 16, 'G' => 14, 'H' => 14, 'I' => 14, 'J' => 14];
    }
}
