<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue";
import * as LenzReactivity from "lenz:reactivity";
import BorderConfig from "./components/BorderConfig.vue";
import CssNumberInput from "./components/CssNumberInput.vue";

const props = defineProps<{
  getSelection(): any;
  onUpdateStyle(styles: Record<string, string>): void;
}>();

const form = ref<Record<string, string>>({});

const scope = LenzReactivity.createScope(() => {
  LenzReactivity.watch(
    () => props.getSelection()[0]?.element,
    (element) => {
      console.log(element);
      form.value = {};

      (
        [
          "border",
          "border-top",
          "border-right",
          "border-bottom",
          "border-left",
          "border-radius",
          "border-top-left-radius",
          "border-top-right-radius",
          "border-bottom-right-radius",
          "border-bottom-left-radius",
        ] as any[]
      ).forEach((key) => {
        const value = element?.style.getPropertyValue(key);

        if (value) {
          form.value[key] = value;
        }
      });
    },
    { immediate: true }
  );
});

watch(
  form,
  (value) => {
    props.onUpdateStyle(value);
  },
  { deep: true }
);

onBeforeUnmount(() => {
  scope.dispose();
});

const borderRadius = ref<string>("");

function createBorderRadiusRef(key: string) {
  return computed({
    get: () => form.value[key] || form.value["border-radius"],
    set: (value: string) => {
      if (value === form.value["border-radius"]) {
        delete form.value[key];
      } else {
        form.value[key] = value;
      }
    },
  });
}

function createBorderRef(key: string) {
  return computed({
    get: () => form.value[key] || form.value["border"],
    set: (value: string) => {
      if (value === form.value["border"]) {
        delete form.value[key];
      } else {
        form.value[key] = value;
      }
    },
  });
}

const borderTopLeftRadius = createBorderRadiusRef("border-top-left-radius");
const borderTopRightRadius = createBorderRadiusRef("border-top-right-radius");
const borderBottomRightRadius = createBorderRadiusRef(
  "border-bottom-right-radius"
);
const borderBottomLeftRadius = createBorderRadiusRef(
  "border-bottom-left-radius"
);

const border = ref<string>("");

const borderTop = createBorderRef("border-top");
const borderRight = createBorderRef("border-right");
const borderBottom = createBorderRef("border-bottom");
const borderLeft = createBorderRef("border-left");

watch(borderRadius, (value) => {
  form.value["border-radius"] = value;

  delete form.value["border-top-left-radius"];
  delete form.value["border-top-right-radius"];
  delete form.value["border-bottom-right-radius"];
  delete form.value["border-bottom-left-radius"];
});

watch(border, (value) => {
  form.value["border"] = value;

  delete form.value["border-top"];
  delete form.value["border-right"];
  delete form.value["border-bottom"];
  delete form.value["border-left"];
});

const code = computed(() => {
  return Object.entries(form.value)
    .filter(([_, value]) => value)
    .map(([key, value]) => `${key}: ${value};`)
    .join("\n");
});
</script>

<template>
  <div class="flex" style="width: 100%">
    <form
      @submit.prevent
      class="widget-border-form flex-1"
      style="overflow: auto"
    >
      <fieldset>
        <legend>Bordas</legend>

        <label>
          <BorderConfig v-model="border" />
        </label>

        <details>
          <summary>Configurar borda por lado</summary>

          <fieldset>
            <legend>Superior</legend>
            <label>
              <BorderConfig v-model="borderTop" />
            </label>
          </fieldset>
          <fieldset>
            <legend>Direita</legend>
            <label>
              <BorderConfig v-model="borderRight" />
            </label>
          </fieldset>
          <fieldset>
            <legend>Inferior</legend>
            <label>
              <BorderConfig v-model="borderBottom" />
            </label>
          </fieldset>
          <fieldset>
            <legend>Esquerda</legend>
            <label>
              <BorderConfig v-model="borderLeft" />
            </label>
          </fieldset>
        </details>
      </fieldset>
      <fieldset>
        <legend>Arredondar Bordas</legend>
        <div class="flex">
          <label style="min-width: 100%">
            <CssNumberInput
              v-model="borderRadius"
              name="border-radius"
              default-unit="px"
            />
          </label>

          <details>
            <summary>Arredondar Cantos</summary>
            <div
              style="
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 4px;
                row-gap: 8px;
              "
            >
              <label>
                <p>Superior Esquerda:</p>
                <CssNumberInput
                  v-model="borderTopLeftRadius"
                  name="border-top-left-radius"
                  default-unit="px"
                />
              </label>
              <label>
                <p>Superior Direita:</p>
                <CssNumberInput
                  v-model="borderTopRightRadius"
                  name="border-top-right-radius"
                  default-unit="px"
                />
              </label>
              <label>
                <p>Inferior Esquerda:</p>
                <CssNumberInput
                  v-model="borderBottomLeftRadius"
                  name="border-bottom-left-radius"
                  default-unit="px"
                />
              </label>
              <label>
                <p>Inferior Direita:</p>
                <CssNumberInput
                  v-model="borderBottomRightRadius"
                  name="border-bottom-right-radius"
                  default-unit="px"
                />
              </label>
            </div>
          </details>
        </div>
      </fieldset>
    </form>
    <div class="preview" style="padding: 14px">
      <fieldset>
        <legend>Código SVG</legend>
        <pre>{{ code }}</pre>
      </fieldset>
      <p>
        Aprenda mais sobre Bordas em
        <a
          href="https://developer.mozilla.org/pt-BR/docs/Web/CSS/border"
          target="_blank"
          >MDN Web Docs</a
        >
      </p>
      <p>
        Veja também sobre Bordas Arredondadas em
        <a
          href="https://developer.mozilla.org/pt-BR/docs/Web/CSS/border-radius"
          target="_blank"
          >MDN Web Docs</a
        >
      </p>
    </div>
  </div>
</template>
