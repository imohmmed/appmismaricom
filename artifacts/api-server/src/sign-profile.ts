import forge from "node-forge";

/**
 * Signs a mobileconfig XML using PKCS#7 (S/MIME DER format).
 * iOS requires signed profiles for Profile Service callback responses on iOS 16+.
 *
 * Required env vars:
 *   SIGN_CERT_PEM  — SSL certificate PEM (server.crt)
 *   SIGN_KEY_PEM   — Private key PEM     (server.key)
 *   SIGN_CHAIN_PEM — CA chain PEM        (chain.crt) — optional
 *
 * Returns DER Buffer if certs are available, raw UTF-8 Buffer otherwise.
 */
export function signMobileconfig(plistXml: string): { buf: Buffer; signed: boolean } {
  const certPem = process.env.SIGN_CERT_PEM;
  const keyPem = process.env.SIGN_KEY_PEM;
  const chainPem = process.env.SIGN_CHAIN_PEM;

  if (!certPem || !keyPem) {
    console.warn("[sign-profile] SIGN_CERT_PEM / SIGN_KEY_PEM not set — returning unsigned profile");
    return { buf: Buffer.from(plistXml, "utf8"), signed: false };
  }

  try {
    const cert = forge.pki.certificateFromPem(certPem);
    const key = forge.pki.privateKeyFromPem(keyPem);

    const p7 = forge.pkcs7.createSignedData();
    p7.content = forge.util.createBuffer(plistXml, "utf8");
    p7.addCertificate(cert);

    if (chainPem) {
      const matches = chainPem.match(/-----BEGIN CERTIFICATE-----[\s\S]+?-----END CERTIFICATE-----/g) ?? [];
      for (const c of matches) {
        try { p7.addCertificate(forge.pki.certificateFromPem(c)); } catch { /* skip bad chain entry */ }
      }
    }

    p7.addSigner({
      key,
      certificate: cert,
      digestAlgorithm: forge.pki.oids.sha256,
      authenticatedAttributes: [
        { type: forge.pki.oids.contentType, value: forge.pki.oids.data },
        { type: forge.pki.oids.messageDigest },
        { type: forge.pki.oids.signingTime, value: new Date() },
      ],
    });

    p7.sign();

    const der = forge.asn1.toDer(p7.toAsn1()).getBytes();
    return { buf: Buffer.from(der, "binary"), signed: true };
  } catch (err) {
    console.error("[sign-profile] Signing failed, returning unsigned:", err);
    return { buf: Buffer.from(plistXml, "utf8"), signed: false };
  }
}
