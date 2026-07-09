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

### 8. 列表封面
- `src/content.config.ts`：posts schema 加自定义字段 `cover`（public 绝对路径字符串，直接当 `<img src>`，不走 astro:assets，避免把 `/wp-content/...` 当本地 asset 加载而报错）。
- 18 篇文章 frontmatter 加回 `cover`（映射来源：git `fbd300d` / scratchpad `cover_map.json`）。
- `src/components/Card.astro`：改成带内边距的卡片（`px-4 py-5`，靠内边距拉开卡片间距），**hover 时整卡背景高亮**（`hover:bg-muted/60` + 过渡）且整卡可点击（标题链接用 `after:absolute inset-0` 覆盖）。
- 封面（`Card.astro`）：有 `cover` 时在**右侧**显示，图片**左侧 `mask-image` 线性渐变淡入**（`transparent → black 45%`）；**固定尺寸** `w-56 h-36`（大屏 `lg:w-72 lg:h-44`）而非跟随文字高度，行用 `items-start`，因此**短描述的文章封面会撑高卡片、文字下方留白**；移动端隐藏（`sm` 以上显示）。

### 9. 页面宽度与分页
- `src/styles/global.css`：`max-w-app` 从 `max-w-3xl`（768px）改为 `max-w-5xl`（1024px），加宽全站内容容器、减少桌面左右留白。
- `astro-paper.config.ts`：`posts.perPage` 从 4 改为 15（每页文章数；`perIndex` 首页数量保持 4）。

### 10. ⚠️ 中英双语（i18n）支持
在 AstroPaper 原有 i18n 基础设施上扩展了中文支持和自动语言检测：

**新增文件：**
- `src/i18n/lang/zh-cn.ts`：中文 UI 翻译文件，覆盖导航（首页/文章/标签/关于/归档/搜索）、文章操作按钮、分页、页脚、无障碍标签、404 页面等所有界面文本。
- `src/scripts/lang.ts`：客户端语言切换脚本，处理语言按钮点击事件、localStorage/Cookie 双重持久化（有效期 1 年）、页面导航（保持当前路径，仅切换语言前缀），兼容 Astro View Transitions（监听 `astro:after-swap` 重新绑定事件）。
- `functions/_middleware.js`：Cloudflare Pages Functions 边缘中间件，实现基于访问者地理位置的自动语言检测。检测优先级：用户 Cookie 偏好 > Cloudflare `request.cf.country`（CN/TW/HK/MO/SG → 中文）> 浏览器 `Accept-Language` 请求头。仅在首次访问根路径时执行 302 重定向，已有偏好 Cookie 则跳过。本地开发时无 CF 环境，回退到 Accept-Language 检测。
- `src/pages/zh-cn/`：中文页面路由目录。Astro SSG 模式下非默认语言需要对应的页面文件，文件内容与英文版相同（通过 `Astro.currentLocale === "zh-cn"` 自动使用中文翻译），目录结构包含 `index.astro`、`about.astro`、`search.astro`、`404.astro` 及 `posts/`、`tags/`、`archives/` 子目录。

**修改文件：**
- `astro.config.ts:26-32`：`i18n.locales` 从 `["en"]` 改为 `["en", "zh-cn"]`，保持 `defaultLocale: "en"`、`prefixDefaultLocale: false`（英文无前缀，中文使用 `/zh-cn/` 前缀）。
- `src/components/Header.astro`：在主题切换按钮旁添加语言切换按钮（`#lang-btn`），显示当前语言标识 "EN" / "中"，按钮样式与搜索/主题按钮保持一致（`size-8`、`focus-outline`、响应式布局），点击时通过客户端脚本切换语言。
- `src/layouts/Layout.astro`：在 `<body>` 末尾引入 `@/scripts/lang` 脚本（与 theme 脚本并列）。
- `src/i18n/types.ts`、`src/i18n/lang/en.ts`：新增 `a11y.paginationNav` 翻译键，用于分页组件 aria-label。
- `src/components/Pagination.astro`：将硬编码的 `aria-label="Pagination Navigation"` 改为使用翻译键 `t.a11y.paginationNav`，`useTranslations` 增加 `?? "en"` 回退。
- `astro-paper.config.ts`：移除"no built-in zh translations"的 TODO 注释。

**URL 结构：**
- 英文（默认）：`/`、`/posts`、`/posts/slug`、`/tags` 等，无语言前缀
- 中文：`/zh-cn/`、`/zh-cn/posts`、`/zh-cn/posts/slug`、`/zh-cn/tags` 等
- 用户手动切换语言后，偏好保存在 `preferred-locale` Cookie 和 localStorage 中，后续访问直接使用用户选择的语言
- 博客文章内容暂不做多语言切换（UI 按钮/导航已全部中英文化），后续可扩展内容多语言（需要为每篇文章提供中文版本并调整路由）

**⚠️ 升级注意：**
- 新增语言时需同时更新 `src/i18n/lang/` 下的翻译文件和 `src/pages/zh-cn/` 对应的页面文件
- Cloudflare 中间件位于项目根目录 `functions/` 下（不是 `src/`），这是 Cloudflare Pages Functions 的约定目录
- 目前 Pagefind 搜索已自动索引两种语言，但中文不支持词干提取（stemming），搜索按精确匹配工作

---

## 待办的定制（TODO）

- [ ] **数学公式**：加 `remark-math` + `rehype-mathjax`（或 KaTeX）。含公式的文章：`how-kriging-works-*`、`principle-of-word-segmentation-*` 等。
- [x] **中英双语切换（i18n）**：已完成界面双语支持（en/zh-cn），含语言切换按钮、Cloudflare 地理位置自动检测、Cookie 持久化。当前仅 UI 文本双语，文章内容保持原语言，后续可扩展内容多语言。
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
