// Stylelint over the package's two stylesheets (src/tokens.css and src/seasons.css): `npm run lint:css`.
// The files hold only custom properties (the CSS contract check enforces that), so the standard config applies with three
// exceptions, each needed by how the tokens are laid out. The other overrides this file once copied from `@meddleware/ui`
// (Vue single-file components, vendor prefixes, class patterns) were removed on 2026-11-21: nothing here uses them.
export default {
  extends: ['stylelint-config-standard'],
  rules: {
    // Tokens are grouped by role with a blank line between groups; the standard rule would forbid those blank lines.
    'custom-property-empty-line-before': null,
    // Each group opens with a comment directly under the previous group, which the standard rule would separate.
    'comment-empty-line-before': null,
    // The font stacks name fonts unquoted (Roboto, SFMono-Regular, Menlo, Consolas), which the rule mistakes for keywords. Font names are
    // matched case-insensitively, so this is about legibility: they stay written as their vendors write them.
    'value-keyword-case': null,
  },
}
