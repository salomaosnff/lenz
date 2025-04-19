import { defineConfig } from "vitepress";

// refer https://vitepress.dev/reference/site-config for details
export default defineConfig({
  lang: "pt-BR",
  title: "Lenz Designer",
  description: "API de extensões do Lenz",
  base: process.env.NODE_ENV === "production" ? "/lenz/" : "/",
  themeConfig: {
    logo: "/logo.png",
    nav: [
      { text: "Instalação", link: "/install" },
      { text: "Documentação", link: "/docs" },

      // {
      //   text: 'Dropdown Menu',
      //   items: [
      //     { text: 'Item A', link: '/item-1' },
      //     { text: 'Item B', link: '/item-2' },
      //     { text: 'Item C', link: '/item-3' },
      //   ],
      // },

      // ...
    ],

    socialLinks: [
      {
        icon: "github",
        link: "https://github.com/salomaosnff/lenz",
      },
    ],

    footer: {
      message: "Desenvolvido sob a licença MIT",
      copyright: "Copyright © 2024-presente por Salomão Neto e contribuidores",
    },

    sidebar: {
      "/docs": [
        {
          text: "Guia do Desenvolvedor",
          items: [
            {
              text: "Apresentação",
              link: "/docs",
            },
            {
              text: "Conceitos Fundamentais",
              link: "/docs/concepts",
            },
            {
              text: "Criando Extensões",
              link: "/docs/extensions",
              items: [
                {
                  text: "Comandos",
                  link: "/docs/commands",
                },
                {
                  text: "Barra de menus",
                  link: "/docs/menubar",
                },
                {
                  text: "Comandos do Agente",
                  link: "/docs/agent-commands",
                },
                {
                  text: "Publicando Extensões",
                  link: "/docs/publishing-extensions",
                },
              ],
            },
          ],
        },
        {
          text: 'Referência da API',
          items: [
            {
              text: 'Módulos do Core',
              link: '/api/modules/commands',
            },
            {
              text: 'Extensões Embutidas',
              link: '/api/built-in/fs',
            },
          ],
        }
      ],
      "/api/": [
        {
          text: "Módulos do Core",
          items: [
            {
              text: "commands",
              link: "/api/modules/commands",
            },
            {
              text: "dialog",
              link: "/api/modules/dialog",
            },
            {
              text: "file",
              link: "/api/modules/file",
            },
            {
              text: "history",
              link: "/api/modules/history",
            },
            {
              text: "hooks",
              link: "/api/modules/hooks",
            },
            {
              text: "hotkeys",
              link: "/api/modules/hotkeys",
            },
            {
              text: "invoke",
              link: "/api/modules/invoke",
            },
            {
              text: "menubar",
              link: "/api/modules/menubar",
            },
            {
              text: "reactivity",
              link: "/api/modules/reactivity",
            },
            {
              text: "ui",
              link: "/api/modules/ui",
            },
            {
              text: "util",
              link: "/api/modules/util",
            },
          ],
        },
        {
          text: "Extensões Embutidas",
          items: [
            {
              text: "fs",
              link: "/api/built-in/fs",
            },
          ],
        },
      ],
    },
  },
});
