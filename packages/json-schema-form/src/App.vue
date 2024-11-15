<script setup lang="ts">
import { ref } from "vue";
import JsonForm from "./components/JsonForm.vue";
import schema from "./form.json";

const value = ref({})
</script>

<template>
  <JsonForm v-model="value"  :schema="schema" />
  <pre>{{ value }}</pre>
</template>
