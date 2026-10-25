# Thouryathrikam 2026 certificates

Every certificate issued at Thouryathrikam 2026 (GEC Wayanad), and a website to browse, verify and scan them.

**Site:** https://gecwyd.github.io/arts-fest-certificates/

## Verifying a certificate

Open the site and choose *Verify*, then enter the number printed on the certificate, for example
`TH26-000123`, or choose *Scan* and point the camera at the QR code in the certificate's corner. The
site checks the record against its SHA-256 fingerprint and its Ed25519 signature using the public key in
`data/public-key.json`. Everything is checked in the browser.

## What is in this repository

| Path | What it holds |
| --- | --- |
| `index.html`, `app/`, `favicon.svg` | The website: a built React app (static files, nothing to install). |
| `site.config.json` | Where the site downloads certificate PDFs from (the registration app's public print API). |
| `data/certificates.json` | Every issued certificate, with its fingerprint and signature. |
| `data/manifest.json` | Counts, labels and asset link rewrites. |
| `data/public-key.json` | Public key used to check signatures. |
| `templates/` | The certificate templates (HTML with `{{placeholders}}`), one per type. |
| `assets/` | Fonts, logos and signatures the templates use. |
| `scripts/validate.mjs` | Re-checks every certificate; run by CI. |
| `.github/workflows/certificates.yml` | Validates the register, then publishes the site to GitHub Pages. |

These files are written by the registration app: *Update website*, *Publish certificates* and *Sign certificates*
in its Settings commit to this repository, and the workflow deploys the result. Hand edits to generated files are
overwritten on the next publish.

## Pages setup

The workflow deploys through GitHub Pages. If the first run reports that Pages is not enabled, open
*Settings → Pages* and choose *GitHub Actions* as the source. Private repositories need a GitHub plan that includes
Pages for private repositories.
