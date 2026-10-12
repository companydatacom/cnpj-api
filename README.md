# Brazilian CNPJ register API by CompanyData

[![npm](https://img.shields.io/npm/v/@companydata/cnpj-api.svg)](https://www.npmjs.com/package/@companydata/cnpj-api)

A small, typed TypeScript wrapper for looking up **Brazilian company data from the CNPJ register (Receita Federal)**: company names, full street addresses, phone, email, website, size and revenue, through one REST call.

This package is a thin convenience layer over the master [`@companydata/companydata-sdk`](https://github.com/companydatacom/companydata-sdk). It is the same API and the same key, with the country pinned to Brazil and a register-specific helper on top, so you can write `client.getByCnpj("33.000.167/0001-01")` instead of assembling query parameters by hand.

> One schema, one key. Every CompanyData register wrapper returns records in the same shape, so moving from CNPJ to another country's register is a one-line change.

## At a glance

| | |
| --- | --- |
| Country | 🇧🇷 Brazil (`countryCode: "BR"`) |
| Register | Brazilian CNPJ register (Receita Federal) |
| Businesses in CompanyData | 29.9M |
| With phone number | 8.14M |
| With email address | 1.33M |
| Lookup key | CNPJ (14 digits) |
| Verified example | Petrobras, `33.000.167/0001-01` |
| Live demo and comparison | [companydata.com/cnpj-api](https://companydata.com/cnpj-api/) |
| Official register | [gov.br/receitafederal](https://www.gov.br/receitafederal) |

Counts are from the live API on 2026-10-12 and grow over time.

## What is the CNPJ?

The **CNPJ** (Cadastro Nacional da Pessoa Jurídica) is the Brazilian federal register of legal entities, maintained by the Receita Federal. Every establishment gets a 14-digit CNPJ, and the Receita publishes the register as open data.

What the official channels do **not** give you: the open data comes as multi-gigabyte monthly dumps you must load and join yourself, the website is one lookup at a time with a captcha, and there is no API to filter by city, industry, size or contact availability.

**CompanyData adds the missing fields.** 29.9M Brazilian businesses with full addresses, phone, email, website, directors and firmographics, filterable and exportable in bulk through one live REST API. Comparison and a live lookup: [companydata.com/cnpj-api](https://companydata.com/cnpj-api/).

## Installation

```bash
npm install @companydata/cnpj-api
```

Get an API key at [app.companydata.com/signup-api](https://app.companydata.com/signup-api). Your first calls are free.

## Quickstart

```ts
import { CnpjClient } from "@companydata/cnpj-api";

const client = new CnpjClient({
  auth: { type: "apiKey", apiKey: process.env.COMPANYDATA_API_KEY! }
});

// Look up one business by its CNPJ.
const company = await client.getByCnpj("33.000.167/0001-01"); // Petrobras

// Search with filters (country is always BR here).
const page = await client.search({
  cityName: "SAO PAULO",
  hasEmail: true,
  hasWebsite: true,
  page: 1,
  pageSize: 25
});
console.log(page.totalCount, page.records[0]?.["Company Name"]);
```

> **City and province names are UPPER CASE.** Filter on `cityName: "SAO PAULO"`, not `"Sao paulo"` (which returns 0). The same goes for `provinceName: "RIO DE JANEIRO"`. List exact names per country with `GET /api/cities`. Full field and filter reference: [companydata.com/api-docs/request-company](https://companydata.com/api-docs/request-company/).

Run the full example against the live API with your key:

```bash
git clone https://github.com/companydatacom/cnpj-api && cd cnpj-api && npm install
COMPANYDATA_API_KEY=... npm run test:live
```

## What a record looks like

Every record is a flat object with human-readable keys. This is Petrobras as returned by `getByCnpj`:

```json
{
  "Company Name": "Petroleo Brasileiro S A Petrobras",
  "Trade Name": "PETROBRAS - EDISE",
  "Company Registration Number": "33000167000101",
  "Address 1": "Av. Republica Do Chile 65",
  "Postal Code": "20031-170",
  "City": "Rio de Janeiro",
  "State/Province": "Rio de Janeiro",
  "Country": "Brazil",
  "Phone Number": "+5*****01",
  "Email": null,
  "Website": "petrobras.*****",
  "Founding Year": 1966,
  "Employees Total": 50687,
  "Yearly Revenue in U.S. Dollars": 90437646629,
  "Business Category Code 1 - Description": "Petroleum Refining",
  "Business Legal Type - Description": "Corporation"
}
```

**Search is a preview, export is the full record.** `search` (and the lookup helper, which uses it) returns about 20 fields with phone, email and website masked as `*****`, and does not spend credits. `export`, `exportWithScroll` and `iterate` return the full record (about 35 fields, unmasked contact details, SIC and national industry codes, legal status, group structure) and spend one credit per company you have not exported before. Which fields are on a record depends on your key's configuration. See the [field reference](https://companydata.com/api-docs/request-company/) and [plans and credits](https://companydata.com/api-docs/authentication/).

## Methods

| Method | Returns | Does |
| --- | --- | --- |
| `client.search(params)` | `CnpjPage` | Search Brazilian businesses with filters. |
| `client.getByCnpj(id, scope?)` | `CompanyRecord \| null` | Fetch one business by CNPJ. `scope` adds extra filters when a number is not unique. |
| `client.export(params)` | `CnpjPage` | Export one page of results (standard pagination). |
| `client.exportWithScroll(params)` | `CnpjScrollBatch` | One scroll batch (max 50 records). Pass `scrollId` back in for the next. |
| `client.iterate(params, { maxRecords })` | `AsyncGenerator<CompanyRecord>` | Streams every matching record across scroll batches. |
| `client.raw` | `ApiClient` | The underlying master SDK client, for anything not wrapped here. |
| `normalizeCnpjId(id)` | `string` | The CNPJ normalisation the lookup helper applies. |

```ts
interface CnpjPage {
  records: CompanyRecord[];   // flat objects, keys like "Company Name", "City", "Email"
  totalCount: number;         // matches across all pages
  page: number;
  totalPages: number;
  pageSize: number;
}

interface CnpjScrollBatch {
  records: CompanyRecord[];
  scrollId: string | null;    // pass back in to get the next batch
  hasMoreRecords: boolean;
  pageSize: number;
}
```

`params` is the master SDK's filter set with `countryCode` removed, because it is always `"BR"` here. For cross-border queries, use the master SDK directly.

### Lookup by CNPJ

`getByCnpj` takes the 14-digit CNPJ. Punctuation is stripped, so `"33.000.167/0001-01"` and `"33000167000101"` match the same establishment.

## Recipes

**Find a company by name, pinned to a city**

```ts
const { records, totalCount } = await client.search({
  search: "Petrobras",
  cityName: "RIO DE JANEIRO",
  pageSize: 5
});
```

**Build a segment: companies in a province with 50 or more employees**

```ts
const page = await client.search({
  provinceName: "RIO DE JANEIRO",
  employeesTotal: { min: 50 },
  hasPhone: true,
  pageSize: 100
});
```

**Stream a whole segment with scroll export**

```ts
for await (const company of client.iterate(
  { cityName: "SAO PAULO", hasEmail: true },
  { maxRecords: 5000 }
)) {
  console.log(company["Company Name"], company["Email"]);
}
```

**Drive the scroll loop yourself**

```ts
let batch = await client.exportWithScroll({ cityName: "SAO PAULO", hasEmail: true, pageSize: 50 });
while (batch.records.length > 0) {
  process(batch.records);
  if (!batch.hasMoreRecords || !batch.scrollId) break;
  batch = await client.exportWithScroll({ cityName: "SAO PAULO", hasEmail: true, scrollId: batch.scrollId, pageSize: 50 });
}
```

**Anything else: drop to the master client**

```ts
const res = await client.raw.company.search({ countryCode: "DE", cityName: "BERLIN", pageSize: 10 });
```

### Common filters

| Filter | Example | Notes |
| --- | --- | --- |
| `search` | `"Petrobras"` | Free text over company and trade names. |
| `nationalId` | `"33000167000101"` | Registration number. The lookup helper sets this for you. |
| `cityName` | `"SAO PAULO"` | UPPER CASE. |
| `provinceName` | `"RIO DE JANEIRO"` | Admin-2 name, UPPER CASE (the record's `State/Province`). |
| `postalCode` | `"20031-170"` | Exact match. |
| `hasEmail`, `hasPhone`, `hasWebsite` | `true` | Contact availability. |
| `employeesTotal`, `annualSales`, `foundingYears` | `{ min: 50, max: 500 }` | Range filters. |
| `sic4Digits` | `"7372"` | 4-digit SIC industry code. |

Full list: [companydata.com/api-docs/request-company](https://companydata.com/api-docs/request-company/).

## Known limitations

- City names in the filter index are stored without accents: `SAO PAULO`, not `SÃO PAULO`.

## Four ways to integrate

Pick whichever fits how you build. All four hit the same data behind the same key.

1. **This register SDK** (`@companydata/cnpj-api`): Brazilian lookups with a CNPJ-specific helper. You are here.
2. **Master SDK** ([`@companydata/companydata-sdk`](https://github.com/companydatacom/companydata-sdk)): all 200+ countries in one typed client, keyed by `countryCode`.
3. **MCP server**: connect an AI agent (Claude, Cursor and others) to `https://companydata.com/mcp/` with your key in the `x-api-key` header. See [companydata-mcp-server](https://github.com/companydatacom/companydata-mcp-server).
4. **Raw REST**: call `GET https://app.companydata.com/api/company/search?countryCode=BR&cityName=SAO%20PAULO` with an `x-api-key` header. Contract: [companydata.com/openapi.json](https://companydata.com/openapi.json).

```bash
curl -H "x-api-key: $COMPANYDATA_API_KEY" \
  "https://app.companydata.com/api/company/search?countryCode=BR&nationalId=33000167000101&pageSize=1"
```

## Error handling

Failed requests throw `ApiError` with the HTTP status. The client retries transient failures (429 and 5xx) with backoff before giving up.

```ts
import { ApiError } from "@companydata/cnpj-api";

try {
  await client.search({ cityName: "SAO PAULO" });
} catch (err) {
  if (err instanceof ApiError) {
    // 401: bad or missing key, 429: rate limited,
    // "Export credit limit exceeded" (code credits_limit_exceeded): export credits used up
    console.error(err.status, err.message);
  }
}
```

A scroll batch that is larger than your remaining credits is rejected as a whole, so keep `pageSize` small when a key is close to its limit.

## All register wrappers

Same pattern, one per official register. Every wrapper returns the same record shape.

| Country | Register | Package | Lookup helper |
| --- | --- | --- | --- |
| 🇳🇱 Netherlands | KVK | [`@companydata/kvk-api`](https://github.com/companydatacom/kvk-api) | `getByKvkNumber` |
| 🇩🇪 Germany | Handelsregister | [`@companydata/handelsregister-api`](https://github.com/companydatacom/handelsregister-api) | `getByRegistrationNumber` |
| 🇬🇧 United Kingdom | Companies House | [`@companydata/companies-house-api`](https://github.com/companydatacom/companies-house-api) | `getByCompanyNumber` |
| 🇫🇷 France | Sirene | [`@companydata/sirene-api`](https://github.com/companydatacom/sirene-api) | `getBySiret` |
| 🇧🇪 Belgium | KBO/BCE | [`@companydata/kbo-api`](https://github.com/companydatacom/kbo-api) | `getByEnterpriseNumber` |
| 🇵🇱 Poland | KRS | [`@companydata/krs-api`](https://github.com/companydatacom/krs-api) | `getByNip` |
| 🇸🇪 Sweden | Bolagsverket | [`@companydata/bolagsverket-api`](https://github.com/companydatacom/bolagsverket-api) | `getByOrgNumber` |
| 🇨🇭 Switzerland | Zefix | [`@companydata/zefix-api`](https://github.com/companydatacom/zefix-api) | `getByUid` |
| 🇨🇿 Czech Republic | ARES | [`@companydata/ares-api`](https://github.com/companydatacom/ares-api) | `getByIco` |
| 🇩🇰 Denmark | CVR | [`@companydata/cvr-api`](https://github.com/companydatacom/cvr-api) | `getByCvr` |
| 🇧🇷 Brazil | CNPJ | [`@companydata/cnpj-api`](https://github.com/companydatacom/cnpj-api) | `getByCnpj` |
| 🇦🇺 Australia | ABR | [`@companydata/abn-lookup-api`](https://github.com/companydatacom/abn-lookup-api) | `getByAbn` |
| 🇺🇸 United States | SEC EDGAR | [`@companydata/sec-edgar-api`](https://github.com/companydatacom/sec-edgar-api) | `getByRegistrationNumber` |

Plus the master SDK for every other country: [`@companydata/companydata-sdk`](https://github.com/companydatacom/companydata-sdk).

## License

MIT. Built and maintained by [CompanyData.com](https://companydata.com).
