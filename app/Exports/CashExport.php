<?php

namespace App\Exports;

use App\Models\CashSession;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class CashExport implements FromQuery, WithHeadings, WithMapping, WithStyles, WithColumnWidths, WithTitle
{
    public function __construct(private readonly array $filters) {}

    public function title(): string { return 'Caja'; }

    public function query()
    {
        $q = CashSession::with(['user:id,name', 'cashRegister:id,name'])
            ->orderByDesc('opened_at');

        if (! empty($this->filters['from'])) {
            $q->whereDate('opened_at', '>=', $this->filters['from']);
        }
        if (! empty($this->filters['to'])) {
            $q->whereDate('opened_at', '<=', $this->filters['to']);
        }
        if (! empty($this->filters['status'])) {
            $q->where('status', $this->filters['status']);
        }

        return $q;
    }

    public function headings(): array
    {
        return ['#', 'Apertura', 'Cierre', 'Operador', 'Caja', 'Estado', 'Fondo inicial', 'Efectivo esperado', 'Efectivo real', 'Diferencia'];
    }

    public function map($row): array
    {
        return [
            $row->id,
            $row->opened_at->format('d/m/Y H:i'),
            $row->closed_at?->format('d/m/Y H:i') ?? '—',
            $row->user?->name ?? '—',
            $row->cashRegister?->name ?? '—',
            $row->status === 'open' ? 'Abierta' : 'Cerrada',
            number_format((float) $row->opening_amount, 2, ',', '.'),
            number_format((float) ($row->expected_cash ?? 0), 2, ',', '.'),
            number_format((float) ($row->closing_amount ?? 0), 2, ',', '.'),
            number_format((float) ($row->difference ?? 0), 2, ',', '.'),
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
        return ['A' => 8, 'B' => 18, 'C' => 18, 'D' => 20, 'E' => 16, 'F' => 12, 'G' => 16, 'H' => 18, 'I' => 16, 'J' => 14];
    }
}
