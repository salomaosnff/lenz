<script setup lang="ts">
import { ref } from "vue";
import ThemeColorPicker from "./components/ThemeColorPicker.vue";
import * as LenzReactivity from "lenz:reactivity";

const value = ref("var(--color-primary)");

const props = defineProps<{
  getData(): {
    result: LenzReactivity.Ref<string>;
  };
}>();

const { result } = props.getData();
</script>

<template>
  <ThemeColorPicker v-model="value" :result="result" />
</template>
