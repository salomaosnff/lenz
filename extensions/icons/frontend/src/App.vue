<script setup lang="ts">
import * as allIcons from "@mdi/js";

import { computed, onBeforeUnmount, ref, watch } from "vue";
import * as LenzReactivity from "lenz:reactivity";
import CssNumberInput from "./components/CssNumberInput.vue";

const props = defineProps<{
  onInsert(icon: string): void;
}>();

const icons = Object.entries(allIcons).map(([name, path]) => ({
  // Unprefix the icon name and remove pascal case
  name: name
    .replace("mdi", "")
    .replace(/([A-Z])/g, " $1")
    .trim()
    .toLowerCase(),

  path,
}));

const search = ref("");

const filteredIcons = computed(() => {
  if (!search.value) return icons;
  return new Set(
    icons.filter((icon) =>
      icon.name.toLowerCase().includes(search.value.toLowerCase())
    )
  );
});

const selectedIcon = ref<{
  name: string;
  path: string;
}>();

const code = computed(() => {
  return (
    selectedIcon.value &&
    [
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="1.2em" height="1.2em">',
      `  <path d="${selectedIcon.value?.path}" />`,
      "</svg>",
    ].join("\n")
  );
});
</script>

<template>
  <div class="flex" style="height: 100%; width: 100%">
    <form @submit.prevent class="widget-icons-form flex-1">
      <fieldset>
        <legend>Material Design Icons</legend>
        <label>
          <p>Pesquisar</p>
          <input
            type="text"
            v-model="search"
            name="font-family"
            placeholder="Ex: home"
          />
        </label>
        <div class="icon-list">
          <ul class="icons-widget-icon-grid">
            <li
              v-for="icon in filteredIcons"
              :key="icon.name"
              @click="selectedIcon = icon"
              :class="{ selected: icon === selectedIcon }"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                width="40px"
                height="40px"
              >
                <path :d="icon.path" />
              </svg>

              <p>{{ icon.name }}</p>
            </li>
          </ul>
        </div>
      </fieldset>
    </form>
    <div class="preview" style="padding: 14px">
      <fieldset>
        <legend>Código SVG</legend>
        <pre>{{ code }}</pre>
      </fieldset>
      <p>
        Aprenda mais sobre SVG em
        <a
          href="https://developer.mozilla.org/pt-BR/docs/Web/SVG"
          target="_blank"
          >MDN Web Docs</a
        >
      </p>

      <button
        v-if="selectedIcon"
        @click.prevent="onInsert(selectedIcon.path)"
        style="float: right; margin-top: 1rem"
      >
        Inserir
      </button>
    </div>
  </div>
</template>
