import { ref } from "vue";
import { useStorage } from "@vueuse/core";

/** The `lenz-mcp` server is off until the user turns it on: it lets other programs drive the app. */
export const mcpEnabled = useStorage("lenz:mcp:enabled", false);

export type McpStatus = "off" | "connecting" | "connected";

/** Whether the app is talking to `lenz-mcp` now. */
export const mcpStatus = ref<McpStatus>("off");
