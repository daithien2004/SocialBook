import { existsSync, statSync } from 'node:fs';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import ts from 'typescript';
import { fileURLToPath } from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const sourceDirectory = path.resolve(scriptDirectory, '../src');
const errors = [];
const moduleDependencies = new Map();

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

function isPublicApiTail(tail) {
  return (
    tail === '' ||
    tail === 'index.ts' ||
    tail === 'public-api' ||
    tail === 'public-api.ts' ||
    tail.endsWith('/public-api') ||
    tail.endsWith('/public-api.ts')
  );
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

function resolveSourceFile(filePath, importPath) {
  if (!importPath.startsWith('@/') && !importPath.startsWith('.')) {
    return undefined;
  }

  const basePath = importPath.startsWith('@/')
    ? path.resolve(sourceDirectory, importPath.slice(2))
    : path.resolve(path.dirname(filePath), importPath);
  const candidates = [
    basePath,
    `${basePath}.ts`,
    `${basePath}.tsx`,
    path.join(basePath, 'index.ts'),
    path.join(basePath, 'index.tsx'),
  ];
  return candidates.find(
    (candidate) => existsSync(candidate) && statSync(candidate).isFile(),
  );
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
  const sourceRoot = relativePath.split(path.sep)[0];
  const importPaths = collectImportPaths(filePath, content);

  if (
    content.includes('@Global(') &&
    relativePath !== path.join('core', 'core.module.ts')
  ) {
    errors.push(`${relativePath}: @Global() is reserved for CoreModule`);
  }

  if (
    (sourceRoot === 'core' || sourceRoot === 'shared') &&
    /BullModule\s*\.\s*registerQueue\s*\(/u.test(content)
  ) {
    errors.push(`${relativePath}: queue registration belongs to a feature module`);
  }

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
  if (sourceRoot === 'core' || sourceRoot === 'shared') {
    for (const importPath of importPaths) {
      const importedModule =
        moduleNameFromImport(importPath) ?? resolveModuleImport(filePath, importPath);
      if (importedModule) {
        errors.push(
          `${relativePath}: ${sourceRoot} must not depend on feature ${importedModule.name}`,
        );
      }
    }
  }

  if (!sourceModule) continue;

  if (filePath.endsWith('.module.ts')) {
    moduleDependencies.set(filePath, new Set());
  }

  for (const importPath of importPaths) {
    const importedSourceFile = resolveSourceFile(filePath, importPath);
    if (
      sourceModule &&
      importedSourceFile &&
      path.relative(sourceDirectory, importedSourceFile).split(path.sep)[0] ===
        'seeds'
    ) {
      errors.push(
        `${relativePath}: feature modules must not depend on seeds (${importPath})`,
      );
    }

    const importedModule =
      moduleNameFromImport(importPath) ?? resolveModuleImport(filePath, importPath);
    if (
      importedModule &&
      importedModule.name !== sourceModule &&
      !isPublicApiTail(importedModule.tail)
    ) {
      errors.push(
        `${relativePath}: import ${importPath} through the ${importedModule.name} public API`,
      );
    }

    if (filePath.endsWith('.module.ts')) {
      const importedFile = resolveSourceFile(filePath, importPath);
      if (importedFile?.endsWith('.module.ts')) {
        moduleDependencies.get(filePath).add(importedFile);
      }
    }

    if (importedModule?.name === sourceModule) {
      const sourceLayer = relativePath.split(path.sep)[1];
      const importedLayer = importedModule.tail.split('/')[0];
      const forbiddenLayers =
        sourceLayer === 'domain'
          ? new Set(['application', 'infrastructure', 'presentation'])
          : sourceLayer === 'application'
            ? new Set(['infrastructure', 'presentation'])
            : sourceLayer === 'infrastructure'
              ? new Set(['presentation'])
              : new Set();

      if (forbiddenLayers.has(importedLayer)) {
        errors.push(
          `${relativePath}: ${sourceLayer} must not depend on ${importedLayer} (${importPath})`,
        );
      }
    }
  }
}

const visitedModules = new Set();
const activeModules = [];
const reportedCycles = new Set();

function visitModule(modulePath) {
  if (visitedModules.has(modulePath)) return;

  activeModules.push(modulePath);
  for (const dependency of moduleDependencies.get(modulePath) ?? []) {
    const cycleStart = activeModules.indexOf(dependency);
    if (cycleStart >= 0) {
      const cycle = [...activeModules.slice(cycleStart), dependency];
      const cycleFeatures = new Set(
        cycle
          .map((entry) => moduleNameFromPath(entry))
          .filter((name) => name !== undefined),
      );
      if (cycleFeatures.size > 1) {
        const cycleKey = [...new Set(cycle)].sort().join('|');
        if (!reportedCycles.has(cycleKey)) {
          errors.push(
            `Circular feature module dependency: ${cycle
              .map((entry) => path.relative(sourceDirectory, entry))
              .join(' -> ')}`,
          );
          reportedCycles.add(cycleKey);
        }
      }
      continue;
    }

    visitModule(dependency);
  }
  activeModules.pop();
  visitedModules.add(modulePath);
}

for (const modulePath of moduleDependencies.keys()) {
  visitModule(modulePath);
}

if (errors.length > 0) {
  process.stderr.write(`${errors.join('\n')}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(`Module boundary check passed (${files.length} TypeScript files).\n`);
}
