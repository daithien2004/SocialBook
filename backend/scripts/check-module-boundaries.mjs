import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const sourceDirectory = path.resolve(scriptDirectory, '../src');
const errors = [];

async function collectTypeScriptFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(directory, entry.name);
      if (entry.isDirectory()) return collectTypeScriptFiles(entryPath);
      return entry.isFile() && entry.name.endsWith('.ts') ? [entryPath] : [];
    }),
  );
  return nested.flat();
}

function moduleNameFromPath(filePath) {
  const relativePath = path.relative(sourceDirectory, filePath).split(path.sep);
  return relativePath[0] === 'modules' ? relativePath[1] : undefined;
}

function moduleNameFromImport(importPath) {
  const match = importPath.match(/^@\/modules\/([^/]+)(?:\/(.*))?$/);
  return match ? { name: match[1], tail: match[2] ?? '' } : undefined;
}

const files = await collectTypeScriptFiles(sourceDirectory);

for (const filePath of files) {
  const content = await readFile(filePath, 'utf8');
  const relativePath = path.relative(sourceDirectory, filePath);
  const isDomainFile = relativePath.split(path.sep).includes('domain');

  if (isDomainFile && /from\s+['"](?:@nestjs\/|mongoose['"])/.test(content)) {
    errors.push(`${relativePath}: domain code must not import NestJS or Mongoose`);
  }

  const sourceModule = moduleNameFromPath(filePath);
  if (!sourceModule) continue;

  for (const match of content.matchAll(/from\s+['"]([^'"]+)['"]/g)) {
    const importedModule = moduleNameFromImport(match[1]);
    if (
      importedModule &&
      importedModule.name !== sourceModule &&
      importedModule.tail !== '' &&
      importedModule.tail !== 'public-api' &&
      !importedModule.tail.endsWith('/public-api')
    ) {
      errors.push(
        `${relativePath}: import ${match[1]} through the ${importedModule.name} public API`,
      );
    }
  }
}

if (errors.length > 0) {
  process.stderr.write(`${errors.join('\n')}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(`Module boundary check passed (${files.length} TypeScript files).\n`);
}
