import { defineStore } from "pinia";
import { toRaw } from "vue";
import { CanvasElement, createElementSelection } from "../components/AppCanvas/types";
import { MenuItemRadioGroup } from "./menubar";

export const useEditorStore = defineStore("editor", () => {
  const menubarStore = useMenuBarStore();
  const settings = useSettingsStore();
  const selectedElements = ref<CanvasElement[]>([]);
  const hoveredElement = ref<CanvasElement>();
  const currentDocument = shallowRef<Document>();

  function getSelection() {
    return toRaw(selectedElements.value).slice();
  }

  function setSelection(elements: HTMLElement[]) {
    selectedElements.value = elements.map((el) => createElementSelection(el));
  }

  function getHover() {
    return toRaw(hoveredElement.value);
  }

  function getCurrentDocument() {
    return toRaw(currentDocument.value);
  }

  function getCurrentContent() {
    const document = getCurrentDocument()?.cloneNode(true) as Document;

    document?.querySelectorAll("[data-ignore-on-to-string]").forEach((el) => {
      el.remove();
    });

    return document?.documentElement.outerHTML;
  }

  menubarStore.addMenuItemsAt(
    ["Visualizar"],
    [
      {
        type: "radio-group",
        title: "Tamanho da tela",
        getValue() {
          const { width } = settings.settings.frame;

          if (width < 1024) {
            return "mobile";
          }

          if (width < 1366) {
            return "tablet";
          }

          return "desktop";
        },
        onUpdated(newValue: string) {
          if (newValue === "mobile") {
            settings.settings.frame.width = 480;
          }

          if (newValue === "tablet") {
            settings.settings.frame.width = 1024;
          }

          if (newValue === "desktop") {
            settings.settings.frame.width = 1366;
          }
        },
        items: [
          {
            title: "Desktop (1366x768)",
            checkedValue: "desktop",
          },
          {
            title: "Tablet (1024x768)",
            checkedValue: "tablet",
          },
          {
            title: "Mobile (480x800)",
            checkedValue: "mobile",
          },
        ],
      } as MenuItemRadioGroup,
      { type: "separator" },
    ]
  );

  return {
    selectedElements,
    hoveredElement,
    currentDocument,
    getSelection,
    setSelection,
    getHover,
    getCurrentDocument,
    getCurrentContent,
  };
});
