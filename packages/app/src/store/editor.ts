import { ref as createRef } from "lenz:reactivity";
import { ElementSelection } from "lenz:types";

import { defineStore } from "pinia";
import { toRaw } from "vue";

import { createElementSelection } from "../components/AppCanvas/types";

export const useEditorStore = defineStore("editor", () => {
  const menubarStore = useMenuBarStore();
  const settings = useSettingsStore();
  const fileStore = useFileStore();
  const historyStore = useHistoryStore();

  const hoveredElement = ref<ElementSelection>();
  const currentDocument = shallowRef<Document>();
  const selectionRef = markRaw(createRef<ElementSelection[]>([]));
  const hoverRef = markRaw(createRef<ElementSelection | undefined>());

  const selectedElements = customRef<ElementSelection[]>((track, trigger) => {
    return {
      get() {
        track();
        if (!fileStore.currentFile) {
          return [];
        }
        return (
          historyStore.ensureHistory<any>(
            fileStore.currentFile.filepath,
            fileStore.currentFile.data
          )?.current.data.selection ?? []
        );
      },
      set(value: ElementSelection[]) {
        if (!fileStore.currentFile) {
          return;
        }
        const history = historyStore.ensureHistory<any>(
          fileStore.currentFile.filepath,
          fileStore.currentFile.data
        );

        history.current.data.selection = value;

        trigger();
      },
    };
  });

  watch(
    hoveredElement,
    (value) => {
      hoverRef.value = toRaw(value);
    },
    { immediate: true }
  );

  watch(
    selectedElements,
    () => {
      selectionRef.value = toRaw(selectedElements.value).slice();
    },
    { immediate: true }
  );

  function getSelection() {
    return toRaw(selectedElements.value).slice();
  }

  function setSelection(elements: HTMLElement[]) {
    selectedElements.value = elements
      .filter((el) => el)
      .map((el) => createElementSelection(el));
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

  menubarStore.extendMenu(
    [
      {
        id: "frame.size",
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
            id: "frame.size.desktop",
            title: "Desktop (1366x768)",
            checkedValue: "desktop",
          },
          {
            id: "frame.size.tablet",
            title: "Tablet (1024x768)",
            checkedValue: "tablet",
          },
          {
            id: "frame.size.mobile",
            title: "Mobile (480x800)",
            checkedValue: "mobile",
          },
        ],
      },
      { type: "separator", id: "frame.size.separator", after: ["frame.size"] },
    ],
    "view"
  );

  return {
    selectionRef,
    hoverRef,
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
