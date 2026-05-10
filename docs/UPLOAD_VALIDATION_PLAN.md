# Upload validation plan (media & documents)

Status: planning artifact for Agent 6 security gates — implement when listing images and KYC/document uploads are wired to storage.

## Principles

- Never trust filenames or `Content-Type` from the client; inspect magic bytes where formats allow.
- Enforce max size per asset class (listing image vs identity document vs brochure PDF).
- Virus/malware scanning is recommended before promoting objects to a public CDN bucket (defer until production integration).

## Listing images (future `multipart` upload API)

- Allowed types: JPEG, PNG, WebP (extend deliberately).
- Max size: e.g. 12 MB per file; max dimensions optional server-side resize.
- Store in private bucket first; publish only after listing approval if policy requires it.

## KYC / compliance documents

- PDF and images only; max size per org policy (e.g. 10 MB).
- Access restricted to owning user + admin reviewers; signed URLs with short TTL.

## Webhooks (WhatsApp media URLs)

- Treat incoming URLs as untrusted: fetch server-side with timeouts, size caps, and content-type verification before persistence or forwarding to AI.

## API surface

- Central validation helper shared by API routes and workers.
- Return `VALIDATION_ERROR` with stable `details` codes for clients (`FILE_TOO_LARGE`, `UNSUPPORTED_TYPE`).
