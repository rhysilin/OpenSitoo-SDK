import DefaultTheme from 'vitepress/theme';
import { h } from 'vue';
import AccessibilityFeedback from './AccessibilityFeedback.vue';
import './custom.css';
// 保留默认布局，以布局末尾插槽补充不抢焦点的读屏状态反馈。
export default {
  extends: DefaultTheme,
  Layout: () => h(DefaultTheme.Layout, null, { 'layout-bottom': () => h(AccessibilityFeedback) }),
};