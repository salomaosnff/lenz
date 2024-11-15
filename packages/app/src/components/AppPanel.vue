<template>
  <div class="app-panel bg--surface rounded-md pa-2 flex flex-col gap-2">
    <slot></slot>
  </div>
</template>
<style lang="scss">
.app-panel {
  border: 1px solid var(--color-surface-muted);
}
</style>