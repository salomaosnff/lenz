<script setup lang="ts">
// import * as monaco from "monaco-editor";

// const props = defineProps<{
//   language: "html" | "css" | "javascript";
//   onSave?: (value: string) => void;
// }>();

// const [modelValue, modelModifiers] = defineModel<string, "lazy">({
//   default: "",
// });

// // Habilitar IntelliSense para HTML
// monaco.languages.html.htmlDefaults.setOptions({
//   suggest: {
//     html5: true,
//   },
//   data: {
//     useDefaultDataProvider: true,
//   },
// });

// // Habilitar IntelliSense para CSS
// monaco.languages.css.cssDefaults.setOptions({
//   validate: true,
//   lint: {
//     emptyRules: "warning",
//   },
// });

// monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
//   target: monaco.languages.typescript.ScriptTarget.ES2015,
//   allowNonTsExtensions: true,
// });

// const editor = shallowRef<monaco.editor.IStandaloneCodeEditor>();
// const el = ref<HTMLElement>();

// watch(el, (container) => {
//   if (!container) return;

//   editor.value?.dispose();
//   editor.value = monaco.editor.create(container, {
//     value: modelValue.value,
//     language: props.language,
//     theme: "vs-dark",
//     minimap: { enabled: false },
//     formatOnPaste: true,
//     suggest: {
//       showStatusBar: true,
//     },
//     padding: {
//       top: 14,
//     },
//   });

//   editor.value.addAction({
//     id: "save",
//     label: "Save",
//     keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS],
//     run: () => {
//       if (modelModifiers.lazy) {
//         modelValue.value = editor.value?.getValue() ?? "";
//       }
//       props.onSave?.(modelValue.value);
//     },
//   });

//   if (!modelModifiers.lazy) {
//     editor.value.onDidChangeModelContent(() => {
//       modelValue.value = editor.value?.getValue() ?? "";
//     });
//   }
// });

// watch(modelValue, (value) => {
//   const oldValue = editor.value?.getValue();

//   if (value !== oldValue) {
//     editor.value?.setValue(value);
//   }
// });

// onBeforeUnmount(() => {
//   editor.value?.dispose();
// });
</script>
<template>
  <div ref="el"></div>
</template>
