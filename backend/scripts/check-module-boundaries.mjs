import { existsSync, statSync } from 'node:fs';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import ts from 'typescript';
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

function resolveModuleImport(filePath, importPath) {
  if (!importPath.startsWith('@/modules/') && !importPath.startsWith('.')) {
    return undefined;
  }

  const basePath = importPath.startsWith('@/modules/')
    ? path.resolve(sourceDirectory, importPath.slice(2))
    : path.resolve(path.dirname(filePath), importPath);
  const candidates = [
    basePath,
    `${basePath}.ts`,
    `${basePath}.tsx`,
    path.join(basePath, 'index.ts'),
    path.join(basePath, 'index.tsx'),
  ];
  const resolvedPath = candidates.find(
    (candidate) => existsSync(candidate) && statSync(candidate).isFile(),
  );
  if (!resolvedPath) return undefined;

  const moduleName = moduleNameFromPath(resolvedPath);
  if (!moduleName) return undefined;

  return {
    name: moduleName,
    tail: path
      .relative(path.join(sourceDirectory, 'modules', moduleName), resolvedPath)
      .split(path.sep)
      .join('/'),
  };
}

function collectImportPaths(filePath, content) {
  const sourceFile = ts.createSourceFile(
    filePath,
    content,
    ts.ScriptTarget.Latest,
    true,
  );
  const importPaths = [];

  function visit(node) {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      importPaths.push(node.moduleSpecifier.text);
    }

    if (
      ts.isCallExpression(node) &&
      (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
        (ts.isIdentifier(node.expression) && node.expression.text === 'require')) &&
      node.arguments[0] &&
      ts.isStringLiteral(node.arguments[0])
    ) {
      importPaths.push(node.arguments[0].text);
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return importPaths;
}

const files = await collectTypeScriptFiles(sourceDirectory);

for (const filePath of files) {
  const content = await readFile(filePath, 'utf8');
  const relativePath = path.relative(sourceDirectory, filePath);
  const isDomainFile = relativePath.split(path.sep).includes('domain');
  const importPaths = collectImportPaths(filePath, content);

  if (
    isDomainFile &&
    importPaths.some(
      (importPath) =>
        importPath.startsWith('@nestjs/') ||
        importPath === 'mongoose' ||
        importPath.startsWith('mongoose/'),
    )
  ) {
    errors.push(`${relativePath}: domain code must not import NestJS or Mongoose`);
  }

  const sourceModule = moduleNameFromPath(filePath);
  if (!sourceModule) continue;

  for (const importPath of importPaths) {
    const importedModule =
      moduleNameFromImport(importPath) ?? resolveModuleImport(filePath, importPath);
    if (
      importedModule &&
      importedModule.name !== sourceModule &&
      importedModule.tail !== '' &&
      importedModule.tail !== 'public-api' &&
      !importedModule.tail.endsWith('/public-api') &&
      importedModule.tail !== 'index.ts' &&
      importedModule.tail !== 'index.tsx' &&
      importedModule.tail !== 'public-api.ts' &&
      importedModule.tail !== 'public-api.tsx' &&
      !importedModule.tail.endsWith('/public-api.ts') &&
      !importedModule.tail.endsWith('/public-api.tsx')
    ) {
      errors.push(
        `${relativePath}: import ${importPath} through the ${importedModule.name} public API`,
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
