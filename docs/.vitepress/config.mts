import { defineConfig } from 'vitepress';

export default defineConfig({
  lang: 'zh-CN',
  title: 'Sitoo 开发者文档',
  description: '应用开发、平台接口、打包与发布',
  head: [
    [
      'link',
      {
        rel: 'icon',
        href:
          'data:image/svg+xml,' +
          encodeURIComponent(
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="8" fill="#e5273e"/><text x="16" y="24" text-anchor="middle" font-size="24" fill="white">S</text></svg>',
          ),
      },
    ],
  ],



  base: process.env.SITOO_DOCS_BASE ?? '/',
  markdown: { lineNumbers: true },
  themeConfig: {
    nav: [
      { text: '快速开始', link: '/35-developer-kit-quickstart' },
      { text: '浏览器 SDK', link: '/browser-sdk' },
      { text: '更新记录', link: '/sdk-changelog' },
    ],
    sidebar: [
      {
        text: '开始开发',
        items: [
          { text: '概览与能力边界', link: '/' },
          { text: '快速开始与发布', link: '/35-developer-kit-quickstart' },
          { text: '设计应用示例', link: '/37-design-studio' },
          { text: '标准与兼容性', link: '/standards' },
        ],
      },
      {
        text: '接口与契约',
        items: [
          { text: '浏览器 SDK', link: '/browser-sdk' },
          { text: 'SDK 完整手册', link: '/33-app-sdk-developer-guide' },
          { text: '平台接口参考', link: '/34-api-reference' },
        ],
      },
      {
        text: '验收与维护',
        items: [
          { text: '平台准备与剩余工作', link: '/36-app-platform-readiness' },
          { text: 'SDK 更新记录', link: '/sdk-changelog' },
        ],
      },
    ],
    search: {
      provider: 'local',
      options: {
        miniSearch: {
          options: {
            tokenize: (text: string) =>
              Array.from(new Intl.Segmenter('zh-CN', { granularity: 'word' }).segment(text))
                .filter((part) => part.isWordLike)
                .map((part) => part.segment),
          },
        },
        translations: {
          button: { buttonText: '搜索文档', buttonAriaLabel: '搜索文档' },
          modal: {
            noResultsText: '未找到相关结果',
            resetButtonTitle: '清除搜索',
            backButtonTitle: '关闭搜索',
            displayDetails: '显示详细列表',
            footer: { selectText: '选择', navigateText: '切换', closeText: '关闭' },
          },
        },
      },
    },
    outline: { label: '本页目录', level: [2, 3] },
    docFooter: { prev: '上一页', next: '下一页' },
    darkModeSwitchLabel: '主题',
    darkModeSwitchTitle: '切换到深色主题',
    lightModeSwitchTitle: '切换到浅色主题',
    skipToContentLabel: '跳转到正文',
    sidebarMenuLabel: '文档导航',
    returnToTopLabel: '返回顶部',
  },
});
