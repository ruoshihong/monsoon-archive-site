# Living with Rain

First interactive version of a Guangdong rainy-season digital humanities archive.

## Source layout

- `dist/index.html`: shared shell and homepage.
- `dist/app.js`: page navigation, story reading, filters, city selection and flip cards.
- `dist/style.css` and `dist/pages.css`: blue visual system and responsive layouts.
- `dist/assets/voices.json`: 45 edited stories from the user's Rain Voices content sheet.
- `dist/assets/cards.json`: 21 city cards and factual references.
- `dist/assets/map.json`: projected city boundaries, derived from Alibaba DataV Guangdong administrative GeoJSON.
- `dist/assets/city-*.webp`: optimized copies of user-selected photographs. Original images are preserved.
- `.openai/hosting.json`: Site identity and static publication configuration. Reuse this identity for all future updates.

This Site is static and requires no build or package installation. Serve `dist` locally for preview. Publish through the Sites skill to retain the same public address and source version history.

Routes use URL fragments: `#/`, `#/map`, `#/voices`, `#/stories`, `#/objects`, and `#/reflection`.

## Content status

Rain Voices and Rain Map are implemented from prepared project materials. Rain Stories, Rain Objects and the author's personal reflection intentionally contain labeled content/image spaces as requested. See the parent workspace's Monsoon Project Note for content provenance, remaining source checks and future decisions.

The website is manually updated. Changes in the source Google Sheet are incorporated during a subsequent editing and publishing pass; the public website does not access the private sheet at runtime. Visitors can read the website; editing and publishing remain with the owner and this project workflow.
