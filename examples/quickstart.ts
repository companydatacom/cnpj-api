/** Run: COMPANYDATA_API_KEY=... npx tsx examples/quickstart.ts */
import { CnpjClient } from "../src/index";

const client = new CnpjClient({ auth: { type: "apiKey", apiKey: process.env.COMPANYDATA_API_KEY! } });

const company = await client.getByCnpj("33000167000101");
console.log("By CNPJ:", company);

const page = await client.search({ cityName: "Sao Paulo", hasEmail: true, pageSize: 25 });
console.log("Search:", page.data);
