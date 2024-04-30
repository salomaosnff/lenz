import "uno.css";
import "./style.css";

import * as lenz from "@lenz/api";
import { createPinia } from "pinia";
import { createApp } from "vue";
import App from "./App.vue";


const app = createApp(App).use(createPinia());

app.mount("#app");

lenz.extensions.activate()