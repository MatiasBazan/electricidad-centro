<?php

namespace App\Exports;

use App\Models\Stock;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class StockExport implements FromQuery, WithHeadings, WithMapping, WithStyles, WithColumnWidths, WithTitle
{
    public function __construct(private readonly array $filters) {}

    public function title(): string { return 'Stock'; }

    public function query()
    {
        $q = Stock::with([
            'variant:id,product_id,sku,cost_price,sale_price',
            'variant.product:id,code,name,category_id',
            'variant.product.category:id,name',
            'warehouse:id,name',
        ]);

        if (! empty($this->filters['warehouse_id'])) {
            $q->where('warehouse_id', $this->filters['warehouse_id']);
        }

        if (! empty($this->filters['below_min'])) {
            $q->whereHas('variant.product', fn ($p) =>
                $p->whereColumn('min_stock', '>', \DB::raw('(SELECT COALESCE(SUM(s2.quantity),0) FROM stock s2 WHERE s2.product_variant_id = stock.product_variant_id)'))
            );
        }

        return $q->orderBy('warehouse_id');
    }

    public function headings(): array
    {
        return ['Código', 'SKU', 'Producto', 'Categoría', 'Depósito', 'Cantidad', 'Reservado', 'Disponible', 'P. Costo', 'P. Venta', 'Valor Stock'];
    }

    public function map($row): array
    {
        $available = (float) $row->quantity - (float) $row->reserved_quantity;
        $valorStock = $available * (float) ($row->variant?->cost_price ?? 0);

        return [
            $row->variant?->product?->code ?? '—',
            $row->variant?->sku ?? '—',
            $row->variant?->product?->name ?? '—',
            $row->variant?->product?->category?->name ?? '—',
            $row->warehouse?->name ?? '—',
            number_format((float) $row->quantity, 2, ',', '.'),
            number_format((float) $row->reserved_quantity, 2, ',', '.'),
            number_format($available, 2, ',', '.'),
            number_format((float) ($row->variant?->cost_price ?? 0), 2, ',', '.'),
            number_format((float) ($row->variant?->sale_price ?? 0), 2, ',', '.'),
            number_format($valorStock, 2, ',', '.'),
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
        return ['A' => 14, 'B' => 16, 'C' => 32, 'D' => 18, 'E' => 16, 'F' => 12, 'G' => 12, 'H' => 12, 'I' => 13, 'J' => 13, 'K' => 15];
    }
}
