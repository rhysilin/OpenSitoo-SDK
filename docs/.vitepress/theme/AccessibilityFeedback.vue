<script setup lang="ts">
import { onMounted, onUnmounted, ref, nextTick } from 'vue';
const message = ref('');
let observer: MutationObserver | undefined;
let timer: ReturnType<typeof setTimeout> | undefined;
let lastSearch = '';
const copied = new WeakSet<Element>();
async function announce(text: string) {
  // 先清空再更新，让连续复制相同代码仍产生可被读屏捕获的状态变化。
  message.value = '';
  await nextTick();
  message.value = text;
}
function inspect() {
  document.querySelectorAll('button.copy').forEach((button) => {
    if (button.classList.contains('copied')) {
      if (!copied.has(button)) { copied.add(button); void announce('代码已复制'); }
    } else { copied.delete(button); }
  });
  const box = document.querySelector('.VPLocalSearchBox');
  if (!box) { lastSearch = ''; return; }
  const input = box.querySelector<HTMLInputElement>('input');
  const count = box.querySelectorAll('.result').length;
  const empty = box.querySelector('.no-results');
  const key = `${input?.value ?? ''}:${count}:${!!empty}`;
  if (!input?.value || key === lastSearch || (!count && !empty)) return;
  lastSearch = key;
  // 搜索使用模态框：状态放在框内，避免 aria-modal 令框外播报被忽略。
  let status = box.querySelector<HTMLElement>('[data-search-feedback]');
  if (!status) {
    status = document.createElement('div');
    status.dataset.searchFeedback = '';
    status.className = 'docs-sr-only';
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    status.setAttribute('aria-atomic', 'true');
    box.append(status);
  }
  status.textContent = empty ? '未找到结果，请修改搜索词' : `找到 ${count} 项结果，使用上下方向键选择`;
}
function schedule() {
  clearTimeout(timer);
  timer = setTimeout(inspect, 150);
}
onMounted(() => {
  observer = new MutationObserver(schedule);
  observer.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['class'] });
  document.addEventListener('input', schedule);
  inspect();
});
onUnmounted(() => {
  observer?.disconnect();
  clearTimeout(timer);
  document.removeEventListener('input', schedule);
});
</script>

<template>
  <div class="docs-sr-only" data-copy-feedback role="status" aria-live="polite" aria-atomic="true">{{ message }}</div>
</template>
