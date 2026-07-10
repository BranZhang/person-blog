import type { CollectionEntry } from "astro:content";
import { postFilter } from "./postFilter";
import { slugifyStr } from "./slugify";

type Tag = {
  tag: string;
  tagName: string;
  postCount: number;
};

/**
 * Builds a de-duplicated tag list with the number of posts for each tag.
 *
 * - Drafts and scheduled posts are excluded via `postFilter()`
 * - `tag` is the slug used in URLs; `tagName` is the original label for display
 * - Uniqueness is based on the slug (so differently-cased labels collapse)
 * - Tags are sorted by post count descending, then by slug for stable ties
 */
export function getUniqueTags(posts: CollectionEntry<"posts">[]) {
  const tags = new Map<string, Tag>();

  for (const post of posts.filter(postFilter)) {
    const postTags = new Map<string, string>(
      post.data.tags.map(tagName => [slugifyStr(tagName), tagName])
    );

    for (const [tag, tagName] of postTags) {
      const existingTag = tags.get(tag);
      if (existingTag) {
        existingTag.postCount += 1;
      } else {
        tags.set(tag, { tag, tagName, postCount: 1 });
      }
    }
  }

  return [...tags.values()].sort(
    (tagA, tagB) =>
      tagB.postCount - tagA.postCount || tagA.tag.localeCompare(tagB.tag)
  );
}
