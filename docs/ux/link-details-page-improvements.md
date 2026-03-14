# Link Details Page: UX and Feature Improvements

Context: This is the public-ish "link details" experience (hero preview + right-side card) shown after saving an asset.
Goal: Make the page more user-friendly, reduce friction for common actions, and add high-leverage functionality that supports curation and long-term usefulness.

## Highest Impact UX Wins (Low Risk)
- Add a sticky action bar near the title (primary actions should not be buried in the sidebar):
  - Open
  - Copy link
  - Share
  - Edit
  - Move
  - Refresh metadata
  - Archive snapshot
- Convert the right card into a real "Details" panel with tabs:
  - Details: domain, canonical URL, created/updated timestamps, category, tags
  - Notes
  - Highlights
  - History
- Reduce below-the-fold noise:
  - On a detail page, collapse the large footer into a compact footer (or defer it until the end of scroll) to keep content and actions primary.
- Improve scanability:
  - Show a short description under the title.
  - Show tag chips prominently (not hidden behind editing).
  - Surface "Last saved" and "Last metadata refresh" timestamps.
- Upgrade loading and empty states:
  - Skeleton for the hero preview and details panel.
  - Explicit states: Fetching preview, Preview unavailable (saved anyway), Blocked by site, Rate-limited.

## "Cutting-Edge" Features That Improve Utility
- Reader mode vs Preview mode toggle:
  - Reader mode renders a clean text experience when available.
  - Preview mode keeps the visual card/hero.
- AI Insights panel:
  - Summary, key takeaways, extracted topics/entities.
  - Suggested tags with 1-click "Apply tags".
- Highlights + annotations:
  - Select text -> create highlight.
  - Attach notes to highlights, keep them searchable.
- Archiving:
  - Store a snapshot (screenshot/PDF/HTML) so the asset remains useful if the source changes or blocks scraping.
  - Show archive status + timestamp.
- Related assets:
  - Similar links based on tags/domain and (later) embeddings.
  - Show a small carousel or "Related" list in the sidebar.
- Command palette + shortcuts:
  - Cmd/Ctrl+K for "Open, Copy, Tag, Move, Search" etc.
  - Keyboard shortcuts surfaced in UI tooltips.

## Premium Polish
- Clarify information hierarchy in the right panel:
  - Favicon + domain at top.
  - Actions cluster next.
  - Metadata blocks below.
  - Keep "Curated by" smaller/secondary.
- Add reading progress for long content + "Jump to top".
- Accessibility:
  - Strong focus states.
  - Full keyboard navigation for actions and tabs.
  - Validate contrast on hero overlay + small text.

## Implementation Notes (Suggested Phasing)
- Phase 1 (UX baseline): sticky actions, details tabs, skeletons, footer simplification.
- Phase 2 (Curation): notes, tags UX improvements, history panel, refresh metadata.
- Phase 3 (Durability): archiving + archive status UI.
- Phase 4 (Intelligence): AI insights, related items, command palette.

