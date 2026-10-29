# Siteplane UI

The premium React UI kit for building with AI agents.

![The Siteplane UI showcase](https://ui.siteplane.io/opengraph-image.png)

Every component has its states and motion built in, and the included skill
shows your agent how to use them.

- **Finished to the detail.** Every state, light and dark, keyboard and screen
  reader support from Base UI and React Aria.
- **Motion built in.** Micro-interactions and transitions ship with the
  components. No animation code.
- **Your agent knows the system.** A skill teaches your coding agent which
  component fits and how to combine them.
- **Still yours.** Installs with the shadcn CLI. The code lives in your project,
  ready for your brand.

## Quick start

Siteplane UI needs React 19, TypeScript, Tailwind CSS 4 and an `@/*` alias for
`src/*`. Instead of running `shadcn init`, create `components.json` in your
application directory. This is the complete file for Next.js; for Vite, `rsc`
is `false` and `tailwind.css` is `src/index.css`.

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "src/app/globals.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "iconLibrary": "lucide",
  "aliases": {
    "components": "@/components",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks",
    "utils": "@/siteplane/system/utils/cn"
  },
  "registries": {
    "@siteplane": "https://ui.siteplane.io/registry/{name}.json"
  }
}
```

Add a component:

```sh
pnpm dlx shadcn@4.18.0 add @siteplane/button
```

Then make the kit stylesheet your global CSS. In a new Next.js application,
replace the contents of `src/app/globals.css` with these two lines:

```css
@import "../siteplane/system/styles/base.css";
@source "..";
```

In a new Vite application, `src/index.css` holds
`@import "./siteplane/system/styles/base.css";` and `@source ".";`. An
application with its own styles keeps them below the import.

Full setup for Next.js and Vite, every component and the agent skill:
https://ui.siteplane.io/docs/

## Siteplane UI Pro

Patterns, sections and templates for whole screens, built from the same
finished components: https://ui.siteplane.io/pricing

## License

The components are free under the Siteplane UI License ([LICENSE](LICENSE)).
Use them in any project, including client work. Selling them as part of a UI
kit or template is not permitted.
This repository mirrors release 1.7.0.

## Contributing

We fix bugs reported in issues. We don't accept pull requests right now.
