<?php

namespace App\Services\Afip;

use Illuminate\Support\Facades\Cache;
use SoapClient;
use SoapFault;

class AfipAuthService
{
    private string $certPath;
    private string $keyPath;
    private string $wsdl;
    private int    $ttl;

    public function __construct()
    {
        $this->certPath = config('afip.cert');
        $this->keyPath  = config('afip.key');
        $this->wsdl     = config('afip.testing')
            ? config('afip.wsaa.wsdl_testing')
            : config('afip.wsaa.wsdl_production');
        $this->ttl = config('afip.wsaa.ttl_seconds', 36000);
    }

    public function getCredentials(): array
    {
        $cacheKey = 'afip_ta_' . (config('afip.testing') ? 'homo' : 'prod');

        return Cache::remember($cacheKey, $this->ttl, function () {
            return $this->requestNewTicket();
        });
    }

    private function requestNewTicket(): array
    {
        $this->assertFilesExist();

        $tra   = $this->buildTra();
        $cms   = $this->signTra($tra);
        $taXml = $this->callWsaa($cms);

        return $this->parseTA($taXml);
    }

    private function buildTra(): string
    {
        $tz      = new \DateTimeZone('America/Argentina/Buenos_Aires');
        $now     = new \DateTime('now', $tz);
        $expires = (clone $now)->modify('+12 hours');

        return sprintf(
            '<?xml version="1.0" encoding="UTF-8"?>' .
            '<loginTicketRequest version="1.0">' .
                '<header>' .
                    '<uniqueId>%d</uniqueId>' .
                    '<generationTime>%s</generationTime>' .
                    '<expirationTime>%s</expirationTime>' .
                '</header>' .
                '<service>wsfe</service>' .
            '</loginTicketRequest>',
            time(),
            $now->format('Y-m-d\TH:i:sP'),
            $expires->format('Y-m-d\TH:i:sP')
        );
    }

    private function signTra(string $tra): string
    {
        $tmpIn  = tempnam(sys_get_temp_dir(), 'afip_tra_');
        $tmpOut = tempnam(sys_get_temp_dir(), 'afip_cms_');

        try {
            file_put_contents($tmpIn, $tra);

            $ok = openssl_pkcs7_sign(
                $tmpIn,
                $tmpOut,
                'file://' . $this->certPath,
                ['file://' . $this->keyPath, ''],
                [],
                PKCS7_BINARY | PKCS7_NOATTR
            );

            if (! $ok) {
                throw new \RuntimeException('openssl_pkcs7_sign falló: ' . openssl_error_string());
            }

            $smime = file_get_contents($tmpOut);

            // Extract base64 body after MIME headers (blank line separator)
            if (! preg_match('/\r?\n\r?\n(.+)$/s', $smime, $m)) {
                throw new \RuntimeException('No se pudo extraer el CMS del output de OpenSSL.');
            }

            return str_replace(["\r", "\n", ' '], '', $m[1]);
        } finally {
            @unlink($tmpIn);
            @unlink($tmpOut);
        }
    }

    private function callWsaa(string $cms): string
    {
        try {
            $client = new SoapClient($this->wsdl, [
                'soap_version'       => SOAP_1_1,
                'trace'              => false,
                'exceptions'         => true,
                'connection_timeout' => 20,
            ]);

            $result = $client->loginCms(['in0' => $cms]);
            return $result->loginCmsReturn;
        } catch (SoapFault $e) {
            throw new \RuntimeException('WSAA SOAP error: ' . $e->getMessage(), 0, $e);
        }
    }

    private function parseTA(string $taXml): array
    {
        $ta = simplexml_load_string($taXml);

        if (! $ta || ! isset($ta->credentials)) {
            throw new \RuntimeException('Respuesta WSAA inválida.');
        }

        return [
            'token' => (string) $ta->credentials->token,
            'sign'  => (string) $ta->credentials->sign,
        ];
    }

    private function assertFilesExist(): void
    {
        if (! file_exists($this->certPath)) {
            throw new \RuntimeException("Certificado AFIP no encontrado en: {$this->certPath}");
        }
        if (! file_exists($this->keyPath)) {
            throw new \RuntimeException("Clave privada AFIP no encontrada en: {$this->keyPath}");
        }
        if (! config('afip.cuit')) {
            throw new \RuntimeException('AFIP_CUIT no está configurado en .env');
        }
    }
}
