# Mobile workspace UI

The phone layout borrows translucent navigation, rounded grouped surfaces and a floating tab bar from Apple's iOS Liquid Glass design. The existing Bitrix-inspired desktop shell, module boundaries, TanStack tables, dnd-kit task moves and Chart.js dashboards remain the product foundation.

- Home, Work, Inbox and Menu shortcuts use existing routes; Menu opens the full module sidebar with focus trapping and return to the initiating button.
- Mobile navigation applies at widths up to 760px and on coarse-pointer devices up to 1024px, so phone landscape retains the drawer. Larger desktop viewports retain the sidebar.
- `viewport-fit=cover` and safe-area insets protect the top bar, dock, sidebar and content in portrait/landscape. Reserved bottom space keeps final content reachable above the dock.
- Controls use at least 44px targets; mobile text fields use 16px text to avoid Safari's focus zoom. Browser zoom remains enabled.
- Task editing uses a bottom sheet bounded by the dynamic viewport, an independently scrolling body and a sticky heading. The sheet remains above the mobile dock.
- Tables/lists retain contained scrolling. Filters use two columns with a full-width search field. Charts retain their responsive canvas sizing.
- Glass surfaces reuse semantic tokens, opaque fallback, reduced-transparency and reduced-motion preferences. Blur is limited to navigation and overlays.

## Validation

- Local frontend typecheck, production build and all 190 unit/component tests passed.
- `tests/frontend/mobile-workspace.e2e.ts` covers 320/393/440px phone layouts, chart/document width, 44px dock targets, Inbox routing, sidebar focus return, landscape-to-desktop resizing, contained table overflow and saving an edited task in a short viewport.
- The existing Frontend Smoke workflow runs these browser checks alongside the existing desktop and data-scrolling regressions.

Browser device emulation verifies responsive behavior; it does not certify physical iPhone Safari, OS glass rendering or actual software-keyboard geometry.

Reference: [Apple iOS 26 design](https://www.apple.com/newsroom/2025/06/apple-elevates-the-iphone-experience-with-ios-26/).
