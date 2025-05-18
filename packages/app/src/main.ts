import "@unocss/reset/tailwind-compat.css";
import "uno.css";
import './components/AppCodeEditor/worker'

import "./style.css";

import { Component, createApp } from "vue";
import { createRouter, createWebHistory } from "vue-router";
import { routes } from "vue-router/auto-routes";

import { createPinia } from "pinia";
import App from "./App.vue";

window.moveTo(0, 0);
window.resizeTo(window.screen.availWidth, window.screen.availHeight);

const router = createRouter({
  history: createWebHistory(),
  routes,
});

createApp(App).use(createPinia()).use(router).mount("#app");

Object.defineProperty(window, "__LENZ_VUE_COMPONENTS__", {
  value: Object.fromEntries(
    Object.entries(import.meta.glob<{
      default: Component & { __name: string };
    }>("../../ui/src/components/**/*.vue", { eager: true })).map(([path, component]) => {
      return [
        component.default.__name ?? /([^/]+)\.vue$/.exec(path)?.[1] ?? "Unknown",
        component.default
      ];
    })
  ),
});

document.addEventListener("keydown", (e) => {
  e.preventDefault();
}, { capture: true });