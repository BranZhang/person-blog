# 相对 AstroPaper 的定制记录

本仓库基于 **vanilla AstroPaper v6.1.0**（<https://github.com/satnaing/astro-paper>）。

- 原始 AstroPaper 基线 commit：`30fa8ef`（"Reset to vanilla AstroPaper 6.1.0 as migration baseline"）
- 迁移前的旧自定义模板（含所有原始博客内容/封面）保存在 commit：`fbd300d`

本文件记录**所有偏离原版 AstroPaper 的改动**，方便日后 AstroPaper 官方更新时对照重放。

## 升级 AstroPaper 的流程

1. 查看 AstroPaper 的 CHANGELOG 与 `30fa8ef` 之后的 upstream 差异。
2. 对照下面"已应用的定制"逐项检查是否受影响（尤其标 ⚠️ 的项）。
3. 把 upstream 变更合并进来，重新应用受影响的定制。

---

## 已应用的定制

### 1. 内容 `src/content/posts/`
- 50 篇文章从原 WordPress 站点（littlepotato.me）迁移而来。
- frontmatter 从旧 schema 映射到 AstroPaper schema：

  | 旧字段 | AstroPaper 字段 | 说明 |
  |---|---|---|
  | `pubDate: "…"` | `pubDatetime: …` | 去引号（`z.date()` 需要） |
  | `updatedDate: "…"` | `modDatetime: …` | 去引号 |
  | `published: true/false` | `draft: false/true` | 取反 |
  | `heroImage` | （暂移除，见待办） | 原为封面/OG 图 |
  | `title` / `description` / `tags` | 同名保留 | |

- ⚠️ **正文是 WordPress 导出的原始 HTML**（带 `wp-block-*` class），不是标准 markdown。AstroPaper 的 prose/typography 针对 markdown，个别块可能需要补兼容 CSS。
- about 页在 `src/content/pages/about.md`。

### 2. 站点配置 `astro-paper.config.ts`
- `site`：url、title、author、profile、socials 改为本站信息。
- `features.editPost.enabled = false`（部署在 Cloudflare，不走 GitHub 编辑链接）。
- `features.dynamicOgImage = false`（见第 3 项，OG 图依赖 Google 字体）。

### 3. ⚠️ 移除 Google Fonts 依赖（国内 / 构建环境不可访问）
原版 AstroPaper 用 Astro Font API 从 Google Fonts 加载 "Google Sans Code"，
在国内和本构建环境不可达，会**同时阻塞 `astro dev` 启动和 `astro build`**。改动：
- `astro.config.ts`：删除 `fonts: [...]` 配置与 `fontProviders` import。
- `src/layouts/Layout.astro`：删除 `<Font />` 组件与其 import。
- `src/styles/theme.css`：`--font-app` 从 `var(--font-google-sans-code)` 改为系统等宽字体栈。
- 删除依赖该字体的 OG 图端点：`src/pages/og.png.ts`、`src/pages/posts/[...slug]/index.png.ts`。
- 站点 `og:image` 回退到静态 `public/default-og.jpg`。
- ⚠️ 升级注意：若 upstream 改动字体或 OG 架构，这几处需重新对齐。若日后网络允许，可改用本地字体文件（`fontProviders.local()`）或 fontsource 恢复自定义字体。

### 4. 图片资产 `public/`
- `public/wp-content/`：WordPress 迁移的正文图与封面图（约 686 个文件）。
- `public/logo.png`：站点 logo（土豆图，来自 littlepotato.me）。

### 5. `.gitignore`
- 增加 `*.log`。

### 6. Giscus 评论
- `src/components/Comments.astro`：giscus 脚本 + 主题同步（跟随 `data-theme` toggle）+ 每次 SPA 导航后重载（AstroPaper 用 ClientRouter，普通 giscus `<script>` 不会在下一篇文章重跑）。
- 在 `src/pages/posts/[...slug]/index.astro` 的 `AdjacentPostNav` 后引入 `<Comments />`。
- 配置：repo `BranZhang/person-blog`、category `Announcements`、`data-lang="zh-CN"`。

### 7. Logo / Favicon
- `src/components/Header.astro`：站点标题前加 `public/logo.png`（引入 `getAssetPath`）。
- `src/layouts/Layout.astro`：favicon 与 apple-touch-icon 改用 `public/logo.png`（原为 AstroPaper 的 `favicon.svg` / `favicon.ico`）。

---

## 待办的定制（TODO）

- [ ] **列表封面**：原 `heroImage` 映射保存在 git `fbd300d` 与 scratchpad `cover_map.json`（18/50 篇有封面）。AstroPaper 原生列表无封面，需自定义。
- [ ] **数学公式**：加 `remark-math` + `rehype-mathjax`（或 KaTeX）。含公式的文章：`how-kriging-works-*`、`principle-of-word-segmentation-*` 等。
- [ ] **中英双语切换（i18n）**：目标是让**界面语言**支持 en/zh 切换（不是把 UI 固定成中文）。AstroPaper 只内置 `en` 翻译，当前 `lang: "en"`。计划：
  - 在 `src/i18n/lang/` 新增 `zh.ts`（对照 `en.ts` 翻译 nav/a11y 等文案）。
  - 在 `astro.config.ts` 的 `i18n.locales` 加入 `zh`，确定路由策略（locale 前缀 `/zh/…`，默认 en 不加前缀）。
  - 在 header 加语言切换入口，切换后跳到对应 locale 路由。
  - 待明确：仅**界面**双语（文章内容保持原语言），还是**内容**也要中/英两版（后者需每篇文章多语言版本，工作量大，默认不做）。
- [ ] **自定义 embeds**：旧站有 link-card / youtube / mapbox 嵌入，按需评估是否移植。
- [ ] **部署（Cloudflare Pages）**：构建命令 `pnpm build`，输出目录 `dist`，环境变量 `NODE_VERSION=22`。可选：删除 AstroPaper 自带的 `.github/`（issue 模板、`ci.yml`）。
- [ ] **彻底清洗 WordPress 痕迹**：正文目前是 WordPress Gutenberg 导出的原始 HTML，痕迹很多：
  - block class：`wp-block-paragraph` ×1429、`wp-block-heading` ×458、`wp-block-list` ×255、`wp-block-image` ×237、`wp-element-caption` ×155，以及 gallery / quote / table / separator / group / file / codepen-embed 等。
  - `<img>` 带 `loading`/`decoding`/`width`/`height`/`wp-image-xxx` 等冗余属性，且被 `<figure class="wp-block-image">` 等结构包裹。
  - `<!--more-->` 摘要分隔符（49 篇；AstroPaper 用 frontmatter `description` 做摘要，可删）。
  - `/wp-content/...` 图片路径（约 922 处；图片实体在 `public/wp-content/`）。
  - **数学公式被渲染成 quicklatex 图片**（7 篇，`/wp-content/ql-cache/...`）——与"数学公式"待办联动，理想是恢复成 LaTeX 源码交给 rehype-mathjax 渲染（源码可能已丢，需人工）。
  - 目标：把正文转成干净的 Markdown（AstroPaper 原生格式），或至少去掉全部 `wp-*` class 与冗余属性、简化结构。
  - 待明确：**转成 Markdown**（最彻底、易维护，但 gallery / codepen / 公式图等特殊块需人工处理）还是**保留 HTML、仅去 class/属性**（改动小、风险低）。
