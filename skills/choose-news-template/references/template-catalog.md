# Template catalog

## Selection table

| Template | Choose when | Primary hierarchy | Avoid when |
|---|---|---|---|
| `hero-card` | A strong licensed image or product visual carries the story | Brand → hero → headline → summary → CTA | The image is generic, misleading, or unavailable |
| `bulletin-card` | The update is urgent and text is the evidence | Category → headline → summary → source/date → CTA | A useful visual would improve comprehension |
| `stat-card` | One verified metric is the main news | Category → large number → label → headline → context | Several numbers compete or the figure is uncertain |
| `quote-card` | One attributable quote is central | Category → quote → attribution → context → CTA | The quote is long, weak, or secondhand |
| `timeline-card` | Sequence explains the update | Headline → short context → 2–4 dated steps → CTA | The story is a single event |
| `unrot-app-card` | An Unrot news post should drive app downloads | Unrot logo → hero → headline → summary → App Store and Google Play footer | The post is not for Unrot or should not promote the app |

## Hero card default

Use `hero-card` unless another template is clearly better. At 1080 x 1350:

1. Header: x 64, y 56, height about 76.
2. Hero: x 64, y 164, width 952, height about 500, radius 28–32.
3. Headline: begins near y 730, 48–56 px, up to three lines.
4. Summary: 28–32 px, up to five lines.
5. Image credit: small muted line above the footer.
6. Footer CTA: x 64, near y 1204, width 952, height about 104.

This layout should feel editorial, not like an app screen. Keep the brand header compact and let the news dominate.

## Carousel use

Choose one visual system for the full carousel. Vary the content pattern only where needed:

- slide 1: hero or bulletin cover;
- middle slides: stat, quote, or timeline evidence;
- final slide: minimal takeaway and CTA.

Do not switch to a dark slide for contrast. Use whitespace, accent blocks, or a light tinted surface instead.

## Unrot app card

Use the official Unrot favicon-derived logo and official store badge images bundled in `assets/`. Keep the main canvas white. Use the purple accent footer only as a contained CTA region, with Unrot on the left and the two store badges on the right. Link the badges to the URLs in `content.app_download` when the output format supports links.

Do not redraw, recolor, distort, or regenerate the logo or store badges. If an asset is missing, stop with a clear asset error rather than substituting an invented mark.
