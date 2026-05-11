<?php

namespace App\Services\Afip;

use SoapClient;
use SoapFault;

class AfipWsfeService
{
    private SoapClient $client;
    private array      $auth;

    public function __construct(AfipAuthService $authService)
    {
        $wsdl = config('afip.testing')
            ? config('afip.wsfe.wsdl_testing')
            : config('afip.wsfe.wsdl_production');

        try {
            $this->client = new SoapClient($wsdl, [
                'soap_version'       => SOAP_1_2,
                'trace'              => false,
                'exceptions'         => true,
                'connection_timeout' => 20,
            ]);
        } catch (SoapFault $e) {
            throw new \RuntimeException('No se pudo conectar al WSFE: ' . $e->getMessage(), 0, $e);
        }

        $credentials = $authService->getCredentials();

        $this->auth = [
            'Token' => $credentials['token'],
            'Sign'  => $credentials['sign'],
            'Cuit'  => config('afip.cuit'),
        ];
    }

    public function getLastNumber(int $posNumber, int $cbteTipo): int
    {
        try {
            $result = $this->client->FECompUltimoAutorizado([
                'Auth'     => $this->auth,
                'PtoVta'   => $posNumber,
                'CbteTipo' => $cbteTipo,
            ]);

            $r = $result->FECompUltimoAutorizadoResult;

            if (isset($r->Errors)) {
                throw new \RuntimeException($this->extractErrors($r->Errors));
            }

            return (int) ($r->CbteNro ?? 0);
        } catch (SoapFault $e) {
            throw new \RuntimeException('WSFE FECompUltimoAutorizado error: ' . $e->getMessage(), 0, $e);
        }
    }

    public function authorize(array $req): array
    {
        try {
            $result = $this->client->FECAESolicitar([
                'Auth'     => $this->auth,
                'FeCAEReq' => $req,
            ]);

            $r = $result->FECAESolicitarResult;

            // Check for global errors
            if (isset($r->Errors)) {
                throw new \RuntimeException('WSFE Error: ' . $this->extractErrors($r->Errors));
            }

            $det = $r->FeDetResp->FECAEDetResponse;

            return [
                'resultado'    => (string) $det->Resultado,
                'cae'          => isset($det->CAE) ? (string) $det->CAE : null,
                'cae_expiry'   => isset($det->CAEFchVto) ? $this->parseDate((string) $det->CAEFchVto) : null,
                'observaciones'=> isset($det->Observaciones) ? $this->extractObs($det->Observaciones) : [],
                'errores'      => isset($det->Errores) ? $this->extractErrors($det->Errores, true) : [],
            ];
        } catch (SoapFault $e) {
            throw new \RuntimeException('WSFE FECAESolicitar error: ' . $e->getMessage(), 0, $e);
        }
    }

    private function parseDate(string $yyyymmdd): string
    {
        return substr($yyyymmdd, 0, 4) . '-' . substr($yyyymmdd, 4, 2) . '-' . substr($yyyymmdd, 6, 2);
    }

    private function extractErrors(mixed $errors, bool $asArray = false): array|string
    {
        $msgs = [];
        $items = $errors->Err ?? [];
        if (! is_array($items)) {
            $items = [$items];
        }
        foreach ($items as $e) {
            $msgs[] = "[{$e->Code}] {$e->Msg}";
        }
        return $asArray ? $msgs : implode('; ', $msgs);
    }

    private function extractObs(mixed $obs): array
    {
        $msgs  = [];
        $items = $obs->Obs ?? [];
        if (! is_array($items)) {
            $items = [$items];
        }
        foreach ($items as $o) {
            $msgs[] = "[{$o->Code}] {$o->Msg}";
        }
        return $msgs;
    }
}
