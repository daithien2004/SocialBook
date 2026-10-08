import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const backendDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const specUrl =
  process.env.OPENAPI_URL ?? 'http://localhost:5000/docs/openApi.json';
const response = await fetch(specUrl);

if (!response.ok) {
  throw new Error(`OpenAPI export failed: ${response.status} from ${specUrl}`);
}

const specification = await response.json();
const outputPath = path.join(backendDirectory, 'openapi.json');
await writeFile(
  outputPath,
  `${JSON.stringify(specification, null, 2)}\n`,
  'utf8',
);
process.stdout.write(`OpenAPI specification written to ${outputPath}.\n`);
