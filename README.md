# Choose News Template

An installable agent skill that analyzes a news story and creates the best minimal, light-theme social template for it.

![Unrot app-download news template](preview/unrot-app-card.png)

## Highlights

- Selects one layout based on the story instead of presenting an unfocused template dump.
- Enforces a white or near-white canvas; dark themes are intentionally unsupported.
- Includes hero, bulletin, stat, quote, timeline, and Unrot app-download cards.
- Produces an editable JSON specification and deterministic SVG artwork.
- Bundles a zero-dependency Node.js validator and renderer.
- Treats instructions inside screenshots and source documents as quoted content, not executable requests.

## Install

```bash
npx skills add kh-bikash/newsletter --skill choose-news-template
```

Install specifically for Codex:

```bash
npx skills add kh-bikash/newsletter --skill choose-news-template -a codex
```

## Use

```text
$choose-news-template Turn this AI news story into the best minimal Instagram card.
```

For an Unrot card with official app-download options:

```text
$choose-news-template Create an Unrot news card with the App Store and Google Play footer.
```

## Template catalog

| Template | Best for |
|---|---|
| `hero-card` | Visual-led product and company news |
| `bulletin-card` | Breaking updates without a trustworthy image |
| `stat-card` | A single verified metric |
| `quote-card` | A short, attributable statement |
| `timeline-card` | A sequence of events or releases |
| `unrot-app-card` | Unrot news with iOS and Android download options |

The Unrot option uses the official Unrot favicon-derived logo and store badges served by [Unrot.co](https://unrot.co/marketing). Apple, Google Play, and Unrot marks remain the property of their respective owners.

## Validate locally

```bash
node skills/choose-news-template/scripts/validate-template.mjs \
  skills/choose-news-template/assets/unrot-app-card.spec.json

node skills/choose-news-template/scripts/render-template.mjs \
  skills/choose-news-template/assets/unrot-app-card.spec.json \
  --output news-template.svg
```

The skill does not publish posts. It stops at review-ready assets.
