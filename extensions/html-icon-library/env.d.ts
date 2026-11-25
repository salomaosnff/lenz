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

// Declared by hand so the compiler does not read the whole 700 KB file to work out its type.
declare module "@iconify-json/lucide/icons.json" {
  import type { IconSet } from "./src/icons";
  const set: IconSet;
  export default set;
}
