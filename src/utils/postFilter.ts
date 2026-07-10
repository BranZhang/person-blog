import type { CollectionEntry } from "astro:content";
import config from "@/config";

/**
 * Determines whether a post is eligible to be listed/rendered.
 *
 * - Excludes drafts always
 * - Excludes posts hidden from the requested locale
 * - In production, excludes scheduled posts until `pubDatetime` minus the configured margin
 * - In dev, always shows non-draft posts to make authoring easier
 */
export function postFilter(
  { data }: CollectionEntry<"posts">,
  locale?: string
) {
  const isPublishTimePassed =
    Date.now() >
    new Date(data.pubDatetime).getTime() - config.posts.scheduledPostMargin;
  const isVisibleInLocale = !data.hiddenLocales.some(
    hiddenLocale => hiddenLocale === locale
  );

  return (
    !data.draft &&
    isVisibleInLocale &&
    (import.meta.env.DEV || isPublishTimePassed)
  );
}
