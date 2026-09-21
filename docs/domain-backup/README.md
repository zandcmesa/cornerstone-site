# cornerstonechurchma.com — domain backup (captured 2026-09-20)

Rollback sheet for the domain cutover to GitHub Pages. If anything looks wrong after the switch, set the
records in "Rollback values" back to exactly what is shown and the old site returns within the TTL (5 minutes).

Sources: DreamHost panel screenshots (2026-09-20, 8:34 PM) cross-checked against public and authoritative DNS
queries. Raw resolver output, headers, cert, and WHOIS: `dns-snapshot-2026-09-20.txt` in this folder.

## Who controls what

| Piece | Provider | Notes |
|---|---|---|
| Registrar | DreamHost, LLC | Expires 2027-10-03. Last updated 2026-09-18. DNSSEC unsigned. Status: ok. |
| DNS (nameservers) | DreamHost — ns1/ns2/ns3.dreamhost.com | Panel: Websites → Manage Websites → cornerstonechurchma.com → DNS. |
| Web host (old site) | Flywheel (WordPress, served through Fastly CDN) | IP 151.101.66.159. `www` 301-redirects to the bare domain. HTTP 301s to HTTPS. Plan to be cancelled after launch. |
| Web host (new site) | GitHub Pages | See "Cutover values". |
| TLS certificate | Let's Encrypt, issued by Flywheel | Valid 2026-09-15 → 2026-12-14, covers apex + www. GitHub Pages issues its own; nothing to back up. |
| Email | Google Workspace | MX + `mail`/`calendar`/`docs`/`sites`/`start` shortcuts + Google site-verification TXT. Do not touch during cutover. |

## Rollback values (DreamHost panel, confirmed against ns1.dreamhost.com)

Records the cutover will change (panel section "Custom Records"):

| Host | Type | Value | TTL |
|---|---|---|---|
| `@` | A | `151.101.66.159` | 300 |
| `www` | A | `151.101.66.159` | 300 |

Records the cutover must leave alone (panel section "Custom Records"):

| Host | Type | Value | TTL |
|---|---|---|---|
| `calendar` | CNAME | `ghs.googlehosted.com.` | 300 |
| `docs` | CNAME | `ghs.googlehosted.com.` | 300 |
| `sites` | CNAME | `ghs.googlehosted.com.` | 300 |
| `start` | CNAME | `ghs.googlehosted.com.` | 300 |
| `@` | TXT | `google-site-verification=8dtuvh15CE3JvTbDRsCVbgDt2dUPjuwaJNw5unwSWgY` | 300 |

DreamHost-managed records (panel section "DreamHost Records", not editable, listed for completeness):

| Host | Type | Value |
|---|---|---|
| `mysql` | A | `208.113.244.62` |
| `@` | MX 1 | `ASPMX.L.GOOGLE.COM.` |
| `@` | MX 5 | `ALT1.ASPMX.L.GOOGLE.COM.` |
| `@` | MX 5 | `ALT2.ASPMX.L.GOOGLE.COM.` |
| `@` | MX 10 | `ALT3.ASPMX.L.GOOGLE.COM.` |
| `@` | MX 10 | `ALT4.ASPMX.L.GOOGLE.COM.` |
| `mail` | CNAME | `ghs.googlehosted.com.` |
| `@` | NS | `ns1.dreamhost.com.` |
| `@` | NS | `ns2.dreamhost.com.` |
| `@` | NS | `ns3.dreamhost.com.` |

Nameservers: "Using DreamHost Nameservers" (ns1, ns2, ns3.dreamhost.com). Leave as is; the cutover does not
move nameservers.

Not present today: AAAA, CAA, SPF/DKIM/DMARC TXT, `live`, `give`, `app`, `blog`, `shop`, `webmail`, `ftp`.

## Cutover values (GitHub Pages)

Edit only the two "Custom Records" rows above. Add a `CNAME` file containing `cornerstonechurchma.com` to
the repo root and set the custom domain in the repo's Pages settings before changing DNS.

| Host | Type | New value |
|---|---|---|
| `@` | A | `185.199.108.153` |
| `@` | A | `185.199.109.153` |
| `@` | A | `185.199.110.153` |
| `@` | A | `185.199.111.153` |
| `www` | CNAME | `zandcmesa.github.io.` |

Delete the old `www` A record when adding the `www` CNAME (a host cannot have both). Verify with
`dig cornerstonechurchma.com A @1.1.1.1` and turn on "Enforce HTTPS" in Pages once the cert is issued
(usually under an hour).

## Rollback procedure

1. DreamHost panel → Websites → Manage Websites → cornerstonechurchma.com → DNS → Custom Records.
2. Delete the four `@` A records pointing at 185.199.x.x and the `www` CNAME.
3. Re-add `@` A `151.101.66.159` and `www` A `151.101.66.159`.
4. Wait up to 5 minutes (TTL 300). Confirm with `dig cornerstonechurchma.com A @1.1.1.1`.
5. Rollback only works while the Flywheel site still exists. Do not cancel Flywheel until the new site has
   been stable for the agreed window (suggest 30 days).

## Flags found while capturing

- The Watch page button now points to `https://cornerstonema.online.church/` (swapped 2026-09-20). `live.cornerstonechurchma.com` was never a real subdomain; nothing to add in DNS.
- Google Workspace mail has no SPF or DMARC record. Not part of this task, but worth raising with the church.
