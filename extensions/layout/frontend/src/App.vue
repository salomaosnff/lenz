<script setup lang="ts">
import { computed, ref, watch, watchEffect } from "vue";

import CssNumberInput from "./components/CssNumberInput.vue";
import * as LenzReactivity from "lenz:reactivity";

const props = defineProps<{
  getData: () => {
    result: LenzReactivity.Ref<any>;
    selection: LenzReactivity.Ref<{ element: HTMLElement; selector: string }[]>;
    parentElement: LenzReactivity.Ref<HTMLElement | undefined>;
  };
}>();

const { result, selection, parentElement } = props.getData();

const form = ref<Record<string, string | undefined>>({});
const parentStyle = ref<CSSStyleDeclaration | undefined>();

function updateParent() {
  if (!parentElement.value) {
    parentStyle.value = undefined;
    return;
  }

  parentStyle.value = parentElement.value.style;
}

function updateSelection() {
  const style = selection.value[0]?.element.style;

  if (!style) {
    form.value = {};
    return;
  }

  form.value = {
    display: style.getPropertyValue("display") || undefined,
    order: style.getPropertyValue("order") || undefined,
    "flex-direction": style.getPropertyValue("flex-direction") || undefined,
    "flex-wrap": style.getPropertyValue("flex-wrap") || undefined,
    "justify-content": style.getPropertyValue("justify-content") || undefined,
    "align-items": style.getPropertyValue("align-items") || undefined,
    gap: style.getPropertyValue("gap") || undefined,
    "flex-grow": style.getPropertyValue("flex-grow") || undefined,
    "flex-shrink": style.getPropertyValue("flex-shrink") || undefined,
    "flex-basis": style.getPropertyValue("flex-basis") || undefined,
    "grid-template-areas":
      style.getPropertyValue("grid-template-areas") || undefined,
    "grid-template-columns":
      style.getPropertyValue("grid-template-columns") || undefined,
    "grid-area": style.getPropertyValue("grid-area") || undefined,
  };
}

LenzReactivity.watch(selection, updateSelection, { immediate: true });
LenzReactivity.watch(parentElement, updateParent, { immediate: true });

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

const isFlex = computed(
  () => form.value.display === "flex" || form.value.display === "inline-flex"
);
const isGrid = computed(
  () => form.value.display === "grid" || form.value.display === "inline-grid"
);

const gridColumnType = computed({
  get() {
    if (!isGrid.value) return "";
    if (form.value["grid-template-areas"]) return "template-areas";
    if (
      typeof gridTemplateColumnsMin.value === "string" &&
      gridTemplateColumnsMin.value
    )
      return "minmax";

    if (gridColumnRepeatCount.value) {
      return "fixed";
    }

    return "custom";
  },
  set(value: string) {
    form.value["grid-template-columns"] = undefined;
    form.value["grid-template-areas"] = undefined;

    if (value === "template-areas") {
      form.value["grid-template-areas"] = [
        '"cabecalho cabecalho cabecalho"',
        '"principal principal lateral"',
        '"rodape rodape rodape"',
      ].join("\n");
      return;
    }

    if (value === "fixed") {
      form.value["grid-template-columns"] = "repeat(12, 1fr)";
      return;
    }

    if (value === "minmax") {
      form.value["grid-template-columns"] =
        "repeat(auto-fill, minmax(100px, 1fr))";
      return;
    }

    if (value === "custom") {
      form.value["grid-template-columns"] = "1fr 1fr 1fr";
      return;
    }
  },
});

const gridColumnRepeatCount = computed({
  get() {
    const match =
      form.value["grid-template-columns"]?.match(/repeat\((.+?),.+?\)/);

    if (!match) return "";
    if (/^\d+$/.test(match[1])) return parseInt(match[1]);

    return match[1];
  },
  set(value: number) {
    if (!form.value["grid-template-columns"]) {
      if (typeof value === "number") {
        form.value["grid-template-columns"] = `repeat(${value}, 1fr)`;
      } else {
        form.value["grid-template-columns"] =
          `repeat(auto-fill, minmax(100px, 1fr))`;
      }
    } else {
      form.value["grid-template-columns"] = form.value[
        "grid-template-columns"
      ].replace(/repeat\(.+?,/, `repeat(${value},`);
    }
  },
});

const gridTemplateColumnsMin = computed({
  get() {
    const match = form.value["grid-template-columns"]?.match(
      /repeat\(.+?,\s*minmax\(\s*(.+?),/
    );

    if (!match) return "";

    return match[1];
  },
  set(value: string) {
    if (
      !form.value["grid-template-columns"] ||
      !form.value["grid-template-columns"].includes("minmax")
    ) {
      form.value["grid-template-columns"] =
        `repeat(auto-fill, minmax(${value}, 1fr))`;
    } else {
      form.value["grid-template-columns"] = form.value[
        "grid-template-columns"
      ].replace(/minmax\(\s*.+?,/, `minmax(${value},`);
    }
  },
});

const gridTemplateColumnsMax = computed({
  get() {
    const match = form.value["grid-template-columns"]?.match(
      /repeat\(.+?,\s*minmax\(.+?,\s*(.+?)\)/
    );

    if (!match) return "";

    return match[1];
  },
  set(value: string) {
    if (
      !form.value["grid-template-columns"] ||
      !form.value["grid-template-columns"].includes("minmax")
    ) {
      form.value["grid-template-columns"] =
        `repeat(auto-fill, minmax(100px, ${value}))`;
    } else {
      form.value["grid-template-columns"] = form.value[
        "grid-template-columns"
      ].replace(
        /minmax\(.+?,\s*.+?\)/,
        `minmax(${gridTemplateColumnsMin.value}, ${value})`
      );
    }
  },
});

const gridAreas = computed(() => {
  let gridTemplateAreas = parentStyle.value?.getPropertyValue(
    "grid-template-areas"
  ) as string;

  if (!parentStyle.value || !gridTemplateAreas) {
    return [];
  }

  const areas = new Set<string>();

  while (gridTemplateAreas) {
    const match = gridTemplateAreas.match(/"(.+?)"/);

    if (!match) break;

    gridTemplateAreas = gridTemplateAreas.substring(
      (match.index ?? 0) + match[0].length
    );

    for (const area of match[1].trim().split(" ")) {
      if (!area || area === ".") continue;

      areas.add(area);
    }
  }

  return Array.from(areas);
});

const isParentFlex = computed(() => {
  return (
    parentStyle.value &&
    (parentStyle.value.display === "flex" ||
      parentStyle.value.display === "inline-flex")
  );
});

const isParentGrid = computed(() => {
  return (
    parentStyle.value &&
    (parentStyle.value.display === "grid" ||
      parentStyle.value.display === "inline-grid")
  );
});

watchEffect(() => {
  if (isGrid.value) {
    form.value["flex-grow"] = undefined;
    form.value["flex-shrink"] = undefined;
    form.value["flex-basis"] = undefined;
    form.value["flex-direction"] = undefined;
    form.value["flex-wrap"] = undefined;
  } else if (isFlex.value) {
    form.value["grid-template-areas"] = undefined;
    form.value["grid-template-columns"] = undefined;
  }
});

const prettyGridTemplateAreas = computed({
  get() {
    if (!form.value["grid-template-areas"]) return "";

    return form.value["grid-template-areas"].replace(/"\s+"/gim, '"\n"');
  },
  set(value: string) {
    form.value["grid-template-areas"] = value;
  },
});
</script>

<template>
  <form @submit.prevent class="widget-layout-form">
    <!-- Grupo de Exibição -->
    <fieldset>
      <legend>Exibição</legend>
      <label>
        <p>Tipo de layout:</p>
        <select v-model="form.display" name="display">
          <option :value="undefined">Nenhum</option>
          <option value="flex">Flex em bloco</option>
          <option value="inline-flex">Flex em linha</option>
          <option value="grid">Grid em bloco</option>
          <option value="inline-grid">Grid em linha</option>
        </select>
      </label>

      <label v-if="(isParentFlex || isParentGrid) && !gridAreas.length">
        <p>Ordem:</p>
        <CssNumberInput
          v-model="form.order"
          name="order"
          placeholder="Ex: 0, 1, 2"
        />
      </label>

      <label v-if="isParentGrid && gridAreas.length">
        <p>Área do grid:</p>
        <select v-model="form['grid-area']" name="grid-area">
          <option :value="undefined">Nenhuma</option>
          <option v-for="area in gridAreas" :value="area">{{ area }}</option>
        </select>
      </label>

      <template v-if="isFlex">
        <label>
          <p>Direção dos itens:</p>
          <select v-model="form['flex-direction']" name="flex-direction">
            <option :value="undefined">Nenhum</option>
            <option value="row">Horizontal</option>
            <option value="row-reverse">Horizontal (Invertido)</option>
            <option value="column">Vertical</option>
            <option value="column-reverse">Vertical (Invertido)</option>
          </select>
        </label>

        <label>
          <p>Quebra de linha</p>
          <select v-model="form['flex-wrap']" id="flex-wrap" name="flex-wrap">
            <option :value="undefined">Nenhum</option>
            <option value="nowrap">Não quebrar</option>
            <option value="wrap">Quebrar</option>
            <option value="wrap-reverse">Quebrar (Invertido)</option>
          </select>
        </label>
      </template>
    </fieldset>

    <template v-if="isFlex || isGrid">
      <!-- Grupo de Alinhamento -->
      <fieldset>
        <legend>Espaçamento e Alinhamento</legend>
        <label>
          <p>Distribuição:</p>
          <select v-model="form['justify-content']" name="justify-content">
            <option selected disabled>Selecione</option>
            <option value="flex-start">No início</option>
            <option value="flex-end">No fim</option>
            <option value="center">No centro</option>
            <option value="space-between">Espaço entre os itens</option>
            <option value="space-around">Espaço ao redor dos itens</option>
            <option value="space-evenly">Espaços iguais entre os itens</option>
            <option :value="undefined">Nenhum</option>
          </select>
        </label>

        <label>
          <p>Alinhamento:</p>
          <select v-model="form['align-items']" name="align-items">
            <option selected disabled>Selecione</option>
            <option value="stretch">Preencher</option>
            <option value="flex-start">No topo</option>
            <option value="flex-end">Embaixo</option>
            <option value="center">No centro</option>
            <option value="baseline">
              Alinhar pela linha de base do texto
            </option>
            <option :value="undefined">Nenhum</option>
          </select>
        </label>

        <label>
          <p>Espaço entre os itens:</p>
          <CssNumberInput v-model="form.gap" default-unit="px" />
        </label>
      </fieldset>
    </template>

    <!-- Grupo de Itens Flex -->
    <fieldset v-if="isParentFlex">
      <legend>Tamanho</legend>

      <label for="flex-grow">
        <p>Esticar:</p>
        <CssNumberInput
          v-model="form['flex-grow']"
          name="flex-grow"
          placeholder="Ex: 1, 2, 3"
        />
      </label>

      <label for="flex-shrink">
        <p>Encolher:</p>
        <CssNumberInput
          v-model="form['flex-shrink']"
          name="flex-shrink"
          placeholder="Ex: 0, 1, 2"
        />
      </label>

      <label for="flex-basis">
        <p>Tamanho mínimo:</p>
        <input
          type="text"
          v-model="form['flex-basis']"
          name="flex-basis"
          placeholder="Ex: auto, 100px"
        />
      </label>
    </fieldset>

    <fieldset v-if="isGrid">
      <legend>Colunas</legend>
      <label>
        <p>Tipo:</p>
        <select v-model="gridColumnType" name="grid-column-type">
          <option value="fixed">Quantidade fixa</option>
          <option value="minmax">Largura dinâmica</option>
          <option value="template-areas">Template de áreas</option>
          <option value="custom">Personalizado</option>
        </select>
      </label>

      <label v-if="gridColumnType === 'fixed'">
        <p>Quantidade:</p>
        <input
          type="number"
          v-model="gridColumnRepeatCount"
          placeholder="Ex: 1, 2, 3"
          name="grid-column-repeat-count"
          min="1"
        />
      </label>

      <template v-if="gridColumnType === 'minmax'">
        <label>
          <p>Ajustar colunas:</p>
          <select
            v-model="gridColumnRepeatCount"
            name="grid-template-columns-min"
          >
            <option value="auto-fill">Não esticar colunas</option>
            <option value="auto-fit">Esticar colunas</option>
          </select>
        </label>

        <div class="flex">
          <label>
            <p>Tamanho mínimo:</p>
            <CssNumberInput
              v-model="gridTemplateColumnsMin"
              name="grid-template-columns-min"
              default-unit="px"
            />
          </label>

          <label>
            <p>Tamanho máximo:</p>
            <CssNumberInput
              v-model="gridTemplateColumnsMax"
              name="grid-template-columns-max"
              default-unit="px"
            />
          </label>
        </div>
      </template>
      <label v-if="gridColumnType === 'template-areas'" class="full-width">
        <p>Template de colunas:</p>
        <textarea
          v-model="prettyGridTemplateAreas"
          name="grid-template-columns"
          :placeholder="`Ex:\ncabecalho cabecalho cabecalho\nprincipal principal lateral`"
          rows="3"
        ></textarea>
      </label>

      <label v-if="gridColumnType === 'custom'" class="full-width">
        <p>Colunas:</p>
        <input
          type="text"
          v-model="form['grid-template-columns']"
          name="grid-template-columns"
          placeholder="Ex: 1fr 2fr 1fr"
        />
      </label>
    </fieldset>
    <div class="preview">
      <fieldset>
        <legend>Código CSS</legend>
        <pre>{{ css }}</pre>
      </fieldset>
      <p v-if="isFlex">
        Aprenda mais sobre Flexbox em <br />
        <a
          href="https://developer.mozilla.org/pt-BR/docs/Learn/CSS/CSS_layout/Flexbox"
          target="_blank"
          rel="noopener"
          >MDN Web Docs</a
        >
      </p>
      <p v-if="isGrid">
        Aprenda mais sobre Grids em <br />
        <a
          href="https://developer.mozilla.org/pt-BR/docs/Web/CSS/CSS_grid_layout/Basic_concepts_of_grid_layout"
          target="_blank"
          rel="noopener"
          >MDN Web Docs</a
        >
      </p>
    </div>
  </form>
</template>
