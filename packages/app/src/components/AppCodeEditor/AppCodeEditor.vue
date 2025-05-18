<script setup lang="ts">
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { expand as expandAbbreviation } from '@emmetio/expand-abbreviation';

const props = defineProps<{
  language: "html" | "css" | "javascript" | "typescript";
  onSave?: (value: string) => void;
}>();

const [modelValue, modelModifiers] = defineModel<string, "lazy">({
  default: "",
});

const editor = shallowRef<monaco.editor.IStandaloneCodeEditor>();
const el = ref<HTMLElement>();

monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
  allowNonTsExtensions: true,
  noLib: true,
  target: monaco.languages.typescript.ScriptTarget.ES2015,
  lib: ["es6"]
});

monaco.languages.html.htmlDefaults.setOptions({
  suggest: {
    html5: true,
    autoClosingTags: true,
  },
  data: {
    useDefaultDataProvider: true
  }
});



watch(el, (container) => {
  if (!container) return;

  editor.value?.dispose();
  editor.value = monaco.editor.create(container, {
    value: modelValue.value,
    language: props.language,
    theme: "vs-dark",
    minimap: { enabled: true },
    formatOnPaste: true,
    suggest: {
      showStatusBar: true,
    },
    padding: {
      top: 14,
    },
    inlineSuggest: {
      enabled: true,
    },
  });

  editor.value.addAction({
    id: "save",
    label: "Save",
    keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS],
    run: () => {
      if (modelModifiers.lazy) {
        modelValue.value = editor.value?.getValue() ?? "";
      }
      props.onSave?.(modelValue.value);
    },
  });

  editor.value.addAction({
    id: "expand-abbreviation",
    label: "Expand Abbreviation",
    keybindings: [monaco.KeyCode.Tab],
    run: async (ed) => {
      const model = ed.getModel()!;
      const position = ed.getPosition()!;
      // Pega a linha toda até o cursor
      const lineContent = model.getLineContent(position.lineNumber);
      const abbr = lineContent.slice(0, position.column - 1);

      if (!abbr.trim()) return;

      // Calcula o range da expressão
      const range = new monaco.Range(
        position.lineNumber,
        1,
        position.lineNumber,
        position.column
      );

      const abbreviation = model.getValueInRange(range);
      if (!abbreviation.trim()) return;

      console.log('Expanding abbreviation:', abbreviation);

      try {
        const expanded = expandAbbreviation(abbreviation, { syntax: 'html' });
        ed.executeEdits('emmet', [
          {
            range,
            text: expanded,
            forceMoveMarkers: true,
          },
        ]);

        ed.getAction('editor.action.formatDocument')?.run();
      } catch (err) {
        console.warn('Erro ao expandir Emmet:', err);
      }
    },
  });

  if (!modelModifiers.lazy) {
    editor.value.onDidChangeModelContent(() => {
      modelValue.value = editor.value?.getValue() ?? "";
    });
  }
});

watch(modelValue, (value) => {
  const oldValue = editor.value?.getValue();

  if (value !== oldValue) {
    editor.value?.setValue(value);
  }
});

onBeforeUnmount(() => {
  editor.value?.dispose();
});
</script>
<template>
  <div ref="el"></div>
</template>
