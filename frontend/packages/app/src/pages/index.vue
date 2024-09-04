<script lang="ts" setup>
import icon_cellphone from 'lenz:icons/cellphone';
import icon_code_tags from 'lenz:icons/code_tags';
import icon_image from 'lenz:icons/image';
import icon_monitor from 'lenz:icons/monitor';
import icon_text from 'lenz:icons/text';
import icon_tools from 'lenz:icons/tools';
import icon_view_dashboard from 'lenz:icons/view_dashboard';

import { invoke } from 'lenz:invoke';

import { ref } from "vue";
import AppPanel from "../components/AppPanel.vue";

invoke('readFile', {});

interface MenuItem {
  id: string;
  icon?: string
  title: string;
  color?: string;
  children?: MenuItem[];
}

const items: MenuItem[] = [
  {
    id: "create.text",
    icon: icon_text,
    title: "Texto",
    children: [
      {
        id: "create.text.paragraph",
        title: "Parágrafo",
      },
      {
        id: "create.text.heading",
        title: "Título",
      },
    ],
  },
  {
    id: "create.image",
    icon: icon_image,
    title: "Imagem",
    children: [
      {
        id: "create.image.upload",
        title: "Nova imagem",
      },
      {
        id: "create.image.existing",
        title: "Adicionar imagem existente",
      },
      {
        id: "create.image.url",
        title: "Adicionar imagem por URL",
      },
    ],
  },
  {
    id: "create.layout",
    icon: icon_view_dashboard,
    title: "Layout",
    children: [
      {
        id: "create.layout.flex",
        title: "Flex Layout",
      },
      {
        id: "create.layout.grid",
        title: "Grid Layout",
      },
      {
        id: "create.layout.table",
        title: "Tabela",
      },
    ],
  },
  {
    id: "create.advanced",
    icon: icon_code_tags,
    title: "Código",
    children: [
      {
        id: "create.advanced.outerHtml",
        title: "Editar HTML do elemento",
        icon: "mdiLanguageHtml5",
      },
      {
        id: "create.advanced.style",
        title: "Editar CSS do elemento",
        icon: "mdiLanguageCss3",
      },
      {
        id: "create.advanced.inspector",
        title: "Inspecionar Árvore de Elementos",
        icon: "mdiFileTree",
      },
    ],
  },
];

const menuPath = ref<MenuItem[]>([items[0]]);
const isMobile = ref(false);

const html = ref(`
<!doctype html>
<html lang="pt-BR">

<head>
  <meta charset="UTF-8" />
  <link rel="icon" type="image/svg+xml" href="/vite.svg" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Page</title>

  <style>
  * {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  }
    html, body {
        width: 100%;
        height: 100%;
    }

    #bg {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: -1;
    }

    .content{
        position: relative;
        z-index: 1;
        display: grid;
        place-items:center;
        height: 100vh;
    }
  </style>
</head>

<body>
<div>
    <div>
        <p>
            <em>
                <span>Ok</span>
            </em>
        </p>
    </div>
</div>
<div id="bg"></div>
  <div class="content">
    <h1>Hello <span>World</span>!</h1>
    <p>Eu sou um parágrafo</p>
    <img width="50%" src="https://platinumlist.net/guide/wp-content/uploads/2023/03/8359_img_worlds_of_adventure-big1613913137.jpg-1024x683.webp" />
  </div>
</body>

</html>
`);

const lockIframe = ref(false);

provide("lockIframe", {
  lockIframe,
});

</script>
<template>
  <div class="w-full h-full flex flex-col pa-2 gap-2">
    <AppPanel class="shadow-lg">
      <div>
        <UiOverlayMenu origin="bottom-start">
          <template #activator="{ attrs }">
            <UiBtn v-bind="attrs" icon flat class="h-8">
              <UiIcon :path="icon_tools" />
            </UiBtn>
          </template>

          <UiPopup class="!pa-0 flex">
            <div class="pa-2 bg--surface2 rounded-l-md">
              <h3 class="font-bold text-5 pa-2 inline-flex items-center gap-2 mr-4">
                <UiIcon :path="icon_monitor" class="text-5" />
                <span>Ferramentas</span>
              </h3>

              <UiTextField type="search" placeholder="Pesquisar" class="mb-4" />

              <ul>
                <li
v-for="item in items" :key="item.id"
                  class="flex w-max rounded-full gap-2 py-2 px-4 text-3 items-center mb-2 cursor-pointer hover:bg--surface-muted"
                  :class="{
                    'bg--surface-primary!': menuPath.includes(item),
                  }" @pointerenter="menuPath.splice(0, menuPath.length, item)">
                  <UiIcon v-if="item.icon" :path="item.icon" class="text-4" />
                  <span>{{ item.title }}</span>
                </li>
              </ul>
            </div>
            <ul class="pa-4 min-w-60">
              <h3 class="font-bold text-5 mb-2 inline-flex items-center gap-1 mr-4">
                <UiIcon :path="menuPath[0]?.icon" />
                <span>{{ menuPath[0]?.title }}</span>
              </h3>

              <template v-for="item in menuPath[0]?.children" :key="item">
                <template v-if="item.children?.length">
                  <li>
                    <p class="uppercase opacity-50 text-3 mb-2 font-bold">
                      {{ item.title }}
                    </p>
                    <ul>
                      <li
v-for="child in item.children" :key="child.id"
                        class="flex w-max rounded-full gap-2 py-2 px-4 text-3 items-center mb-2 cursor-pointer hover:bg--surface-muted"
                        :class="{
                          'bg--surface-primary!': menuPath.includes(child),
                        }" @click="
                          menuPath.splice(1, menuPath.length - 1, item, child)
                          ">
                        <UiIcon v-if="item.icon" :path="item.icon" class="text-4" />

                        <span>{{ child.title }}</span>
                      </li>
                    </ul>
                  </li>
                </template>
                <template v-else>
                  <li
                    class="flex w-max rounded-full gap-2 py-2 px-4 text-3 items-center mb-2 cursor-pointer hover:bg--surface-muted"
                    :class="{
                      'bg--surface-primary!': menuPath.includes(item),
                    }" @click="menuPath.splice(1, menuPath.length - 1, item)">
                    <UiIcon v-if="item.icon" :path="item.icon" class="text-4" />
                    <span>{{ item.title }}</span>
                  </li>
                </template>
              </template>
            </ul>
          </UiPopup>
        </UiOverlayMenu>

        <UiBtn icon flat class="h-8" @click="isMobile = !isMobile">
          <UiIcon :path="isMobile ? icon_monitor : icon_cellphone" />
        </UiBtn>
      </div>
    </AppPanel>
    <div class="w-full flex-1 gap-2 relative justify-center items-center">
      <AppCanvas
v-model:html="html" :is-mobile class="mx-auto h-full bg-white" :class="{
        'pointer-events-none': lockIframe,
      }" />
    </div>

    <AppWindow html="<h1 style='color: white'>Sou uma Janela :)</h1>" />
  </div>
</template>
<style scoped>
.tool-grid {
  display: grid;
  width: 100%;
  grid-template-columns: repeat(auto-fill, 32px);
  gap: 0.5rem;
}
</style>
