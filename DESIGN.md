# Portfolio Design Philosophy

This document is the visual and editorial source of truth for the portfolio. Read it before changing the site.

## 1. Purpose

The site is a compact index of public work and verifiable records. It is not a personal-brand landing page, a cover letter, or a generic developer template.

## 2. Editorial rules

- English only.
- Facts over claims. Prefer a repository, method, result, date, institution, or tool over an adjective.
- Do not add slogans, mission statements, availability notices, testimonials, self-ratings, or personality copy.
- Do not name a target employer or advertise a specific target role.
- Keep the full resume, phone number, availability date, and other private application details off the public site.
- Project descriptions may explain the problem, method, system boundary, and validation. Other sections should remain factual and compact.

## 3. Visual system

- Base palette: Ink `#121310`, Paper `#f0eee6`, Paper Dark `#e5e3da`.
- Accent palette: Lime `#d9ff53`, Blue `#3157ff`, Coral `#ff6b51`, Violet `#ab7cff`.
- Typography: Archivo Black for display, Space Grotesk for body, IBM Plex Mono for labels and coordinates.
- Use hard color fields, thin black rules, large type, and generous empty space.
- Use geometry rather than portraits, stock imagery, illustrations, logos, or decorative screenshots.
- Avoid glassmorphism, soft gradients, drop-shadow stacks, skill bars, logo clouds, and generic card templates.

## 4. Geometry and motion

- Every geometric object must map to a system concept: scan, validation, evidence grid, distribution, or route.
- Motion should expose structure, not decorate it. Prefer rotation, permutation, translation, and scale.
- Continuous motion must be slow. Hover motion may be faster but must remain legible.
- All animation must stop under `prefers-reduced-motion`.
- Geometry is built in CSS and HTML. Do not replace it with generated raster art or inline SVG.

## 5. Layout

- The first viewport contains the name, location, repository count, and kinetic geometry. No biography or slogan.
- Repositories are the primary content and use asymmetric colored blocks.
- Education, experience, and tools appear as a restrained factual index after the repositories.
- Contact information is limited to public email and GitHub.
- Mobile layouts collapse to one column without removing content or interaction affordances.

## 6. Change checklist

Before merging a design change, verify:

1. Is every new sentence factual and necessary?
2. Does every visual element use the established palette and typography?
3. Does any new motion explain a project concept?
4. Is the repository index still the visual center of the site?
5. Are keyboard focus, mobile layout, and reduced motion preserved?
6. Has any private resume information been exposed?
