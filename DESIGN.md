# Portfolio Design Philosophy

This document is the visual and editorial source of truth for the portfolio. Read it before changing the site.

## 1. Purpose

The site is a compact, multi-page index of education, experience, public work, and verifiable records. It is not a personal-brand landing page, a cover letter, or a generic developer template.

## 2. Editorial rules

- English only.
- Facts over claims. Prefer a repository, method, result, date, institution, or tool over an adjective.
- Do not add slogans, mission statements, availability notices, testimonials, self-ratings, or personality copy.
- Do not name a target employer or advertise a specific target role.
- Keep the full resume, phone number, availability date, and other private application details off the public site.
- Never add a date of birth, derived age, or age-calculation logic to source, rendered output, metadata, or build artifacts.
- Project and experience case studies may explain the problem, method, system boundary, and validation. Other sections should remain factual and compact.
- A private work case study may show a public-safe reconstruction of architecture and engineering decisions, but never employer code, screenshots, datasets, prompts, customer material, thresholds, or internal names.
- Quantitative results must state their experimental or role-period boundary. A specification, development diagnostic, and locked result are different evidence classes.

## 3. Visual system

- Base palette: Ink `#121310`, Paper `#f0eee6`, Paper Dark `#e5e3da`.
- Accent palette: Lime `#d9ff53`, Blue `#3157ff`, Coral `#ff6b51`, Violet `#ab7cff`.
- Typography: Archivo Black for display, Space Grotesk for body, IBM Plex Mono for labels and coordinates.
- Use hard color fields, thin black rules, large type, and generous empty space.
- Use geometry rather than portraits, stock imagery, illustrations, or decorative screenshots.
- Official employer wordmarks are the only logo exception. Store source-provenance assets locally, preserve their proportions, render them as a monochrome part of the corresponding work-card lockup, and never hotlink or recreate them with a model. Current approved sources are the official [HD Hyundai CI page](https://www.hd.com/en/brand-story/typeface/contents) and [Avikus site](https://www.avikus.ai/).
- Avoid glassmorphism, soft gradients, drop-shadow stacks, skill bars, logo clouds, and generic card templates.
- Declare the site as light-only with the exact `only light` metadata opt-out and CSS property, plus the legacy supported-scheme hint. Device and browser force-dark modes must not recolor the interface; intentional Ink and Blue color fields remain part of the light design.

## 4. Geometry and motion

- Every geometric object must map to a system concept: scan, validation, evidence grid, distribution, route, signal path, agent graph, or payoff surface.
- Motion should expose structure, not decorate it. Prefer rotation, permutation, translation, and scale.
- Continuous motion must be slow. Hover motion may be faster but must remain legible.
- All animation must stop under `prefers-reduced-motion`.
- Geometry is built in CSS and HTML. Do not replace it with generated raster art or inline SVG.
- Employer wordmarks may accompany work-card geometry; they never replace the system diagram or become a general logo cloud.

## 5. Layout

- The first section combines identity, public contact, and education with kinetic geometry. No biography or slogan.
- Education shows institutions, degrees, month-level attendance dates, location, and selected coursework only. Do not add scholarships or awards.
- Two experience cards follow education and link to public-safe case studies.
- Research projects remain the largest content index and use asymmetric colored blocks.
- Home cards always open an internal case study. A public GitHub link appears only on that case-study page.
- Each case study follows `system map → model and decisions → technology stack → validation and evidence boundary`; use KaTeX for mathematical notation and HTML/CSS for diagrams.
- Case-study content should remain approximately one to two A4 pages when printed, prioritizing diagrams and equations over prose.
- Technology is summarized on each detail page. Compact technology tags remain on home cards, but there is no separate home-page tool index.
- Contact information is limited to public email and GitHub.
- Mobile layouts use the `900px`, `640px`, and `420px` breakpoints, collapse to one column, and recompose every diagram without removing content or interaction affordances.
- At 320px and above, no text, logo, formula, card, or diagram may widen the document viewport. Formula overflow stays inside its own scroll region.
- Keep `Moonyoung` on one line on mobile by reducing its type size, and keep the two work cards on equal-width `minmax(0, 1fr)` tracks.

## 6. Change checklist

Before merging a design change, verify:

1. Is every new sentence factual and necessary?
2. Does every visual element use the established palette and typography?
3. Does any new motion explain a project concept?
4. Do identity and education come first, followed by two experience cards and the project index?
5. Are keyboard focus, mobile layout, and reduced motion preserved?
6. Has any private resume information been exposed?
7. Does every external source link live on the corresponding detail page?
8. Are employer logos official, locally stored, decorative to assistive technology, and limited to work cards?
9. Are dates of birth, ages, and age-derived metadata absent from the public site and repository?
10. Does education omit scholarships and retain month-level dates and legible supporting text?
11. Does the page remain light-only and free of horizontal overflow at 320px in both device theme settings?
