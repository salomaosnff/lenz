<script setup lang="ts">
import UiWindow from '../../../../ui/src/components/UiWindow/UiWindow.vue';

defineProps<{
  title?: string;
  content?: string;
  movable?: boolean;
  closeable?: boolean;
  resizable?: boolean;
  modal?: boolean;
  data?: Record<string, unknown>;
}>();

const emit = defineEmits<{
  open: [];
  close: [];
  movestart: [position: { x: number; y: number }];
  move: [position: { x: number; y: number }];
  moveend: [position: { x: number; y: number }];
  resizestart: [size: { width: number; height: number }];
  resize: [size: { width: number; height: number }];
  resizeend: [size: { width: number; height: number }];
}>();

const { lockIframe } = inject<Record<string, unknown>>("lockIframe", {
  lockIframe: false,
});

const visible = defineModel<boolean>("visible", {
  default: true,
});

const x = defineModel<number>("x");
const y = defineModel<number>("y");

const width = defineModel<number>("width");
const height = defineModel<number>("height");
const windowRef = ref<InstanceType<typeof UiWindow>>();

function focus() {
  windowRef.value?.focus();
}

defineExpose({
  focus,
});
</script>
<template>
  <UiWindow
    ref="windowRef"
    v-model:visible="visible"
    v-model:x="x"
    v-model:y="y"
    v-model:width="width"
    v-model:height="height"
    :title
    :movable
    :closeable
    :resizable
    :modal
    @open="emit('open')"
    @close="emit('close')"
    @movestart="lockIframe = true, emit('movestart', $event)"
    @move="emit('move', $event)"
    @moveend="lockIframe = false, emit('moveend', $event)"
    @resizestart="lockIframe = true, emit('resizestart', $event)"
    @resize="emit('resize', $event)"
    @resizeend="lockIframe = false, emit('resizeend', $event)"
  >
    <AppWebview :content="content" :data class="w-full h-full bg-transparent"
  /></UiWindow>
</template>
