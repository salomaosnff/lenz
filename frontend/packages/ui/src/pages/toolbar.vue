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
  <div class="bg--surface rounded-md pa-2">
    <ul>
      <li v-for="tool in tools" :key="tool.id" @click="activeTool = tool.id"
        class="cursor-pointer flex items-center pa-2 gap-2 hover:bg--background rounded-md" :class="{
          'bg--primary!': activeTool === tool.id,
        }">
        <UiIcon :path="tool.icon" />
        <span>{{ tool.title }}</span>
      </li>
    </ul>
  </div>
</template>