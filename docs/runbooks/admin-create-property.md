# Admin: Create Property + Upload Media (P4-02)

## One-liner

```bash
curl -X POST "https://api.example.com/v1/admin/properties" \
  -H "X-Admin-Key: <ADMIN_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Riverside Studio",
    "location": "Lisbon, Portugal",
    "description": "Cozy studio near the Tagus",
    "totalShares": 10000,
    "sharePriceUsd": 250000,
    "annualRentUsd": 1200000,
    "ownerWalletAddress": "UQ...",
    "meta": {
      "sizeSqm": 45,
      "yearBuilt": 2021,
      "propertyType": "apartment",
      "rentalStatus": "occupied"
    }
  }'
```

## Status field

| Value | Meaning |
|-------|---------|
| `draft` (default) | Not visible in marketplace |
| `funding` | Visible, primary sale open |
| `funded` | Primary sold out, resale only |

## Publish a draft

```bash
curl -X PATCH "https://api.example.com/v1/admin/properties/<id>" \
  -H "X-Admin-Key: <ADMIN_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"status": "funding"}'
```

## Upload media (signed URL pattern)

```bash
# 1. Get signed URL
curl -X POST "https://api.example.com/v1/admin/properties/<id>/media/sign" \
  -H "X-Admin-Key: <ADMIN_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"filename": "living-room.jpg", "contentType": "image/jpeg"}'

# Response: { "signedUrl": "...", "publicUrl": "...", "key": "uploads/..." }

# 2. Upload to R2
curl -X PUT "<signedUrl>" \
  -H "Content-Type: image/jpeg" \
  --data-binary @living-room.jpg

# 3. Register URL with property
curl -X PATCH "https://api.example.com/v1/admin/properties/<id>" \
  -H "X-Admin-Key: <ADMIN_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"images": ["<publicUrl>"]}'
```

## Env vars

| Variable | Required | Default |
|---|---|---|
| `R2_ACCOUNT_ID` | for media | — |
| `R2_ACCESS_KEY_ID` | for media | — |
| `R2_SECRET_ACCESS_KEY` | for media | — |
| `R2_BUCKET` | for media | — |
| `R2_PUBLIC_BASE_URL` | for media | — |

The media/sign endpoint returns 501 when R2 is not configured.

## Attributes

- Audit events: `admin.create`, `admin.update` (written to `audit_events` table)