import type { Disposable, ExtensionManifest } from "lenz-sdk";
import { declareTool } from "../agent-tools/extension-tools";
import { declareCommand } from "../commands";
import { registerKeybinding } from "../keybindings";
import { useLayoutStore } from "../layout/store";

/**
 * Registers what a manifest declares (`contributes`), before the extension runs: its activity bar
 * panels, its views, its commands, its tools for agents and its shortcuts. The extension supplies the behavior later, by
 * registering the view providers and the commands. Dispose to take all of it away; if anything
 * cannot be registered, what was already is taken away and the error is thrown.
 */
export function registerContributions(manifest: ExtensionManifest): Disposable[] {
  const contributes = manifest.contributes;
  const registered: Disposable[] = [];
  if (!contributes) return registered;

  try {
    const containers = contributes.viewsContainers?.activitybar ?? [];
    const views = Object.entries(contributes.views ?? {});
    // The layout is only needed when there is a panel or a view to put there.
    if (containers.length || views.length) {
      const layout = useLayoutStore();
      for (const container of containers) {
        layout.registerContainer({ ...container, views: [] });
        registered.push({ dispose: () => layout.unregisterContainer(container.id) });
      }
      for (const [containerId, list] of views) {
        for (const view of list) {
          const remove = layout.registerView(containerId, {
            id: view.id,
            title: view.name,
            when: view.when,
            collapsed: view.collapsed,
            autoHeight: view.autoHeight,
          });
          registered.push({ dispose: remove });
        }
      }
    }
    for (const command of contributes.commands ?? []) {
      registered.push(declareCommand(manifest.name, command));
    }
    for (const tool of contributes.tools ?? []) {
      registered.push(declareTool(manifest.name, tool));
    }
    for (const binding of contributes.keybindings ?? []) {
      registered.push(registerKeybinding(binding));
    }
  } catch (error) {
    registered.reverse().forEach((d) => d.dispose());
    throw error;
  }
  return registered;
}
