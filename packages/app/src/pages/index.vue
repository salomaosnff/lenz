<script lang="ts" setup>
import UiIcon from "../../../ui/src/components/UiIcon/UiIcon.vue";
import { useEditorStore } from "../store/editor";

import newFileIcon from "lenz:icons/file_plus_outline";
import openFileIcon from "lenz:icons/folder_open_outline";

const fileIcon =
  "M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z";

import { ref } from "vue";
import UiBtn from "../../../ui/src/components/UiBtn/UiBtn.vue";

const route = useRoute();
const router = useRouter();
const editor = useEditorStore();
const commandStore = useCommandsStore();
const codeMode = ref(false);

const isMobile = ref(false);

const lockIframe = ref(false);

provide("lockIframe", {
  lockIframe,
});

const fileStore = useFileStore();

const html = computed(() => fileStore.currentFile?.text());

const settingsStore = useSettingsStore();

watch(
  () => route.query.file?.toString(),
  async (file) => {
    if (!file) {
      return;
    }

    await router.replace({ query: { ...route.query, file: undefined } });

    fileStore.openFile(file);
  },
  { immediate: true }
);

const recents = computed<
  {
    filename: string;
    name: string;
  }[]
>(() => {
  // Função para encontrar o prefixo comum
  const findCommonPrefix = (arr: string[]): string => {
    if (arr.length <= 1) return "";
    let prefix = arr[0];
    for (const str of arr) {
      while (!str.startsWith(prefix)) {
        prefix = prefix.slice(0, -1); // Remove o último caractere do prefixo
        if (prefix === "") return "";
      }
    }
    return prefix;
  };

  const commonPrefix = findCommonPrefix(fileStore.recents);

  return fileStore.recents.map((filename: string) => {
    const name =
      filename.substring(commonPrefix.length) || filename.split("/").pop();
    return {
      filename,
      name: name !== filename && name?.includes("/") ? `.../${name}` : name,
    };
  });
});
</script>
<template>
  <div
    class="w-full h-full flex flex-col"
    :class="{
      'pointer-events-none': lockIframe,
    }"
  >
    <div class="app-titlebar">
      <div class="flex gap-2 items-center">
        <div class="inline-flex gap-2 font-bold ml-2 items-center">
          <img src="/logo.png" alt="Logo" class="w-6 h-6 my-2" />
          <span>Lenz Designer</span>
        </div>
        <p>
          {{ fileStore.currentFile?.filepath }}
        </p>
        <span
          v-if="fileStore.currentFile?.dirty"
          class="w-3 h-3 bg--warning rounded-full"
          title="O arquivo foi modificado"
        ></span>
        <div class="flex-1"></div>
        <UiBtn
          class="ma-2"
          v-if="fileStore.currentFile"
          @click="codeMode = !codeMode"
        >
          <span v-if="codeMode">Modo Visual</span>
          <span v-else>Modo Código</span>
        </UiBtn>
      </div>
      <AppMenubar v-if="fileStore.currentFile" />
    </div>
    <AppCommandPalette
      class="fixed top-12 left-50% w-120 translate-x--50% z-9999"
    />
    <div
      class="app-editor-view w-full h-full relative justify-center items-center"
    >
      <div
        v-if="!fileStore.currentFile"
        class="w-full h-full flex-center bg--surface"
      >
        <div>
          <h1 class="text-8 mb-4">Bem-vindo ao Lenz Designer</h1>
          <h2 class="text-6 mb-4">Comece a Editar</h2>
          <ul class="mb-4 flex flex-col">
            <li
              class="inline-flex items-center gap-2 py-1 cursor-pointer hover:underline py-1 fg--primary"
            >
              <UiIcon :path="newFileIcon" class="text-6 w-6" />
              <a href="#" @click="commandStore.executeCommand('file.new.html')">
                Criar um novo arquivo</a
              >
            </li>
            <li
              class="inline-flex items-center gap-2 cursor-pointer hover:underline py-1 fg--primary"
              @click="commandStore.executeCommand('file.open.html')"
            >
              <UiIcon :path="openFileIcon" class="text-6 w-6" />
              <span>Abrir um arquivo existente</span>
            </li>
          </ul>
          <h2 class="text-6 mb-2">Recentes</h2>
          <ul>
            <li
              v-for="recent in recents"
              :key="recent.filename"
              :title="recent.filename"
            >
              <router-link
                :to="{ query: { file: recent.filename } }"
                class="inline-flex items-center gap-2 cursor-pointer hover:underline py-1"
              >
                <UiIcon :path="fileIcon" class="text-6" />
                <span>{{ recent.name }}</span>
              </router-link>
            </li>
          </ul>
        </div>
      </div>
      <AppCodeEditor
        v-if="codeMode"
        :modelValue="html"
        class="w-full h-full"
        language="html"
        @save="fileStore.currentFile?.save($event)"
        @update:modelValue="
          fileStore.writeFile(fileStore.currentFile?.filepath, $event)
        "
      />
      <div v-show="html" class="pa-4 h-full flex-1">
        <AppCanvas
          v-model="editor.currentDocument"
          v-model:active="editor.selectedElements"
          v-model:hover="editor.hoveredElement"
          :html="html"
          :is-mobile
          :hidden="codeMode"
          class="mx-auto h-full bg-white"
          :style="{
            maxWidth: `${settingsStore.settings.frame.width}px`,
          }"
          @dom-update="
            fileStore.currentFile &&
              fileStore.writeFile(fileStore.currentFile?.filepath, $event)
          "
        />
      </div>
    </div>
    <AppWindowManager />
  </div>
</template>
<style scoped>
.tool-grid {
  display: grid;
  width: 100%;
  grid-template-columns: repeat(auto-fill, 32px);
  gap: 0.5rem;
}

.app-editor-view {
  --s: 64px; /* control the size*/
  --c1: var(--color-surface-muted);
  --c2: var(--color-surface);

  --g: #0000 90deg, var(--c1) 0;
  background: conic-gradient(from 90deg at 2px 2px, var(--g)),
    conic-gradient(from 90deg at 1px 1px, var(--g)), var(--c2);
  background-size:
    var(--s) var(--s),
    calc(var(--s) / 5) calc(var(--s) / 5);
}

.app-titlebar {
  background: linear-gradient(to right, color-mix(in srgb, var(--color-secondary), var(--color-surface) 70%), var(--color-surface) 30%, var(--color-surface));
  border-bottom: 1px solid var(--color-surface);
}
</style>
