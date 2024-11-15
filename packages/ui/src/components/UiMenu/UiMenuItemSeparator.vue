<template>
    <div class="ui-menu__separator my-2">
        <slot />
    </div>
</template>

<style>
.ui-menu__separator {
    height: 1px;
    background: linear-gradient(
        to right,
        transparent 0%,
        var(--color-surface-muted) 25%,
         75%,
        transparent 100%
    )

}
</style>