<script setup lang="ts">
import AppCodeEditor from "../components/AppCodeEditor/AppCodeEditor.vue";

const code = ref(`
<h1>Hello, World!</h1>
`);
</script>

<template>
  <AppCodeEditor v-model.lazy="code" class="h-200" language="html" />
  <pre>{{ code }}</pre>
</template>
