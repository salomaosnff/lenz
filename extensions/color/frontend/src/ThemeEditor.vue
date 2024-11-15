<script setup lang="ts">
import { onUnmounted, ref, watch } from "vue";
import Picker from "./components/Picker.vue";

import * as LenzReactivity from "lenz:reactivity";

const props = defineProps<{
  getData(): {
    result: LenzReactivity.Ref<string>;
  };
}>();

const { result } = props.getData();

const styleContent = ref(result.value ?? "");

onUnmounted(
  LenzReactivity.watch(result, (newStyle) => {
    styleContent.value = newStyle;
  })
);

// watch(styleContent, (newStyle) => {
//   result.value = newStyle;
// });

const themes = ref<
  Array<{
    name: string;
    colors: Array<{
      name: string;
      value: string;
    }>;
  }>
>([]);

watch(
  () => styleContent.value.trim(),
  (str) => {
    const newThemes: Array<{
      name: string;
      colors: Array<{
        name: string;
        value: string;
      }>;
    }> = [];

    for (const match of str.matchAll(
      /^.*?\.theme--(.+?)\s*{\s*([\s\S]+?)\s*}/gm
    )) {
      const [_, theme, content] = match;
      const themeObj = {
        name: theme,
        colors: [] as Array<{ name: string; value: string }>,
      };

      str = str.substring(0, match[0].length);

      for (const line of content.split(/;\n?/g)) {
        let [key, value] = line.split(":").map((v) => v.trim());

        key = key.substring(8);
        value = value?.replace(/;+$/, "") ?? "";

        if (!key || !value) {
          continue;
        }

        themeObj.colors.push({ name: key, value });
      }

      newThemes.push(themeObj);
    }

    themes.value = newThemes;
  },
  { deep: true, immediate: true }
);

watch(
  themes,
  () => {
    let newStr = "";

    for (const theme of themes.value) {
      newStr += `.theme--${theme.name} {\n`;

      for (const color of theme.colors) {
        newStr += `  --color-${color.name}: ${color.value};\n`;
      }

      newStr += `}\n\n`;
    }

    result.value = newStr;
  },
  { deep: true }
);
</script>

<template>
  <div class="flex">
    <div class="flex-1 overflow-auto px-4">
      <ul class="m-0 pl-4 mt-4">
        <li
          v-for="(theme, themeIndex) in themes"
          :key="themeIndex"
          class="mb-4"
        >
          <div class="flex gap-2 items-center">
            <input
              type="text"
              v-model="theme.name"
              class="mb-2 text-6 flex-1"
            />
            <button
              @click="theme.colors.push({ name: 'nova-cor', value: '#000000' })"
            >
              Nova cor
            </button>
            <button @click="themes.splice(themeIndex, 1)">Excluir</button>
          </div>
          <ul class="pl-4">
            <li
              v-for="(color, index) in theme.colors"
              :key="index"
              class="flex items-center gap-2 mb-1"
            >
              <input type="text" v-model="color.name" class="flex-1" />

              <Picker v-model="color.value" class="w-40" />

              <div
                class="aspect-ratio-1 h-5"
                :style="{ background: color.value }"
              ></div>
              <button @click="theme.colors.splice(index, 1)">Excluir</button>
            </li>
          </ul>
        </li>
      </ul>
      <div class="text-center">
        <button
          @click="
            themes.push({
              name: !themes.length
                ? 'dark'
                : themes[themes.length - 1].name === 'dark'
                  ? 'light'
                  : 'novo-tema',
              colors: themes[0]?.colors.map((c) => ({ ...c })) ?? [
                { name: 'primary', value: '#000000' },
                { name: 'background', value: '#000000' },
                { name: 'foreground', value: '#000000' },
              ],
            })
          "
        >
          Novo tema
        </button>
      </div>
    </div>
    <pre class="overflow-auto bg--surface pa-4 overflow-auto w-80">{{
      styleContent
    }}</pre>
  </div>
</template>
