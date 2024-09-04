<script setup lang="ts">
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
        background: linear-gradient(to left, #000 50%, #fff 50%);
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

const hover = ref<HTMLElement>();
const activeEl = ref<HTMLElement>();

watch(hover, (el) => console.log(el));
watch(activeEl, (el) => console.log(el));
</script>

<template>
  <div>
    <AppCanvas
      v-model:active-el="activeEl"
      v-model:hover-el="hover"
      v-model:html="html"
      class="!bg-white w-200 h-200 mt-20"
    />
    <UiTextField v-model="html" multiline />
    <AppWindow visible :html />
  </div>
</template>
