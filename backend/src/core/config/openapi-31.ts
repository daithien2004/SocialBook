const schemaAnnotations = new Set([
  'default',
  'description',
  'example',
  'title',
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizeNullableSchema(
  schema: Record<string, unknown>,
): Record<string, unknown> {
  const schemaProperties: Record<string, unknown> = {};
  const annotations: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(schema)) {
    if (key === 'nullable') continue;

    if (schemaAnnotations.has(key)) {
      annotations[key] = value;
      continue;
    }

    schemaProperties[key] = value;
  }

  return {
    ...annotations,
    anyOf: [schemaProperties, { type: 'null' }],
  };
}

function removeFalseNullable(
  schema: Record<string, unknown>,
): Record<string, unknown> {
  const normalized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(schema)) {
    if (key !== 'nullable') normalized[key] = value;
  }
  return normalized;
}

function normalizeNestedSchemas(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => normalizeNestedSchemas(item));
  }

  if (!isRecord(value)) return value;

  const normalized: Record<string, unknown> = {};
  for (const [key, nestedValue] of Object.entries(value)) {
    normalized[key] = normalizeNestedSchemas(nestedValue);
  }

  if (normalized.nullable === true) {
    return normalizeNullableSchema(normalized);
  }

  return normalized.nullable === false
    ? removeFalseNullable(normalized)
    : normalized;
}

export function normalizeOpenApi31(document: unknown): void {
  if (!isRecord(document)) {
    throw new Error('OpenAPI document must be an object');
  }

  const normalized = normalizeNestedSchemas(document);
  if (!isRecord(normalized)) {
    throw new Error('Normalized OpenAPI document must be an object');
  }

  Object.assign(document, normalized);
}
