# Open standards and interoperability: design-tokens

Framework-agnostic design tokens (CSS, TypeScript).

This page lists what the project speaks today, what is planned, what was considered and does not apply, where someone else can extend it, and what proves each claim. The platform-wide list is [Standards we use](https://meddleware.dev/platform/standards). A row appears there in the same change that turns a standard on.

## Spoken today

- CSS custom properties; the same tokens drive the Rust-rendered Link in Bio pages (vendored with a drift check)

## Planned

- The rights notice as data in one place, read by both the Vue components and the Link in Bio renderer (today each draws it from its own copy of the same words and marks)

## Considered, not applicable

- none

## Extension points

- Any renderer can read the CSS or the JSON

## What proves it

- its unit tests
- the Link in Bio drift check

_Maintained centrally with the platform's interoperability map; changes go through it so every repository says the same thing._
