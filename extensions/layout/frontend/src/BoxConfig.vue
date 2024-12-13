<script setup lang="ts">
import { computed, ref, watch } from "vue";

import CssNumberInput from "./components/CssNumberInput.vue";
import * as LenzReactivity from "lenz:reactivity";
import BorderConfig from "./components/BorderConfig.vue";
import SpacingConfig from "./components/SpacingConfig.vue";

const props = defineProps<{
  getData: () => {
    result: LenzReactivity.Ref<any>;
    selection: LenzReactivity.Ref<{ element: HTMLElement; selector: string }[]>;
  };
}>();

const { result, selection } = props.getData();

const form = ref<Record<string, string | undefined>>({});

function updateSelection() {
  const style = selection.value[0]?.element.style;

  if (!style) {
    form.value = {};
    return;
  }

  form.value = {
    width: style.getPropertyValue("width") || undefined,
    height: style.getPropertyValue("height") || undefined,
    margin: style.getPropertyValue("margin") || undefined,
    padding: style.getPropertyValue("padding") || undefined,
    border: style.getPropertyValue("border") || undefined,
    "aspect-ratio": style.getPropertyValue("aspect-ratio") || undefined,
  };
}

LenzReactivity.watch(selection, updateSelection, { immediate: true });

let timer: number | undefined;

function debouncedSend() {
  clearTimeout(timer);
  timer = setTimeout(() => {
    result.value = {
      ...form.value,
    };
  }, 1000 / 30);
}

watch(form, debouncedSend, { deep: true });

const css = computed(() => {
  return Object.entries(form.value)
    .map(([key, value]) => {
      if (!value) return "";
      return `${key}: ${value};\n`;
    })
    .join("");
});
</script>

<template>
  <form @submit.prevent class="widget-layout-form">
    <!-- Grupo de dimensões -->
    <fieldset>
      <legend>Dimensões do elemento</legend>
      <label>
        <p>Largura:</p>
        <CssNumberInput v-model="form.width" name="width" default-unit="px" />
      </label>

      <label>
        <p>Altura:</p>
        <CssNumberInput v-model="form.height" name="height" default-unit="px" />
      </label>

      <label>
        <p>Proporção:</p>
        <input
          type="text"
          v-model="form['aspect-ratio']"
          name="aspect-ratio"
          placeholder="Ex: 1/1, 4/3, 16/9"
        />
      </label>
    </fieldset>

    <!-- Grupo de Borda -->
    <fieldset>
      <legend>Borda</legend>

      <BorderConfig v-model="form.border" />

      <details>
        <summary>Bordas individuais:</summary>
        <fieldset>
          <legend>Borda superior</legend>
          <BorderConfig v-model="form['border-top']" />
        </fieldset>

        <fieldset>
          <legend>Borda direita</legend>
          <BorderConfig v-model="form['border-right']" />
        </fieldset>

        <fieldset>
          <legend>Borda inferior</legend>
          <BorderConfig v-model="form['border-bottom']" />
        </fieldset>

        <fieldset>
          <legend>Borda esquerda</legend>
          <BorderConfig v-model="form['border-left']" />
        </fieldset>
      </details>
    </fieldset>

    <!-- Grupo de Margem -->
    <fieldset>
      <legend>Margem</legend>

      <SpacingConfig v-model="form.margin" />
    </fieldset>

    <!-- Grupo de Preenchimento -->
    <fieldset>
      <legend>Preenchimento</legend>

      <SpacingConfig v-model="form.padding" />
    </fieldset>
    <div class="preview">
      <fieldset>
        <legend>Código CSS</legend>
        <pre>{{ css }}</pre>
      </fieldset>
    </div>
  </form>
</template>
