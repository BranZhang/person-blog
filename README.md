# Bran Zhang Personal Blog

This repository contains a personal blog built with [AstroPaper](https://github.com/satnaing/astro-paper). It is set up to migrate existing WordPress posts into Astro content files so the WordPress instance can be shut down later.

## Setup

```bash
pnpm install
pnpm run dev
```

The default production URL is `https://branzhang.github.io/person-blog/`. If you deploy with a custom domain, set `SITE_URL` and `SITE_BASE=/`.

## WordPress Import

The importer reads WordPress REST API posts, writes Markdown files to `src/content/posts`, and optionally downloads media under `public/wp-content/uploads`.

Create a local `.env` from `.env.example`, then run:

```bash
pnpm run import:wp
```

Required:

- `WP_BASE_URL`: the public WordPress site URL, for example `https://blog.example.com/`

Optional:

- `WP_USERNAME` and `WP_APP_PASSWORD`: WordPress application password credentials for private or protected content
- `WP_STATUS`: defaults to `publish`
- `WP_IMPORT_PAGES`: set to `true` to import WordPress pages into `src/content/pages/imported`
- `WP_DOWNLOAD_MEDIA`: defaults to `true`; set to `false` to keep original media URLs
- `WP_MEDIA_DIR`: local media output path, defaults to `public/wp-content/uploads`
- `WP_MEDIA_PUBLIC_BASE`: public URL prefix, defaults to `/wp-content/uploads`

For a complete migration before shutting down WordPress, verify:

- post count, titles, dates, slugs, tags, and categories
- images and downloadable files previously hosted under `wp-content/uploads`
- internal links that still point at the old WordPress domain
- redirects from old WordPress URLs to the new Astro routes

## Deployment

GitHub Pages project hosting should use:

```bash
SITE_URL=https://branzhang.github.io/person-blog/
SITE_BASE=/person-blog
```

Custom domain hosting should use:

```bash
SITE_URL=https://your-domain.example/
SITE_BASE=/
```
