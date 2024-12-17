<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue";
import * as LenzReactivity from "lenz:reactivity";
import CssNumberInput from "./components/CssNumberInput.vue";

const props = defineProps<{
  getFonts(): Promise<string[]>;
  getGoogleFontsUrls(): string[];
  getSelection(): HTMLElement[];

  onUpdateGoogleFontsUrls(fonts: string[]): void;
  onUpdateStyles(styles: Partial<CSSStyleDeclaration>): void;
}>();

const form = ref<Record<string, string>>();
const fonts = ref<string[]>([]);

const scope = LenzReactivity.createScope(() => {
  LenzReactivity.watchEffect(() => {
    const selectedElements = props.getSelection();

    if (!selectedElements.length) {
      form.value = undefined;
      return;
    }

    props.getFonts().then((list) => {
      fonts.value = list;
    });

    const style =
      selectedElements.length === 1 ? selectedElements[0].style : undefined;

    if (!style) {
      form.value = undefined;
      return;
    }

    form.value = {
      "font-family": style.fontFamily,
      "font-size": style.fontSize,
      "font-weight": style.fontWeight,
      "font-style": style.fontStyle,
      "text-transform": style.textTransform,
      "text-align": style.textAlign,
      "vertical-align": style.verticalAlign,
      "line-height": style.lineHeight,
      "letter-spacing": style.letterSpacing,
      "word-spacing": style.wordSpacing,
      "text-decoration": style.textDecoration,
    };
  });
});

watch(
  form,
  (newStyles) => {
    if (!newStyles) return;
    props.onUpdateStyles(newStyles);
  },
  { deep: true }
);

onBeforeUnmount(() => scope.dispose());

const textDecoration = computed({
  get: () => form.value?.["text-decoration"]?.split(" "),
  set: (value: string[]) => {
    if (form.value) {
      form.value["text-decoration"] = value
        .filter((value) => value && value !== "none")
        .join(" ");
    } else {
      form.value = {
        ["text-decoration"]: value
          .filter((value) => value && value !== "none")
          .join(" "),
      };
    }
  },
});

const css = computed(() => {
  return Object.entries(form.value ?? {})
    .map(([key, value]) => {
      if (!value) return "";
      return `${key}: ${value};\n`;
    })
    .join("");
});
</script>

<template>
  <div class="flex">
    <form v-if="form" @submit.prevent class="widget-layout-form flex-1">
      <fieldset>
        <legend>Fonte</legend>
        <label>
          <p>Família</p>
          <input
            type="text"
            v-model="form['font-family']"
            name="font-family"
            list="font-family-suggestions"
          />
          <datalist id="font-family-suggestions">
            <option v-for="font in fonts" :key="font" :value="font"></option>
          </datalist>
        </label>

        <label>
          <p>Tamanho:</p>
          <CssNumberInput
            v-model="form['font-size']"
            name="height"
            default-unit="px"
            placeholder="Ex: 16px"
            list="font-size-suggestions"
          />
          <datalist id="font-size-suggestions">
            <option
              v-for="i in 11"
              :key="i"
              :value="`${7 + i ** 2}px`"
            ></option>
          </datalist>
        </label>

        <label>
          <p>Peso:</p>
          <select v-model="form['font-weight']" name="font-weight">
            <option value="normal">Normal (400)</option>
            <option value="bold">Negrito (700)</option>
            <option value="bolder">Mais negrito (maior que 700)</option>
            <option value="lighter">Mais claro (menor que 400)</option>
            <option v-for="i in 9" :key="i" :value="i * 100">
              {{ i * 100 }}
            </option>
          </select>
        </label>

        <label>
          <p>Estilo:</p>
          <select v-model="form['font-style']" name="font-style">
            <option value="normal">Normal</option>
            <option value="italic">Itálico</option>
            <option value="oblique">Oblíquo</option>
          </select>
        </label>

        <label>
          <p>Transformação:</p>
          <select v-model="form['text-transform']" name="text-transform">
            <option value="none">Nenhuma</option>
            <option value="uppercase">Maiúsculas</option>
            <option value="lowercase">Minúsculas</option>
            <option value="capitalize">Capitalizada</option>
          </select>
        </label>
      </fieldset>

      <fieldset>
        <legend>Alinhamento</legend>
        <label>
          <p>Horizontal:</p>
          <select v-model="form['text-align']" name="text-align">
            <option value="left">Esquerda</option>
            <option value="center">Centro</option>
            <option value="right">Direita</option>
            <option value="justify">Justificado</option>
          </select>
        </label>

        <label>
          <p>Vertical:</p>
          <select v-model="form['vertical-align']" name="vertical-align">
            <option value="baseline">Base</option>
            <option value="sub">Subscrito</option>
            <option value="super">Sobrescrito</option>
            <option value="top">Topo</option>
            <option value="text-top">Topo do texto</option>
            <option value="middle">Meio</option>
            <option value="bottom">Fundo</option>
            <option value="text-bottom">Fundo do texto</option>
          </select>
        </label>
      </fieldset>

      <fieldset style="display: block">
        <legend>Decorações</legend>
        <label style="display: flex; align-items: center">
          <input
            type="checkbox"
            v-model="textDecoration"
            value="underline"
            name="text-decoration-line"
            style="width: min-content; margin: 0 4px 0 0"
          />
          <span class="flex-1 block">Sublinhado</span>
        </label>
        <label style="display: flex; align-items: center">
          <input
            type="checkbox"
            v-model="textDecoration"
            value="overline"
            name="text-decoration-line"
            style="width: min-content; margin: 0 4px 0 0"
          />
          <span class="flex-1 block">Sobrelinha</span>
        </label>
        <label style="display: flex; align-items: center">
          <input
            type="checkbox"
            v-model="textDecoration"
            value="line-through"
            name="text-decoration-line"
            style="width: min-content; margin: 0 4px 0 0"
          />
          <span class="flex-1 block">Riscado</span>
        </label>

        <button @click="form['text-decoration'] = 'none'">Nenhuma</button>
      </fieldset>

      <fieldset>
        <legend>Espaçamento</legend>
        <label>
          <p>Entre linhas:</p>
          <CssNumberInput
            v-model="form['line-height']"
            name="line-height"
            default-unit="px"
            placeholder="Ex: 1.5"
            list="line-height-suggestions"
          />
          <datalist id="line-height-suggestions">
            <option
              v-for="i in 11"
              :key="i"
              :value="`${(0.4 + i * 0.1).toFixed(1)}`"
            ></option>
          </datalist>
        </label>

        <label>
          <p>Entre letras:</p>
          <CssNumberInput
            v-model="form['letter-spacing']"
            name="letter-spacing"
            default-unit="px"
            placeholder="Ex: 1px"
            list="letter-spacing-suggestions"
          />
          <datalist id="letter-spacing-suggestions">
            <option v-for="i in 11" :key="i" :value="`${i}px`"></option>
          </datalist>
        </label>

        <label>
          <p>Entre palavras:</p>
          <CssNumberInput
            v-model="form['word-spacing']"
            name="word-spacing"
            default-unit="px"
            placeholder="Ex: 1px"
            list="word-spacing-suggestions"
          />
          <datalist id="word-spacing-suggestions">
            <option v-for="i in 11" :key="i" :value="`${i}px`"></option>
          </datalist>
        </label>
      </fieldset>

      <!-- <fieldset style="display: block">
      <legend>Google Fonts</legend>
      <label>
        <p>URL:</p>
        <input
          type="url"
          v-model="form.googleFontsUrl"
          name="google-fonts-url"
          placeholder="Ex: https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap"
        />
      </label>

      <ul style="padding: 0">
        <li
          v-for="font in form.googleFonts"
          :key="font"
          style="display: flex; margin-bottom: 4px"
        >
          <p class="flex-1 m-0">{{ font }}</p>
        </li>
      </ul>
    </fieldset> -->
    </form>
    <div v-else class="widget-layout-form">
      <p>Selecione um elemento para editar a fonte</p>
    </div>
    <div class="preview" style="padding: 14px">
      <fieldset>
        <legend>Código CSS</legend>
        <pre>{{ css }}</pre>
      </fieldset>
      <p>
        Aprenda mais sobre Web Fonts em
        <a
          href="https://developer.mozilla.org/pt-BR/docs/Web/CSS/font-family"
          target="_blank"
          >MDN Web Docs</a
        >
      </p>
    </div>
  </div>
</template>
