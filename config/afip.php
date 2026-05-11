<?php

return [
    'cuit'        => env('AFIP_CUIT'),
    'testing'     => (bool) env('AFIP_TESTING', true),
    'cert'        => env('AFIP_CERT_PATH', storage_path('app/afip/cert.pem')),
    'key'         => env('AFIP_KEY_PATH',  storage_path('app/afip/private.key')),
    'default_pos' => (int) env('AFIP_DEFAULT_POS', 1),

    'wsaa' => [
        'wsdl_testing'    => 'https://wsaahomo.afip.gov.ar/ws/services/LoginCms?wsdl',
        'wsdl_production' => 'https://wsaa.afip.gov.ar/ws/services/LoginCms?wsdl',
        'ttl_seconds'     => 36000, // 10 hours (AFIP token lives 12h)
    ],

    'wsfe' => [
        'wsdl_testing'    => 'https://wswhomo.afip.gov.ar/wsfev1/service.asmx?WSDL',
        'wsdl_production' => 'https://servicios1.afip.gov.ar/wsfev1/service.asmx?WSDL',
    ],

    // cbte_tipo numérico AFIP
    'cbte_tipos' => [
        'A'  => 1,
        'NDA'=> 2,
        'NCA'=> 3,
        'B'  => 6,
        'NDB'=> 7,
        'NCB'=> 8,
        'C'  => 11,
    ],

    // IVA alícuota id
    'iva_ids' => [
        0    => 3,
        10.5 => 4,
        21   => 5,
        27   => 6,
    ],

    // Condición fiscal → tipo de factura
    'tax_to_invoice_type' => [
        'responsable_inscripto' => 'A',
        'consumidor_final'      => 'B',
        'monotributista'        => 'B',
        'exento'                => 'B',
    ],
];
