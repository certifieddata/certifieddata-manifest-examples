# certifieddata-manifest-examples

Example **manifests** for CertifiedData's structured-intake certification mode. A manifest lets you certify a batch of artifacts, datasets, or pipeline outputs in a single signed submission — ideal for CI/CD, data pipelines, and publishing workflows.

> Manifest submission is a *mode* of the Dataset Generation pillar. Certification itself is the shared cryptographic layer across all three CertifiedData pillars. Every manifest-issued certificate is Ed25519-signed by the same root key used for Decision Ledger records and Agent Commerce receipts.

## What's here

```
.
├── schema/
│   └── manifest.schema.json     # JSON Schema (Draft 2020-12) for a manifest
├── examples/
│   ├── single-dataset.json      # One artifact, one certificate
│   ├── batch-artifacts.json     # Several artifacts certified in one submission
│   └── pipeline-output.json     # Model + dataset + output bundle with lineage
├── scripts/
│   ├── validate.mjs             # Validate a manifest against the schema
│   └── submit.sh                # cURL the public manifest endpoint
└── .github/workflows/
    └── certify-on-push.yml      # CI: certify artifacts on every push to main
```

## Quickstart

```bash
# 1. Validate a manifest locally
node scripts/validate.mjs examples/single-dataset.json

# 2. Submit it
./scripts/submit.sh examples/single-dataset.json
```

## Manifest shape

A manifest is a JSON document containing:

* `manifest_version` — schema version you're targeting
* `issued_at` — ISO 8601 timestamp you generated the manifest
* `artifacts[]` — one or more artifact records, each with:
  * `artifact_type` — `dataset`, `output`, `published-page`, `bundle`, or `custom`
  * `content_hash` — SHA-256 hex of the artifact bytes (pre-computed client-side)
  * `source_references[]` — input documents, model IDs, prompts, retrieval sources
  * `generation_metadata` — algorithm, model version, parameters
  * `lineage` — parent certificate IDs or upstream artifact references
  * `policy_context` — optional Agent Commerce policy ID
  * `issuance_notes` — free-form metadata

See [`schema/manifest.schema.json`](./schema/manifest.schema.json) for the authoritative contract.

## Submitting

```bash
curl -X POST https://certifieddata.io/api/manifest/certify \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $CERTIFIEDDATA_API_KEY" \
  --data-binary @examples/single-dataset.json
```

Response is a signed certificate bundle — one certificate per artifact in the manifest, each verifiable at `certifieddata.io/verify`.

## CI: certify on every push

[`.github/workflows/certify-on-push.yml`](./.github/workflows/certify-on-push.yml) shows a workflow that:

1. Computes SHA-256 hashes of your release artifacts
2. Builds a manifest referencing each hash
3. Submits the manifest to CertifiedData
4. Attaches the returned certificates to the GitHub release

Drop it into any repo that ships versioned artifacts and get automatic, verifiable provenance on every release.

## License

MIT — see [LICENSE](./LICENSE).
