# Moonyoung Choi — Portfolio

Personal portfolio for Moonyoung Choi, a research engineer working across statistical learning, financial data systems, and reproducible research.

**Live site:** [moon-young-choi.github.io](https://moon-young-choi.github.io/)

## Local development

```bash
npm install
npm run dev
```

Built with Next.js, React, TypeScript, and CSS. The static production build is published with GitHub Pages.

## Triangular-arbitrage evidence

The project page reads a committed, synthetic replay artifact and never contacts an exchange during the build. Refresh it from a local engine checkout with:

```bash
npm run sync:arbitrage -- --source ../triangular-arbitrage-detector/artifacts/showcase.v1.json
```

Remote sync uses two independent pins: `--commit` identifies the commit that contains the public artifact, while `--engine-commit` must match the fingerprint-protected engine commit inside that artifact. The source URL must use this exact form:

```bash
npm run sync:arbitrage -- \
  --source https://raw.githubusercontent.com/Moon-Young-Choi/triangular-arbitrage-detector/<artifact-commit>/artifacts/showcase.v1.json \
  --commit <artifact-commit> \
  --engine-commit <engine-commit>
```

The sync rejects unknown schema fields, validates every scenario combination and safety boundary, detects normalized credential or account keys, and authenticates the engine provenance with the stable-key SHA-256 fingerprint before replacing the local copy.
