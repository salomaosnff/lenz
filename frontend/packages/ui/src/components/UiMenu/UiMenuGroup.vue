<script setup lang="ts">
import icon_chevron_right from 'lenz:icons/chevron_right';
import _uniqueId from 'lodash-es/uniqueId';
import { inject, Ref } from 'vue';

defineProps<{
    disabled?: boolean
}>();

const id = _uniqueId('menu-group-');

const parentMenuGroup = inject<{
    currentItem: Ref<string | undefined>
    is_menu_bar: boolean
    hasIcons: Ref<boolean>
} | null>('menu-group', null);


if (!parentMenuGroup) {
    throw new Error('UiMenuGroup must be used inside UiMenu or UiMenuBar');
}
function onPointerEnter() {
    (parentMenuGroup as any).currentItem.value = id;
}

function onClick() {
    if (!parentMenuGroup) {
        return;
    }

    if (parentMenuGroup.currentItem.value === id) {
        parentMenuGroup.currentItem.value = undefined;
    } else {
        parentMenuGroup.currentItem.value = id;
    }
}

function close() {
    if (parentMenuGroup) {
        parentMenuGroup.currentItem.value = undefined;
    }
}
</script>
<template>
    <UiOverlayMenu :origin="parentMenuGroup?.is_menu_bar ? 'bottom-start' : 'right-start'" close-on-click
        :visible="parentMenuGroup?.currentItem.value === id"
        :offset="parentMenuGroup?.is_menu_bar ? 3 : 4"
        @close="close">
        <template #activator="bind">
            <slot name="activator" :ref="bind.setActivatorRef" @pointerenter="onPointerEnter">
                <li :ref="bind.setActivatorRef" tabindex="0"
                    class="whitespace-nowrap hover:bg--surface2 py-1 px-2 gap-2 cursor-pointer flex rounded-md" :class="{
                        'pl-28px': parentMenuGroup.hasIcons.value,
                        'bg--surface2': parentMenuGroup?.currentItem.value === id,
                        'fg--muted pointer-events-none': disabled
                    }" @pointerenter="onPointerEnter" @click="onClick">
                    <div class="flex-1">
                        <slot name="title"></slot>
                    </div>
                    <UiIcon v-if="!parentMenuGroup?.is_menu_bar" :path="icon_chevron_right" class="block text-5 ml-4" />
                </li>
            </slot>
        </template>

        <template #default="{ open }">
            <UiMenu @pointerenter="open()">
                <slot></slot>
            </UiMenu>
        </template>
    </UiOverlayMenu>
</template>