<script setup lang="ts">
import { defineComponent, h, ref } from "vue";

function onUiReady(parent: HTMLElement) {
  const App = defineComponent({
    setup() {
      const counter = ref(0);

      function increment() {
        counter.value++;
      }

      return () => [
        h("p", [counter.value]),
        h(
          "button",
          {
            onClick: increment,
          },
          ["Incrementar"]
        ),
      ];
    },
  });

  const app = createApp(App);

  app.mount(parent);

  return () => {
    app.unmount();
  };
}
</script>

<template>
  <UiWindow frame movable resizable title="Widget" :width="480" :height="320" closable>
    <AppWidget :widget="onUiReady" />
  </UiWindow>
</template>
