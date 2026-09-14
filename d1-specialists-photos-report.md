# D1 Specialists Photos — Localization Report

Date: 2026-09-13
Source JSON: `d1-rental-escapes-specialists.json`
Source CDN: `cdn.rentalescapes.com` (verified `image/jpeg` for all 12)

## Result
- Downloaded successfully: **12 / 12**
- Failures: **0**
- Retries needed: 0 (bare `-1920w` URLs worked first try; `.jpg/.webp/.png` fallbacks not needed)
- Format: all files verified real JPEG (magic `FF D8 FF E0`), no HTML error pages, no conversion needed
- Naming: lowercase kebab-case, stable `D1-NN-full-name.jpg`

## Final local files (`public/operators/specialists/`)
| File | Size |
|---|---|
| D1-01-amanda-singer.jpg | 158331 bytes |
| D1-02-keith-diebel.jpg | 93289 bytes |
| D1-03-kristy-taylor.jpg | 115187 bytes |
| D1-04-levi-hoffman.jpg | 90500 bytes |
| D1-05-randee-zeitz.jpg | 93710 bytes |
| D1-06-tania-lee.jpg | 103284 bytes |
| D1-07-deane-saunders.jpg | 78796 bytes |
| D1-08-steph-paperman.jpg | 81953 bytes |
| D1-09-alex-steinberg.jpg | 118978 bytes |
| D1-10-ali-ellis.jpg | 98751 bytes |
| D1-11-andrea-ducharme.jpg | 156109 bytes |
| D1-12-ann-brace.jpg | 105615 bytes |

Public paths (as stored in JSON `photoUrl`):
- `/operators/specialists/D1-01-amanda-singer.jpg`
- `/operators/specialists/D1-02-keith-diebel.jpg`
- `/operators/specialists/D1-03-kristy-taylor.jpg`
- `/operators/specialists/D1-04-levi-hoffman.jpg`
- `/operators/specialists/D1-05-randee-zeitz.jpg`
- `/operators/specialists/D1-06-tania-lee.jpg`
- `/operators/specialists/D1-07-deane-saunders.jpg`
- `/operators/specialists/D1-08-steph-paperman.jpg`
- `/operators/specialists/D1-09-alex-steinberg.jpg`
- `/operators/specialists/D1-10-ali-ellis.jpg`
- `/operators/specialists/D1-11-andrea-ducharme.jpg`
- `/operators/specialists/D1-12-ann-brace.jpg`

## JSON confirmation
- `photosLocalized: true`, `photosPath: /operators/specialists/`
- `cdn.rentalescapes.com` occurrences in final JSON: **0** (verified)
- Local-path `photoUrl` count: **12 / 12**
- Untouched fields: `id, fullName, title, bio, assignTo` (only `notes` appended with localization stamp)

## Notes
- No photos invented; all bytes from official CDN URLs in original JSON.
- Files are production-ready JPEGs servable from `/operators/specialists/`.
- Nothing committed (per instructions).
