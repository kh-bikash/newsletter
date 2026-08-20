# Template specification

Use `assets/news-template.spec.json` as the canonical shape.

## Required sections

- `project`: slug, platform, template name, language, and canvas dimensions.
- `theme`: light-only colors and `dark_mode: false`.
- `brand`: name, tagline, handle, and optional logo path.
- `content`: category, headline, summary, CTA, image metadata, and template-specific data.
- `sources`: URLs supporting visible claims.
- `selection`: concise explanation of why this layout fits the story.

## Template-specific content

- `hero-card`: provide `content.image.src`; leave empty only for a draft placeholder.
- `bulletin-card`: no extra object is required.
- `stat-card`: provide `content.stat.value` and `content.stat.label`.
- `quote-card`: provide `content.quote.text` and `content.quote.attribution`.
- `timeline-card`: provide two to four `content.timeline` items, each with `label` and `detail`.
- `unrot-app-card`: provide a hero image plus `content.app_download.app_store_badge`, `google_play_badge`, `app_store_url`, and `google_play_url`. Use the official files and links in the bundled Unrot example.

## Paths and sources

Use a relative path, absolute path, HTTPS URL, or data URL for images. Prefer portable relative paths when the image ships with the output. Provide useful alt text and a real image credit. Use canonical HTTP(S) URLs for claim sources.

## Colors

Use six-digit hex values. The validator rejects dark canvas and surface colors. `theme.accent` may be dark because it is used in small regions and the CTA, but `theme.footer_text` must contrast with it.
