// 修复固定 VitePress 版本的嵌套按钮：无链接分组只保留外层折叠控件。
// 在构建阶段转换主题组件，不修改 node_modules；升级时结构变化会明确失败。
export function sidebarAccessibility() {
  return {
    name: 'opensitoo-accessible-sidebar',
    enforce: 'pre' as const,
    transform(source: string, id: string) {
      if (id.includes('?') || !id.replaceAll('\\', '/').endsWith('/components/VPSidebarItem.vue')) return;
      const caret = 'class="caret"\n        role="button"';
      const normalized = source.replaceAll('\r\n', '\n');
      if (!normalized.includes(caret) || !normalized.includes("e.key !== 'Enter'")) {
        throw new Error('侧栏组件结构已变化，请复核无障碍适配');
      }
      return {
        code: normalized
          .replace(caret, 'class="caret"\n        :role="item.link ? \'button\' : undefined"')
          .replace('aria-label="toggle section"', ':aria-label="item.link ? \'展开或折叠\' + item.text : undefined"')
          .replace('tabindex="0"', ':tabindex="item.link ? 0 : undefined"')
          .replace(':role="itemRole"', ':role="itemRole"\n      :aria-expanded="collapsible ? !collapsed : undefined"')
          .replace("e.key !== 'Enter'", "e.key !== 'Enter' && e.key !== ' '")
          .replace('!props.item.link && toggle()', "if ('key' in e && e.key === ' ') e.preventDefault()\n  !props.item.link && toggle()"),
        map: null,
      };
    },
  };
}
