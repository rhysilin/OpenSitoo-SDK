// 固定主题版本的搜索弹层适配：构建时修正语义，不直接修改第三方依赖。
// 升级后若模板标记变化，立即阻止构建，避免悄悄丢失无障碍支持。
export function searchAccessibility() {
  return {
    name: 'opensitoo-accessible-search',
    enforce: 'pre' as const,
    transform(source: string, id: string) {
      if (id.includes('?')) return;
      const path = id.replaceAll('\\', '/');
      const normalized = source.replaceAll('\r\n', '\n');
      if (path.endsWith('/components/VPSidebar.vue')) {
        if (!normalized.includes('Sidebar Navigation')) throw Error('侧栏导航结构已变化，请复核中文名称');
        return { code: normalized.replace('Sidebar Navigation', '文档目录'), map: null };
      }
      if (!path.endsWith('/components/VPLocalSearchBox.vue')) return;
      const container = `role="button"
      :aria-owns="results?.length ? 'localsearch-list' : undefined"
      aria-expanded="true"
      aria-haspopup="listbox"
      aria-labelledby="localsearch-label"`;
      const input = 'ref="searchInput"\n            v-model="filterText"';
      const markers = [container, input, 'const { activate } = useFocusTrap(el, {', 'role="option"', 'class="result"', '<kbd :aria-label=', '/* Search input focus */'];
      if (markers.some(marker => !normalized.includes(marker))) {
        throw Error('搜索组件结构已变化，请复核对话框和组合框适配');
      }
      return {
        code: normalized
          .replace('const { activate } = useFocusTrap(el, {', 'const returnFocus = inBrowser ? document.activeElement : null\nconst { activate } = useFocusTrap(el, {\n  setReturnFocus: returnFocus as HTMLElement,')
          .replace(container, 'role="dialog"\n      aria-modal="true"\n      :aria-label="buttonText"')
          // 显式限制 Tab 在弹层内循环，避免 WebKit 原生 Tab 策略跳过结果并移向页面外。
          .replace('/* Search input focus */', `useEventListener(el, 'keydown', (event: KeyboardEvent) => {
  if (event.key !== 'Tab') return
  const targets = Array.from(el.value?.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input:not([disabled]), [tabindex="0"]') || [])
    .filter(node => node.getClientRects().length && getComputedStyle(node).visibility !== 'hidden')
  if (!targets.length) return
  const index = targets.indexOf(document.activeElement as HTMLElement)
  const next = index < 0 ? (event.shiftKey ? targets.length - 1 : 0) : (index + (event.shiftKey ? -1 : 1) + targets.length) % targets.length
  event.preventDefault()
  event.stopPropagation()
  targets[next].focus()
})
/* Search input focus */`)

          .replace(input, input + '\n            role="combobox"\n            :aria-expanded="!!results?.length"\n            aria-haspopup="listbox"')
          .replace('aria-autocomplete="both"', 'aria-autocomplete="list"')
          // 图标键帽使用可命名角色，避免在无命名语义的 kbd 上添加 aria-label。
          .replaceAll('<kbd :aria-label=', '<kbd role="img" :aria-label=')
          .replaceAll('aria-labelledby="localsearch-label"', ':aria-label="buttonText"')
          .replace(`:aria-labelledby="results?.length ? 'localsearch-label' : undefined"`, ':aria-label="buttonText"')
          .replace(`:id="'localsearch-item-' + index"`, '')
          .replace(`:aria-selected="selectedIndex === index ? 'true' : 'false'"`, '')
          .replace('role="option"', 'role="presentation"')
          .replace('class="result"', 'class="result"\n              role="option"\n              :id="\'localsearch-item-\' + index"\n              :aria-selected="selectedIndex === index"'),
        map: null,
      };
    },
  };
}
