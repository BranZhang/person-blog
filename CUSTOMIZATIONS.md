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

- ✅ **正文已从 WordPress 原始 HTML 彻底清洗为干净的 Markdown/MDX**（见第 11 项）。34 篇纯文章为 `.md`，16 篇含嵌入/画廊的为 `.mdx`。
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
在 AstroPaper 原有 i18n 基础设施上扩展了中文支持和显式语言切换：

**新增文件：**
- `src/i18n/lang/zh-cn.ts`：中文 UI 翻译文件，覆盖导航（首页/文章/标签/关于/归档/搜索）、文章操作按钮、分页、页脚、无障碍标签、404 页面等所有界面文本。
- `src/scripts/lang.ts`：客户端语言切换脚本，处理语言按钮点击事件、localStorage/Cookie 双重持久化（有效期 1 年）、页面导航（保持当前路径，仅切换语言前缀），兼容 Astro View Transitions（监听 `astro:after-swap` 重新绑定事件）。
- `public/_redirects`：Cloudflare Pages 永久重定向规则，把旧 WordPress 日期型文章 URL、分类、标签、分页和 Feed 地址迁移到当前路由。规则使用精确文章路径，避免误伤现有多语言页面。
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
- 不再根据 IP 或 `Accept-Language` 自动重定向，英文与中文 URL 均可被用户和搜索引擎直接访问
- 用户手动切换语言后，偏好保存在 `preferred-locale` Cookie 和 localStorage 中；有对应译文时保持文章 slug 切换

**⚠️ 升级注意：**
- 新增语言时需同时更新 `src/i18n/lang/` 下的翻译文件和 `src/pages/zh-cn/` 对应的页面文件
- 旧站 URL 迁移规则维护在 `public/_redirects`；新增旧链接映射时应使用 301，并避免覆盖现有静态路由
- 目前 Pagefind 搜索已自动索引两种语言，但中文不支持词干提取（stemming），搜索按精确匹配工作

### 11. ⚠️ WordPress 正文清洗（HTML → Markdown/MDX）
把 50 篇从 WordPress 迁移的 Gutenberg 原始 HTML 正文，一次性转成干净、简洁、可扩展的 Markdown/MDX。目标：`.md` 为主，只有真正需要组件的文章升级为 `.mdx`。

**产物形态：**
- **34 篇 `.md`**：纯文字/代码/图片/公式/表格的文章，全部标准 Markdown。
- **16 篇 `.mdx`**：含第三方嵌入或图片画廊的文章，顶部 `import` 对应组件。
- 分类规则：正文含活体 `<script>` 的 2 篇（mapbox 内联地图、gist）保持 `.md` 并原样保留 `<script>`/`<iframe>`（Astro `.md` 直出 raw HTML，`<script>` 可执行；MDX 会把 `<script>` 当 JSX 处理，故不转）；其余含 `<iframe>` 或画廊的转 `.mdx` 用组件。

**新增组件：**
- `src/components/Embed.astro`：响应式第三方 iframe 包裹（`src`/`height`/`ratio`/`title`），统一 `.blog-embed` 样式，协议相对 URL 升级 https。替代原先 raw `<iframe>` + remark 兜底的做法。
- `src/components/Gallery.astro`：图片画廊（`images={[{src,caption}]}` + 可选 `caption`），CSS grid `auto-fit` 自适应列数。来自 `wp-block-gallery`。

**新增/接入的插件（`astro.config.ts` 的 `markdown.processor`，MDX 自动继承）：**
- `remark-math` + `rehype-katex`：数学公式，KaTeX 构建期渲染，字体自托管。
- `src/utils/rehypeImageFigures.ts`：把「独占一段、带 title 的 Markdown 图片」`![alt](src "cap")` 提升为 `<figure class="blog-figure"><img><figcaption>`，让纯 `.md` 也能有带标题图片，无需组件。
- `remark-responsive-embeds`（保留）：仅服务上面 2 篇 raw-HTML iframe。

**转换器（一次性脚本，未入库）：** 用 `cheerio` 解析每篇 HTML，递归序列化为 Markdown。关键映射：
- `p.wp-block-paragraph` → 段落；`h2-4.wp-block-heading` → `##`/`###`/`####`；`ul/ol.wp-block-list` → 列表（有序项子列表按 marker 宽度 3 空格缩进）。
- `pre.EnlighterJSRAW[data-enlighter-language]` → 带语言的围栏代码块（`generic`→`text`）。
- `figure.wp-block-image` + `figcaption` → `![alt](src "caption")`（交给 `rehypeImageFigures` 出 figure）。
- `figure.wp-block-gallery` → `<Gallery>`；`table` → GFM 表格（cell 保留 `<sup>`/`<br>` 内联 HTML）；`blockquote`/`hr`/`<sup>`/`<mark>` 等按语义转。
- **数学**：`img.ql-img-inline-formula` 的 `alt`（数字实体编码的 LaTeX）→ `$…$`；`img.ql-img-displayed-equation` → `$$…$$`（去掉 `\[ \]`）。
- HTML 实体解码；`<!--more-->` 删除；frontmatter 里 `&hellip;` 等实体顺手解码。
- **MDX 转义**：`.mdx` 文本节点里裸 `<` → `\<`、`{`/`}` → `\{`/`\}`，避免被当成 JSX；`.md` 里裸 `<` → `&lt;`。

**样式：** `src/styles/typography.css` 加 `.blog-figure` / `.blog-gallery*` 规则；`.blog-embed` 改为 `h-full` + 由组件设 `height`/`aspect-ratio`。`src/styles/global.css` 加 `@import "katex/dist/katex.min.css"`。

**⚠️ 升级注意：**
- 数学/画廊/嵌入依赖 `markdown.processor`（自定义 unified processor）被 MDX 继承——**不要**再往 `mdx({...})` 传 `remarkPlugins`/`rehypePlugins`（已废弃且会重复）。
- 若要新增一篇带嵌入/画廊的文章，写 `.mdx` 并 `import Embed/Gallery from "@/components/..."`。

### 12. 单篇文章视觉美化

- **封面 hero**（`src/pages/posts/[...slug]/index.astro` 与 `src/pages/zh-cn/...`）：仅 18 篇有 `cover` 的文章，把封面做成**标题背后的头图**——`<header class="post-hero">`（`min-h-64`/桌面 `sm:min-h-72`），封面 `<img>` 绝对定位 `object-cover` 铺满，叠一层底部渐深的黑色 gradient；**标题+日期放底部的毛玻璃面板**（`bg-black/30` + `backdrop-blur-md`），文字强制白色（`Datetime` 硬编码 `text-muted-foreground`，用 `text-white/85!` important 覆盖，日历图标 `currentColor` 同步变白）。`fetchpriority="high"` 助 LCP。**无封面的文章**保持原纯标题布局（三元分支）。图片/hero 容器均**无边框**。
- **正文图片**（`typography.css` `.app-prose img`）：`rounded-lg` + `shadow-sm`，**无边框**；可缩放图（`img[role=button]`）hover 时 `shadow-md`，`prefers-reduced-motion` 下关动画。
- **图注**（`figure.blog-figure` / `.blog-gallery` 的 `figcaption`、`.blog-gallery-caption`，以及 `.app-prose` 基础 `figcaption`）：`text-center` 居中 + `italic` + `text-muted-foreground/80`，正文图注加 `leading-relaxed`。
- **代码块主题与可读性**：`astro.config.ts` 亮色主题从 `min-light`（低对比、发灰）换成 **`github-light`**（高对比），暗色保留 `night-owl`。`.astro-code` 加 `max-h-[36rem]` + `overflow-y-auto`（超长代码内部滚动），及 `rounded-lg` + `border-border/70` + `shadow-sm`（代码块**保留**淡边框，仅图片去边框）。
- **代码行号**（`typography.css`）：CSS counter，`.astro-code .line::before` 输出序号——放 `::before` 使其**不进 `code.innerText`，复制不带行号**；gutter 宽 `1.9rem`（容 3 位数）；`.line:last-child:empty` 不编号。
- **代码语言标识**：扩展 `attachCopyButtons`（inline script，en + zh-cn 双份），读 `pre[data-language]`，在**左上角**加语言徽标（与右上角复制按钮对称，同 `top-(--file-name-offset)` 偏移）；`langNames` 映射友好名（`cpp→C++`、`csharp→C#`…）；`text`/`plaintext`/`txt`/`ansi` 不显示。徽标 append 到 `<pre>` 而非 `<code>`，同样不进复制。
- **行内 code**（`.app-prose code`）：`px-1.5 py-0.5` + `text-[0.9em]` + `border-border/60` 细边框；`.astro-code code` 用 `border-0 text-[0.95em]` 覆盖，避免代码块内 token 被套框。

---

## 待办的定制（TODO）

- [x] **数学公式**：已用 `remark-math` + `rehype-katex` 渲染（见第 11 项）。7 篇被 WordPress 渲染成 quicklatex 图片的公式，LaTeX 源码从 `<img alt>`（HTML 数字实体编码）中完整恢复，行内用 `$…$`、独立公式用 `$$…$$`。KaTeX 字体自托管（59 个 woff2 打进 `dist/_astro/`），无需外网。
- [x] **中英双语切换（i18n）**：已完成界面与文章双语支持（en/zh-cn），含显式语言切换、Cookie 持久化、双语 RSS 和按真实译文输出的 `hreflang`；不使用地理位置强制重定向。
- [x] **自定义 embeds（响应式）**：第三方 `<iframe>` 嵌入已升级为 `<Embed>` 组件（见第 11 项）。清洗后的 `.mdx` 文章用 `<Embed src height title />`；仅 `design-a-cultural-revolution-style-map` 含活体 `<script>`，保留原始 `<iframe>` 走 `remarkResponsiveEmbeds` 兜底。
  - `src/utils/remarkResponsiveEmbeds.ts`：仍保留，负责上面两篇 raw-HTML `<iframe>` 的 `.blog-embed` 包裹与协议相对 URL 升级。
  - ⚠️ CodePen 用的是 `anon` 匿名嵌入，CodePen 早已停用，实际会显示 "CodePen Embed Fallback" 空框——已转成 `<Embed>`（保留原 src，方便日后替换），但源仍失效。link-card / youtube：迁移内容中未发现。
- [x] **部署（Cloudflare Pages）**：构建命令 `pnpm build`，输出目录 `dist`，环境变量 `NODE_VERSION=22`。可选：删除 AstroPaper 自带的 `.github/`（issue 模板、`ci.yml`）。
- [x] **彻底清洗 WordPress 痕迹**：50 篇正文已全部从 Gutenberg 原始 HTML 转成干净的 Markdown/MDX（见第 11 项）。所有 `wp-block-*` / `wp-element-*` class、`<img>` 冗余属性、`<!--more-->` 分隔符已清除；`/wp-content/...` 图片路径保留（实体仍在 `public/wp-content/`）。
