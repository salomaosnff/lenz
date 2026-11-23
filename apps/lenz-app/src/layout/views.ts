import SettingsView from "./SettingsView.vue";
import PlaceholderView from "./PlaceholderView.vue";
import ExtensionsView from "../extensions/ExtensionsView.vue";
import { useLayoutStore } from "./store";

const samplePage = `<h1 style="color:#8b5cf6">Minha página</h1>
<p>Clique em um elemento para editá-lo.</p>
<div style="padding:16px;background:#f4f4f5;border-radius:8px">
  <a href="#">Um link</a>
</div>
`;

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
        title: "Páginas",
        component: PlaceholderView,
        // Only pages the app can edit: HTML.
        props: { items: [{ label: "page.html", content: samplePage }] },
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
