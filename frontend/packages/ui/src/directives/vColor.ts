import type { DirectiveBinding, ObjectDirective } from 'vue';

export function resolveColor(value: string) {
  if (value.startsWith("'")) {
    return value.substring(1, value.length - 1);
  } else {
    return `var(--color-${value})`;
  }
}

function directive(
  el: HTMLElement,
  binding: DirectiveBinding<string | undefined | null>,
) {
  if (!binding.value) {
    el.style.removeProperty('--current-color');
    el.style.removeProperty('--current-surface-color');
    return;
  }
  const varName = binding.arg
    ? `--current-${binding.arg}-color`
    : '--current-color';
  el.style.setProperty(varName, resolveColor(binding.value));
  el.style.setProperty(
    '--current-surface-color',
    `oklch(from var(${varName}) l c h / var(--theme-surface-opacity))`,
  );
}

export const vColor: ObjectDirective<HTMLElement, string | undefined | null> = {
  beforeMount: directive,
  updated: directive,
};