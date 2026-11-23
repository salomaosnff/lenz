import type { DefineComponent } from "vue";

/**
 * Components the host registers globally, so extension templates can use them
 * without importing. Include with `/// <reference types="lenz-sdk/globals" />`.
 */
declare module "vue" {
  interface GlobalComponents {
    /**
     * Any icon of the host's icon sets, by name: `lucide:sparkles`. Without a
     * prefix, `lucide:` is assumed. Size it with CSS (default 1em).
     */
    Icon: DefineComponent<{ name: string }>;
  }
}
