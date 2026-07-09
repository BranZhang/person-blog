import { defineAstroPaperConfig } from "./src/types/config";

export default defineAstroPaperConfig({
  site: {
    url: "https://littlepotato.me/",
    title: "Bran Zhang",
    description: "Personal notes, engineering writeups, and archived posts.",
    author: "Bran Zhang",
    profile: "https://github.com/BranZhang",
    ogImage: "default-og.jpg",
    // TODO: no built-in zh translations in AstroPaper yet; UI stays English
    // until a zh locale is added. See CUSTOMIZATIONS.md.
    lang: "en",
    timezone: "Asia/Shanghai",
    dir: "ltr",
  },
  posts: {
    perPage: 15,
    perIndex: 4,
    scheduledPostMargin: 15 * 60 * 1000,
  },
  features: {
    lightAndDarkMode: true,
    // Disabled: OG image generation needs Google Fonts, which is blocked in
    // this build environment / slow in mainland China. Revisit with covers.
    dynamicOgImage: false,
    showArchives: true,
    showBackButton: true,
    // Deployed on Cloudflare, not editing via GitHub — disable the edit link.
    editPost: {
      enabled: false,
    },
    search: "pagefind",
  },
  socials: [
    { name: "github", url: "https://github.com/BranZhang" },
    { name: "mail", url: "mailto:njnuzhangchi@gmail.com" },
  ],
  shareLinks: [
    { name: "x", url: "https://x.com/intent/post?url=" },
    { name: "telegram", url: "https://t.me/share/url?url=" },
    { name: "mail", url: "mailto:?subject=See%20this%20post&body=" },
  ],
});
