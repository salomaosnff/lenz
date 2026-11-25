import "uno.css";
import "./scrollbar.css";

import * as Vue from "vue";
import { createApp } from "vue";
import { createPinia } from "pinia";

import App from "./App.vue";
import router from "./router";
import { loadInstalledExtensions } from "./extensions";
import Icon from "./components/Icon.vue";
import { registerBuiltinEditors } from "./editor/builtin";
import { registerIcons } from "./icons";
import { installKeybindings, loadUserKeybindings } from "./keybindings";
import { useWorkspaceStore } from "./fs/workspace";
import { installAutosave } from "./editor/autosave";
import { installAgentTools } from "./agent-tools";

// Extensions import `vue` through the import map in index.html, which points at
// /host/vue.js. That module re-exports this instance, so both sides share one Vue.
(window as unknown as { __lenz_vue: typeof Vue }).__lenz_vue = Vue;

const app = createApp(App);

// Global, so extension components can use <Icon /> without importing it.
app.component("Icon", Icon);
void registerIcons();
registerBuiltinEditors();

app.use(createPinia());
app.use(router);

// Opens the project in the background; the explorer shows it as soon as it is there.
void useWorkspaceStore().init();
installAutosave();

loadUserKeybindings();
installKeybindings();
installAgentTools();
app.mount("#app");
await loadInstalledExtensions();
