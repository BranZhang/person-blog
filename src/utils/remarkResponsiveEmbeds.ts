import type { Root, Html } from "mdast";
import { visit } from "unist-util-visit";

// Unified handling for third-party <iframe> embeds carried over from the old
// WordPress content (CodePen, Shadertoy, CodeSandbox, XMind, Lucidchart, …).
//
// The post bodies are raw HTML passed through verbatim, so each embed lives in
// its own mdast `html` node rather than a parsed element. This plugin wraps any
// such node in a `.blog-embed` container so a single set of styles (see
// typography.css, `.blog-embed iframe`) makes every provider responsive, and
// upgrades protocol-relative `//host/…` srcs to `https:`.
//
// Kept at the remark (string) layer to avoid pulling rehype-raw in to reparse
// every post's entire raw-HTML body.

const WRAPPER_OPEN = '<div class="blog-embed">';

export default function remarkResponsiveEmbeds() {
  return (tree: Root) => {
    visit(tree, "html", (node: Html) => {
      if (!/<iframe[\s>]/i.test(node.value)) return;

      // Upgrade protocol-relative srcs (e.g. //codepen.io/…) to https.
      let value = node.value.replace(/(src=["'])\/\//gi, "$1https://");

      if (!value.includes(WRAPPER_OPEN)) {
        value = `${WRAPPER_OPEN}${value}</div>`;
      }

      node.value = value;
    });
  };
}
