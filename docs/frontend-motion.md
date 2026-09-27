# Frontend motion

`PresentationMotion` enhances server-rendered content with Framer Motion. Pages
and data fetching remain server-side; no routes or backend behavior change.

- Use `data-reveal` for a short upward entrance, or `data-reveal="image"` for a
  gentle scale reveal. Existing shared cards and About sections are also selected
  by the shared component.
- Entrances run once per element, with a capped stagger for elements entering
  together. Nested reveal targets are skipped to avoid double movement.
- Only opacity and transforms animate. Finished effects are cancelled so CSS
  hover transforms can take over. Existing CSS hover and map effects remain.
- Content is visible in server-rendered HTML, including when JavaScript is off.
- Reduced-motion preferences, keyboard focus, and printing cancel entrances.
  Streamed content and client navigation are detected by a MutationObserver.
- `AnimatedNumber` uses Framer Motion without per-frame React state updates and
  keeps a static accessible value for assistive technology.

Validation: production build, TypeScript, focused ESLint, and browser scroll
checks on `/` and `/about` at 390px and 1440px, including reduced motion.
