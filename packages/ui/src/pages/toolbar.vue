<script lang="ts" setup>
import { ref } from 'vue';

const tools: Array<{
  id: string;
  icon: string;
  title: string;
}> = [
    {
      id: 'cursor',
      title: 'Seleção',
      icon: 'mdiCursorDefault',
    },
    {
      id: 'insert.html',
      title: 'Inserir HTML',
      icon: 'mdiLanguageHtml5',
    },
    {
      id: 'edit.style',
      title: 'Editar CSS',
      icon: 'mdiLanguageCss3',
    }
  ]

const activeTool = ref(tools[0].id)
</script>
<template>
  <UiMenuBar />
</template>