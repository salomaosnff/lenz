import "uno.css";
import * as lenz from "lenz";
import "./style.css";

import { createPinia } from "pinia";
import { createApp } from "vue";
import App from "./App.vue";


const app = createApp(App).use(createPinia());

app.mount("#app");

lenz.extensions.init()
