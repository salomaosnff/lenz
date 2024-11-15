<script setup lang="ts" generic="T">
import _uniqueId from "lodash-es/uniqueId";
import { computed, inject, onUnmounted, Ref, watch } from "vue";
import UiRadio from "../UiRadio/UiRadio.vue";

const props = defineProps<{
  disabled?: boolean;
  icon?: string;
  checkedValue?: T;
  uncheckedValue?: T;
  "onUpdate:check"?: (value: T) => void;
}>();

const id = _uniqueId("menu-item-");
const [checkModel, checkModifiers] = defineModel<T, "radio">("check");

const parentMenuGroup = inject<{
  currentItem: Ref<string>;
  countIcons: Ref<number>;
  hasIcons: Ref<boolean>;
} | null>("menu-group", null);

if (!parentMenuGroup) {
  throw new Error("UiMenuItem must be used inside UiMenuGroup");
}

function onPointerEnter() {
  if (parentMenuGroup) {
    parentMenuGroup.currentItem.value = id;
  }
}

const hasCheck = computed(() => props["onUpdate:check"] !== undefined);
const hasIcon = computed(() => hasCheck.value || props.icon);

watch(
  hasCheck,
  (value, oldValue) => {
    if (value) {
      parentMenuGroup.countIcons.value++;
    } else if (oldValue !== undefined) {
      parentMenuGroup.countIcons.value--;
    }
  },
  { immediate: true }
);

onUnmounted(() => {
  if (hasIcon.value) {
    parentMenuGroup.countIcons.value--;
  }
});
</script>
<template>
  <li
    tabindex="0"
    class="whitespace-nowrap hover:bg--surface2 rounded-md gap-2 cursor-pointer flex overflow-hidden"
    :class="{
      'fg--muted pointer-events-none': disabled,
    }"
    @pointerenter="onPointerEnter"
  >
    <template v-if="hasCheck">
      <UiRadio
        class="w-max !cursor-inherit pl-1 pr-2"
        v-if="checkModifiers.radio"
        v-model="checkModel"
        :value="(checkedValue as any)"
      >
        <div class="py-1 pr-2 flex gap-2 items-center">
          <div class="flex-1">
            <slot></slot>
          </div>
          <slot name="right" />
        </div>
      </UiRadio>
      <UiCheckbox
        v-else
        class="w-full !cursor-inherit pl-1 pr-2"
        v-model="checkModel"
        :checked-value="checkedValue"
        :unchecked-value="uncheckedValue"
      >
        <div class="py-1 pr-2 flex gap-2 items-center">
          <div class="flex-1">
            <slot></slot>
          </div>
          <slot name="right" />
        </div>
      </UiCheckbox>
    </template>
    <div v-else class="py-1 px-2 flex gap-2 w-full items-center" :class="{
      'pl-29px': parentMenuGroup.hasIcons.value && !hasIcon
    }">
      <UiIcon
        v-if="props.icon"
        :path="props.icon"
        class="!w-16px !h-16px"
      />
      <div class="flex-1">
        <slot></slot>
      </div>
      <slot name="right" />
    </div>
  </li>
</template>
