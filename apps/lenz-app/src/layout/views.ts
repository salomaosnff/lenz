import SettingsView from "./SettingsView.vue";
import WorkspaceView from "../fs/WorkspaceView.vue";
import ExtensionsView from "../extensions/ExtensionsView.vue";
import { useLayoutStore } from "./store";

export function registerDefaultViews() {
  const layout = useLayoutStore();

  // The right side bar. Extensions add views to it; it appears while any of them is available.
  layout.registerContainer({
    id: "secondary",
    title: "Propriedades",
    icon: "lucide:panel-right",
    location: "right",
    views: [],
  });

  layout.registerContainer({
    id: "explorer",
    title: "Explorador",
    icon: "lucide:files",
    // First in the activity bar, by default.
    order: 0,
    views: [
      {
        id: "files",
        title: "Arquivos",
        component: WorkspaceView,
      },
    ],
  });
  layout.registerContainer({
    id: "extensions",
    title: "Extensões",
    icon: "lucide:blocks",
    // After the panels of the extensions that ask to come first (they are numbered below this).
    order: 50,
    views: [
      {
        id: "installed",
        title: "Instaladas",
        component: ExtensionsView,
      },
    ],
  });
  layout.registerContainer({
    id: "settings",
    title: "Configurações",
    icon: "lucide:settings",
    location: "bottom",
    views: [
      {
        id: "general",
        title: "Geral",
        component: SettingsView,
      },
    ],
  });
}
