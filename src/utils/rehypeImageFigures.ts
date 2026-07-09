import type { Root, Element } from "hast";
import { visit } from "unist-util-visit";

// Renders a captioned Markdown image as a semantic <figure>/<figcaption>.
//
// Posts converted from the old WordPress content express a captioned image as
// standard Markdown with a title: `![alt](/path "caption")`. Markdown alone has
// no caption element, so this plugin promotes any paragraph whose sole child is
// such a titled image into:
//
//   <figure class="blog-figure"><img …><figcaption>caption</figcaption></figure>
//
// This keeps prose posts as clean `.md` (no MDX component needed just for a
// caption). Inline images that sit alongside text are left untouched.

function isWhitespaceText(node: { type: string; value?: string }) {
  return node.type === "text" && !node.value?.trim();
}

export default function rehypeImageFigures() {
  return (tree: Root) => {
    visit(tree, "element", (node: Element) => {
      if (node.tagName !== "p") return;

      const children = node.children.filter(c => !isWhitespaceText(c));
      if (children.length !== 1) return;

      const img = children[0];
      if (img.type !== "element" || img.tagName !== "img") return;

      const title = img.properties?.title;
      if (typeof title !== "string" || !title.trim()) return;

      // Strip the title (now shown as caption) and rewrite the paragraph in place.
      delete img.properties.title;

      const caption: Element = {
        type: "element",
        tagName: "figcaption",
        properties: {},
        children: [{ type: "text", value: title }],
      };

      node.tagName = "figure";
      node.properties = { ...node.properties, className: ["blog-figure"] };
      node.children = [img, caption];
    });
  };
}
