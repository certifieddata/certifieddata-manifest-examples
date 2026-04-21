#!/usr/bin/env node
/**
 * Validates a manifest against schema/manifest.schema.json (or all files in examples/).
 *
 * Usage:
 *   node scripts/validate.mjs                        # validate every file in examples/
 *   node scripts/validate.mjs examples/single.json   # validate a single file
 *
 * Zero-dependency in-tree validator covering the keys the CertifiedData ingest
 * service cares about. For full Draft 2020-12 coverage, swap in Ajv.
 */
import fs from "node:fs";
import path from "node:path";

const SCHEMA_PATH = path.resolve("schema/manifest.schema.json");
const schema = JSON.parse(fs.readFileSync(SCHEMA_PATH, "utf8"));

const target = process.argv[2] ?? "examples";
function listFiles(root) {
  const stat = fs.statSync(root);
  if (stat.isFile()) return [root];
  return fs
    .readdirSync(root, { withFileTypes: true })
    .filter((e) => e.isFile() && e.name.endsWith(".json"))
    .map((e) => path.join(root, e.name));
}

function hasAllRequired(obj, req) {
  return req.every((k) => k in obj);
}

function validate(doc) {
  const errors = [];
  if (!hasAllRequired(doc, schema.required)) {
    errors.push(`missing top-level required keys: ${schema.required.filter((k) => !(k in doc)).join(", ")}`);
  }
  if (doc.manifest_version && !schema.properties.manifest_version.enum.includes(doc.manifest_version)) {
    errors.push(`manifest_version "${doc.manifest_version}" not in allowed enum`);
  }
  if (doc.issued_at && isNaN(Date.parse(doc.issued_at))) {
    errors.push(`issued_at "${doc.issued_at}" is not a valid ISO 8601 timestamp`);
  }
  const artifactSchema = schema.$defs.artifact;
  (doc.artifacts ?? []).forEach((a, i) => {
    if (!hasAllRequired(a, artifactSchema.required)) {
      errors.push(`artifacts[${i}]: missing required keys: ${artifactSchema.required.filter((k) => !(k in a)).join(", ")}`);
    }
    if (a.artifact_type && !artifactSchema.properties.artifact_type.enum.includes(a.artifact_type)) {
      errors.push(`artifacts[${i}]: artifact_type "${a.artifact_type}" not in allowed enum`);
    }
    if (a.content_hash && !/^sha256:[0-9a-f]{64}$/.test(a.content_hash)) {
      errors.push(`artifacts[${i}]: content_hash must match sha256:<64 hex>`);
    }
  });
  return errors;
}

const files = listFiles(target);
let failed = 0;
for (const f of files) {
  const doc = JSON.parse(fs.readFileSync(f, "utf8"));
  const errors = validate(doc);
  if (errors.length === 0) {
    console.log(`✅ ${f}`);
  } else {
    failed++;
    console.log(`❌ ${f}`);
    for (const e of errors) console.log(`   - ${e}`);
  }
}
if (failed > 0) {
  console.error(`\n${failed} manifest(s) failed validation.`);
  process.exit(1);
}
console.log(`\n${files.length} manifest(s) valid.`);
