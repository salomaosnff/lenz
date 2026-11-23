import type { ExtensionContext, ExtensionWindow } from "lenz-sdk";
import type { HtmlEditorApi } from "html-visual-editor/api";
import WidgetWindow from "./WidgetWindow.vue";

let host: { context: ExtensionContext; api: HtmlEditorApi } | undefined;
const windows = new Map<string, ExtensionWindow>();

/** Called on activation, so the fields can open the widget windows. */
export function initWidgets(context: ExtensionContext, api: HtmlEditorApi) {
  host = { context, api };
  context.subscriptions.push({
    dispose() {
      windows.forEach((w) => w.dispose());
      windows.clear();
      host = undefined;
    },
  });
}

/** Opens the advanced editor of a property in a window; one window per property. */
export function openWidget(prop: string, title: string) {
  if (!host) return;
  const existing = windows.get(prop);
  if (existing) return existing.open();
  const offset = windows.size * 28;
  windows.set(
    prop,
    host.context.windows.createWindow({
      id: `widget:${prop}`,
      title,
      content: {
        type: "vue-component",
        component: WidgetWindow,
        props: { prop, api: host.api },
      },
      x: 360 + offset,
      y: 120 + offset,
      width: 360,
      height: 520,
    }),
  );
}
