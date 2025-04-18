import { addCommand } from "lenz:commands";
import { write } from "lenz:file";
import { addHotKeys } from "lenz:hotkeys";
import { extendMenu } from "lenz:menubar";
import { createWindow } from "lenz:ui";
import { ref, watch, createScope } from "lenz:reactivity";
import { prompt } from "lenz:dialog";

// Ícones
import iconJustify from "lenz:icons/align_horizontal_distribute";
import iconAlign from "lenz:icons/align_vertical_center";
import iconFillFlex from "lenz:icons/arrow_expand";
import iconWrap from "lenz:icons/format_text_wrapping_wrap";
import iconGrid from "lenz:icons/grid";
import iconFlexbox from "lenz:icons/land_rows_vertical";
import iconOrderHigh from "lenz:icons/priority_high";
import iconOrderLow from "lenz:icons/priority_low";
import iconDirection from "lenz:icons/rotate_right_variant";
import iconLayout from "lenz:icons/view_quilt";

import LayoutWindowWidget, { BoxWindowWidget } from "./www/layout.lenz.es.js";

export function activate({ subscriptions }) {
  let lastWindow;
  const flexDisplays = ["flex", "inline-flex"];
  const gridDisplays = ["grid", "inline-grid"];
  const alignItems = [
    "flex-start",
    "flex-end",
    "center",
    "baseline",
    "stretch",
  ];
  const justifyItems = [
    "flex-start",
    "flex-end",
    "center",
    "space-between",
    "space-around",
    "space-evenly",
  ];
  const flexWraps = ["wrap", "wrap-reverse", "nowrap"];
  const flexDirections = ["column", "column-reverse", "row", "row-reverse"];

  subscriptions.add(
    addHotKeys({
      "Ctrl+Alt+F": "flex.dialog",
      F: "flex.toggle.display",
      G: "grid.toggle.display",
      A: "flex.toggle.align",
      J: "flex.toggle.justify",
      "Alt+W": "flex.toggle.wrap",
      "Alt+D": "flex.toggle.direction",
      "Ctrl+ArrowRight": "flex.order.add",
      "Ctrl+ArrowLeft": "flex.order.sub",
      1: "flex.toggle.fill",
      M: "spacing.margin",
      G: "spacing.gap",
      P: "spacing.padding",
    })
  );

  subscriptions.add(
    extendMenu(
      [
        {
          id: "layout",
          title: "Layout",
          type: "item",
          icon: iconLayout,
          children: [
            {
              title: "Definir Layout",
              command: "flex.dialog",
              icon: iconLayout,
            },
            {
              title: "Alternar Flexbox",
              command: "flex.toggle.display",
              icon: iconFlexbox,
            },
            {
              title: "Alternar Direção do Flexbox",
              command: "flex.toggle.direction",
              icon: iconDirection,
            },
            {
              title: "Alternar Grid",
              command: "grid.toggle.display",
              icon: iconGrid,
            },
            {
              title: "Alternar Alinhamento",
              command: "flex.toggle.align",
              icon: iconAlign,
            },
            {
              title: "Alternar Justificação",
              command: "flex.toggle.justify",
              icon: iconJustify,
            },
            {
              title: "Alternar Quebra de Linha",
              command: "flex.toggle.wrap",
              icon: iconWrap,
            },
            {
              title: "Aumentar Ordem",
              command: "flex.order.add",
              icon: iconOrderHigh,
            },
            {
              title: "Diminuir Ordem",
              command: "flex.order.sub",
              icon: iconOrderLow,
            },
          ],
        },
      ],
      "tools"
    )
  );

  subscriptions.add(
    addCommand({
      id: "flex.dialog",
      name: "Configuração de Layout",
      icon: iconFlexbox,
      async run({ getCurrentContent, selection }) {
        if (lastWindow) {
          lastWindow.focus();
          return;
        }

        if (!selection.value.length) return;

        const scope = createScope();

        const result = ref();

        const parentElement = ref(selection.value[0].element.parentElement);

        scope.run(() => {
          watch(
            selection,
            (value) => {
              parentElement.value = value?.[0]?.element.parentElement;
            },
            { immediate: true }
          );
        });

        scope.run(() => {
          watch(result, async (style) => {
            if (saving) return;

            saving = true;

            await write(() => {
              for (const { element } of selection.value) {
                for (const [property, value] of Object.entries(style ?? {})) {
                  if ((value ?? null) === null) {
                    element.style.removeProperty(property);
                  } else {
                    element.style.setProperty(property, value);
                  }
                }
              }

              return getCurrentContent();
            }).finally(() => {
              saving = false;
            });
          });
        });

        lastWindow = createWindow({
          width: 840,
          height: 390,
          themed: true,
          title: "Configurações de Layout",
          content: (parent) =>
            LayoutWindowWidget(parent, { result, selection, parentElement }),
          onClose() {
            scope.dispose();
            lastWindow = null;
          },
        });

        let saving = false;
      },
    })
  );

  function alternateProperty(
    { getSelection, getCurrentContent },
    property,
    values
  ) {
    const selection = getSelection();

    if (!selection.length) return;

    const currentValue = selection[0].element.style.getPropertyValue(property);
    const newValue = values[values.indexOf(currentValue) + 1];

    return write(() => {
      if (newValue) {
        for (const { element } of selection) {
          element.style.setProperty(property, newValue);
        }
      } else {
        for (const { element } of selection) {
          element.style.removeProperty(property);
        }
      }

      return getCurrentContent();
    });
  }

  subscriptions.add(
    addCommand({
      id: "flex.toggle.fill",
      name: "Preencher Flexbox",
      icon: iconFillFlex,
      run: (context) => {
        const selection = context.getSelection();

        if (!selection.length) return;

        const currentFlexBasis =
          selection[0].element.style.getPropertyValue("flex-basis");
        const currentFlexGrow =
          selection[0].element.style.getPropertyValue("flex-grow");
        const currentFlexShrink =
          selection[0].element.style.getPropertyValue("flex-shrink");

        return write(() => {
          if (currentFlexGrow || currentFlexShrink || currentFlexBasis) {
            for (const { element } of selection) {
              element.style.removeProperty("flex-grow");
              element.style.removeProperty("flex-shrink");
              element.style.removeProperty("flex-basis");
            }
          } else {
            for (const { element } of selection) {
              element.style.setProperty("flex-grow", 1);
              element.style.setProperty("flex-shrink", 1);
              element.style.setProperty("flex-basis", 0);
            }
          }
        });
      },
    })
  );

  subscriptions.add(
    addCommand({
      id: "flex.toggle.display",
      name: "Alternar Flexbox",
      icon: iconFlexbox,
      run: (context) => alternateProperty(context, "display", flexDisplays),
    })
  );

  subscriptions.add(
    addCommand({
      id: "grid.toggle.display",
      name: "Alternar Grid",
      icon: iconGrid,
      run: (context) => alternateProperty(context, "display", gridDisplays),
    })
  );

  subscriptions.add(
    addCommand({
      id: "flex.toggle.direction",
      name: "Alternar Direção",
      icon: iconDirection,
      run: (context) =>
        alternateProperty(context, "flex-direction", flexDirections),
    })
  );

  subscriptions.add(
    addCommand({
      id: "flex.toggle.align",
      name: "Alternar Alinhamento",
      icon: iconAlign,
      run: (context) => alternateProperty(context, "align-items", alignItems),
    })
  );

  subscriptions.add(
    addCommand({
      id: "flex.toggle.justify",
      name: "Alternar Justificação",
      icon: iconJustify,
      run: (context) =>
        alternateProperty(context, "justify-content", justifyItems),
    })
  );

  subscriptions.add(
    addCommand({
      id: "flex.toggle.wrap",
      name: "Alternar Quebra de Linha",
      icon: iconWrap,
      run: (context) => alternateProperty(context, "flex-wrap", flexWraps),
    })
  );

  subscriptions.add(
    addCommand({
      id: "flex.order.add",
      name: "Aumentar Ordem",
      icon: iconOrderHigh,
      run: (context) => {
        const selection = context.getSelection();
        const property = "order";

        if (!selection.length) return;

        for (const { element } of selection) {
          const currentValue = element.style.getPropertyValue(property);
          const newValue = parseInt(currentValue) + 1;

          element.style.setProperty(property, newValue);
        }

        return context.getCurrentContent();
      },
    })
  );

  subscriptions.add(
    addCommand({
      id: "flex.order.sub",
      name: "Diminuir Ordem",
      icon: iconOrderLow,
      run: (context) => {
        const selection = context.getSelection();
        const property = "order";

        if (!selection.length) return;

        for (const { element } of selection) {
          const currentValue = element.style.getPropertyValue(property);
          const newValue = parseInt(currentValue) - 1;

          element.style.setProperty(property, newValue);
        }
      },
    })
  );

  subscriptions.add(
    addCommand({
      id: "spacing.margin",
      name: "Definir espaçamento externo (margem)",
      icon: iconLayout,
      run: async ({ selection }) => {
        if (!selection.value.length) return;

        const value =
          selection.value[0].element.style.getPropertyValue("margin");

        const margin = await prompt({ message: "Digite a margem:" }, value);

        for (const { element } of selection.value) {
          element.style.setProperty("margin", margin);
        }
      },
    })
  );

  subscriptions.add(
    addCommand({
      id: "spacing.padding",
      name: "Definir espaçamento interno (padding)",
      icon: iconLayout,
      run: async ({ selection }) => {
        if (!selection.value.length) return;

        const value =
          selection.value[0].element.style.getPropertyValue("padding");

        const padding = await prompt({ message: "Digite o padding:" }, value);

        for (const { element } of selection.value) {
          element.style.setProperty("padding", padding);
        }
      },
    })
  );

  subscriptions.add(
    addCommand({
      id: "spacing.gap",
      name: "Definir espaçamento entre elementos",
      icon: iconLayout,
      run: async ({ selection }) => {
        if (!selection.value.length) return;

        const value = selection.value[0].element.style.getPropertyValue("gap");

        const gap = await prompt({ message: "Digite o gap:" }, value);

        for (const { element } of selection.value) {
          element.style.setProperty("gap", gap);
        }
      },
    })
  );

  subscriptions.add(
    (() => {
      let isOpen = false;

      return addCommand({
        id: "css.box",
        name: "Definir configuração de caixa",
        async run({ selection }) {
          if (!selection.value.length || isOpen) return;

          const scope = createScope();

          const result = ref();

          scope.run(() => {
            watch(result, async (style) => {
              for (const { element } of selection.value) {
                for (const [property, value] of Object.entries(style ?? {})) {
                  if ((value ?? null) === null) {
                    element.style.removeProperty(property);
                  } else {
                    element.style.setProperty(property, value);
                  }
                }
              }
            });
          });

          isOpen = true;

          lastWindow = createWindow({
            width: 840,
            height: 390,
            themed: true,
            title: "Configurações de Caixa",
            content: (parent) => BoxWindowWidget(parent, { result, selection }),
            onClose() {
              isOpen = false;
              scope.dispose();
              lastWindow = null;
            },
          });
        },
      });
    })()
  );
}
