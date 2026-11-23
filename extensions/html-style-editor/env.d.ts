/// <reference types="lenz-sdk/globals" />

declare module "*.vue" {
  import type { DefineComponent } from "vue";
  const component: DefineComponent<{}, {}, unknown>;
  export default component;
}

declare module "*.css?inline" {
  const css: string;
  export default css;
}
