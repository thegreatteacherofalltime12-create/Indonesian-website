# Lemongrass US Site

Website project for **ArgaMatt_Buitenzorg furniture** (formerly Buitenzorg Lemongrass Homecraft, Bogor) — an export-sourcing catalog and inquiry site aimed at US trade buyers of Indonesian outdoor and rattan furniture. The owner acts as an export intermediary for Indonesian workshops (Lemongrass Homecraft among them); buyers import under FOB terms.

Preview: **https://buitenzorg-lemongrass.pages.dev** (Cloudflare Pages, account "Arga and Matt"; deploy with `npm run deploy` in `site/` after `npx wrangler login`).

Status: **preview build**. The site is built from the Lemongrass outdoor price list and the photos received so far; commercial facts are placeholders labelled "to be confirmed" until the company answers the intake questionnaire. Preview builds carry noindex; set `"preview": false` in `site/data/site.json` at launch. Prices stay hidden (`showPrices`) and the build refuses to publish them while the catalog list basis (EXW) differs from the quoted basis (FOB).

## Layout

| Path | What it is |
|---|---|
| `docs/intake/` | The pre-build questionnaire for the company, in English (`intake-en.*`) and Indonesian (`intake-id.*`). The `.md` files are the source; the `.html` files are the styled pages published as Claude artifacts. |
| `docs/research/` | Earlier versions of the research that led to the current questionnaire. Kept for reference — the assumptions in them (consumer sales, live plants) no longer apply. |
| `tools/` | Node scripts that render the `.md` questionnaires to the `.html` pages, plus the shared stylesheet. |
| `client-docs/` | Company documents (profile, price lists). **Excluded from git** — see `.gitignore`. |
| `site/` | The website: `build.js` (static generator, no framework) → `dist/`; `src/` templates, CSS, client script; `functions/api/inquiry.js` (Cloudflare Pages Function for the quote form); `data/site.json` and `data/catalog.json` hold every fact the pages render. `npm run build`, `npm run deploy`. |

## Rebuilding the intake pages

```bash
cd tools
node build-en.js
node build-id.js
```

Both scripts read the `.md` file, render it into a styled single-file HTML page, and write it next to the source. Question numbering is identical in both languages so answers can be matched by number.

## Decisions so far

- **Model:** export agent / sourcing intermediary selling FOB to US businesses, not consumer sales. The buyer handles import. Product data so far comes from Lemongrass price lists quoted per container load.
- **Platform:** not decided. A catalog + quote site needs no checkout, so Shopify is optional; a static site or WordPress behind Cloudflare is a candidate.
- **Analytics:** GA4 + Google Tag Manager + Search Console. Ads (if any) via Google Search on wholesale terms and LinkedIn, owned by the company's accounts.
- **Scope:** to be confirmed by the company — outdoor line (LD) only, indoor rattan (CH/LI/TBI) too, or full catalog.

## Email delivery

Quote requests are emailed through [Resend](https://resend.com). Three secrets are set on the Pages project (`npx wrangler pages secret put <NAME> --project-name buitenzorg-lemongrass`): `RESEND_API_KEY`, `INQUIRY_TO`, `INQUIRY_FROM`. Without them the API still accepts and stores the request, but answers `delivered: false` — no lead is lost when mail breaks.

Currently sending from `onboarding@resend.dev`, Resend’s shared test sender: it only delivers to the address the Resend account was registered with, and Gmail is likely to treat it as spam. **Before launch:** verify the company domain in Resend, send from an address on it (e.g. `quotes@`), and set `INQUIRY_TO` to both owners.

## Order book (admin)

Every quote request is saved to Cloudflare D1 (`buitenzorg-orders`, schema in `site/db/schema.sql`) before the notification email is attempted. The admin page at `/admin/` (bilingual) lists inquiries, tracks them through the pipeline (new → quoted → proforma sent → deposit → in production → inspected → loaded → documents → balance → shipped) with a history, and lets you add inquiries that arrived by email or WhatsApp. It is protected by Cloudflare Access: the API verifies the Access JWT and needs `ACCESS_TEAM` and `ACCESS_AUD` set on the Pages project; until then it refuses with 503. Locally, `site/.dev.vars` sets `DEV_ADMIN_EMAIL` to bypass Access.

## Answers received from the company (20 Sep 2026)

- Legal entity: a registered CV, used on proforma invoices; not to be displayed on the site (`showLegalEntity: false`).
- Buyers: retailers and hotels; markets: United States and Europe.
- Price basis: **FOB Jakarta (Tanjung Priok)**; a price list per product will be supplied (currently PDF only).
- Shipments in 20 ft or 40 ft containers by volume; goods fully assembled; payment to the CV's account.
- Production about 3–4 weeks per shipment.
- Contact: argasurentu@gmail.com (a branded address is recommended before launch), WhatsApp as on the site, 08:00–17:00 WIB, English; buyer visits welcome.
- Still open: deposit/balance schedule, whether prices are shown publicly, exporter of record for documents, species names per item, packing/ISPM-15, inspection service scope, logo, invoices and loading photos (promised).

## Research notes

US-side facts cited in the questionnaire (tariffs, Lacey Act, ISPM-15, CITES) were checked against primary sources in September 2026. US tariff policy changes frequently; re-verify before quoting duty rates to buyers.
