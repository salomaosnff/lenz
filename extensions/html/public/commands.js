import { prompt } from "lenz:dialog";
import { createWindow } from "lenz:ui";

import iconSelectAll from "lenz:icons/select_all";
import iconDelete from "lenz:icons/delete";
import iconMoveDown from "lenz:icons/arrow_down";
import iconHierarchyMoveDown from "lenz:icons/arrow_down_right_bold";
import iconMoveUp from "lenz:icons/arrow_up";
import iconHierarchyMoveUp from "lenz:icons/arrow_up_right_bold";
import iconDuplicate from "lenz:icons/content_copy";
import iconGroup from "lenz:icons/group";
import iconRectangle from "lenz:icons/rectangle_outline";
import iconButton from "lenz:icons/button_pointer";
import iconImage from "lenz:icons/image";
import iconParagraph from "lenz:icons/text_short";
import iconList from "lenz:icons/format_list_bulleted";
import iconOrderedList from "lenz:icons/format_list_numbered";
import iconHeading from "lenz:icons/format_header1";
import iconHeadingIncrease from "lenz:icons/format_header_increase";
import iconUnGroup from "lenz:icons/ungroup";
import iconEditAttributes from "lenz:icons/pencil_box_outline";
import iconSelectParent from "lenz:icons/select_arrow_up";
import iconSelectChildren from "lenz:icons/select_group";
import iconSelectPreviousSibling from "lenz:icons/arrow_left_bold_box_outline";
import iconSelectNextSibling from "lenz:icons/arrow_right_bold_box_outline";

import { createElement } from "./util.js";
import EditAttributesWidget from "./www/html.lenz.es.js";

function insertElement(
  { getSelection, setSelection, getCurrentDocument },
  tag,
  { attrs, domProps, style, children } = {}
) {
  const document = getCurrentDocument();
  let selection = getSelection();

  if (!selection.length) {
    selection = [{ element: document.body }];
  }

  const elements = [];

  for (let { element } of getSelection()) {
    if (element.tagName === "HTML") {
      element = document.body;
    }

    const el = createElement(tag, { attrs, domProps, style, children });

    element.append(el);
    elements.push(el);
  }

  setSelection(elements);
}

export function insertDiv() {
  return {
    id: "html.insert.div",
    hotKey: "D",
    name: "Inserir divisão",
    icon: iconRectangle,
    description: "Cria um novo elemento <div> no elemento selecionado",
    run: (context) =>
      insertElement(context, "div", {
        style: {
          padding: "1rem",
          border: "1px solid #ccc",
        },
      }),
  };
}

export function setTextContent() {
  return {
    id: "html.content.text",
    hotKey: "T",
    name: "Definir Texto",
    async run({ getSelection, getCurrentDocument }) {
      const document = getCurrentDocument();
      const text = await prompt("Digite o conteúdo de texto");

      if (text === null) {
        return;
      }

      for (const { element } of getSelection()) {
        if (element.tagName === "HTML" || element.tagName === "BODY") {
          const el = createElement("span", { domProps: { textContent: text } });

          document.body.append(el);
          continue;
        }

        if (element.tagName === "DIV") {
          const el = createElement("span", { domProps: { textContent: text } });

          element.append(el);
          continue;
        }

        element.textContent = text;
      }
    },
  };
}

export function insertParagraph() {
  return {
    id: "html.insert.paragraph",
    hotKey: "Shift+P",
    name: "Inserir parágrafo",
    icon: iconParagraph,
    description: "Cria um novo elemento <p> no elemento selecionado",
    run: (context) =>
      insertElement(context, "p", {
        domProps: {
          textContent:
            "Lorem ipsum dolor sit amet consectetur adipiscing elit...",
        },
      }),
  };
}

export function insertInput() {
  return {
    id: "html.insert.input",
    hotKey: "Shift+I",
    name: "Inserir campo de texto",
    icon: iconButton,
    description: "Cria um novo elemento <input> no elemento selecionado",
    run: (context) =>
      insertElement(context, "input", {
        attrs: {
          type: "text",
          placeholder: "Digite algo...",
        },
      }),
  }
}

export function insertButton() {
  return {
    id: "html.insert.button",
    hotKey: "Shift+B",
    name: "Inserir botão",
    icon: iconButton,
    description: "Cria um novo elemento <button> no elemento selecionado",
    run: (context) =>
      insertElement(context, "button", {
        domProps: {
          textContent: "Clique aqui",
        },
      }),
  };
}

export function insertImage() {
  return {
    id: "html.insert.img",
    name: "Inserir imagem",
    hotKey: "I",
    icon: iconImage,
    description: "Cria um novo elemento <img> no elemento selecionado",
    run: (context) =>
      insertElement(context, "img", {
        attrs: {
          src: "https://picsum.photos/800/600",
          alt: "Imagem aleatória",
        },
        style: {
          maxWidth: "100%",
          height: "auto",
          backgroundColor: "#f8f8f8",
        },
      }),
  };
}

export function insertList() {
  return {
    id: "html.insert.ul",
    hotKey: "L",
    name: "Inserir lista não ordenada",
    icon: iconList,
    description: "Cria um novo elemento <ul> no elemento selecionado",
    run: (context) =>
      insertElement(context, "ul", {
        children: [
          createElement("li", {
            children: [
              createElement("p", { domProps: { textContent: "Item 1" } }),
            ],
          }),
          createElement("li", {
            children: [
              createElement("p", { domProps: { textContent: "Item 2" } }),
            ],
          }),
          createElement("li", {
            children: [
              createElement("p", { domProps: { textContent: "Item 3" } }),
            ],
          }),
        ],
      }),
  };
}

export function insertOrderedList() {
  return {
    id: "html.insert.ol",
    hotKey: "Shift+L",
    name: "Inserir lista ordenada",
    icon: iconOrderedList,
    description: "Cria um novo elemento <ol> no elemento selecionado",
    run: (context) =>
      insertElement(context, "ol", {
        children: [
          createElement("li", {
            children: [
              createElement("p", { domProps: { textContent: "Item 1" } }),
            ],
          }),
          createElement("li", {
            children: [
              createElement("p", { domProps: { textContent: "Item 2" } }),
            ],
          }),
          createElement("li", {
            children: [
              createElement("p", { domProps: { textContent: "Item 3" } }),
            ],
          }),
        ],
      }),
  };
}

export function insertHeading() {
  return {
    id: `html.insert.heading`,
    name: `Inserir título`,
    description: `Cria um novo elemento <h1> no elemento selecionado`,
    icon: iconHeading,
    hotKey: "H",
    run: (context) =>
      insertElement(context, "h1", {
        domProps: {
          textContent: `Lorem ipsum dolor sit amet, consectetur adipiscing elit`,
        },
      }),
  };
}

export function increaseHeadingLevel() {
  return {
    id: "html.heading.increase",
    name: "Aumentar nível do título",
    hotKey: "Shift+H",
    icon: iconHeadingIncrease,
    description: "Aumenta o nível do título selecionado",
    run({ getSelection, setSelection }) {
      const elements = [];

      for (const { element } of getSelection()) {
        if (element.tagName.startsWith("H") && element.tagName.length === 2) {
          const newTag = `h${parseInt(element.tagName[1] % 6) + 1}`;
          const newElement = createElement(newTag, {
            domProps: { textContent: element.textContent },
            children: element.children,
            style: element.style,
          });

          element.replaceWith(newElement);
          elements.push(newElement);
        }
      }

      setSelection(elements);
    },
  };
}

export function selectAll() {
  return {
    id: "html.select.all",
    hotKey: "Ctrl+A",
    name: "Selecionar todos os irmãos",
    icon: iconSelectAll,
    description: "Seleciona todos os irmãos do elemento selecionado",
    run({ getSelection, setSelection }) {
      const elements = [];

      for (const { element } of getSelection()) {
        for (const child of element?.parentElement?.children ?? []) {
          elements.push(child);
        }
      }

      if (elements.length > 0) {
        setSelection(elements);
      }
    },
  };
}

export function deleteElement() {
  return {
    id: "html.element.delete",
    hotKey: "Delete",
    name: "Excluir Elemento",
    icon: iconDelete,
    description: "Exclui o(s) elemento(s) selecionado e todo o seu conteúdo",
    run({ getSelection }) {
      for (const { element } of getSelection()) {
        if (!(element.tag === "HTML" || element.tag === "BODY")) {
          element.remove();
        }
      }
    },
  };
}

export function duplicateElement() {
  return {
    id: "html.element.duplicate",
    name: "Duplicar elemento",
    hotKey: "Ctrl+D",
    icon: iconDuplicate,
    description: "Duplica o elemento selecionado",
    run({ getSelection, setSelection }) {
      const elements = [];

      for (const { element } of getSelection()) {
        const clone = element.cloneNode(true);
        element.after(clone);
        elements.push(clone);
      }

      setSelection(elements);
    },
  };
}

export function groupElements() {
  return {
    id: "html.group",
    name: "Agrupar elementos",
    hotKey: "Ctrl+G",
    icon: iconGroup,
    description: "Agrupa os elementos de mesmo nível em um novo elemento <div>",
    run({ getSelection, setSelection, getCurrentDocument }) {
      const document = getCurrentDocument();
      const elementsGroupedByParentElement = new Map();
      const elements = [];

      for (const { element } of getSelection()) {
        const parentElement = element.parentElement;
        const elements =
          elementsGroupedByParentElement.get(parentElement) || [];
        elements.push(element);
        elementsGroupedByParentElement.set(parentElement, elements);
      }

      for (const [parentElement, children] of elementsGroupedByParentElement) {
        const group = document.createElement("div");

        group.style.padding = "6px";

        for (let i = 0; i < children.length; i++) {
          const element = children[i];

          if (i === 0) {
            children[0].replaceWith(group);
          }

          group.append(element);
        }

        elements.push(group);
      }

      setSelection(elements);
    },
  };
}

export function unGroupElements() {
  return {
    id: "html.ungroup",
    name: "Desagrupar elementos",
    icon: iconUnGroup,
    hotKey: "Ctrl+U",
    description: "Desagrupa os elementos agrupados",
    run({ getSelection, setSelection }) {
      const elements = [];

      for (const { element } of getSelection()) {
        if (element.tagName === "BODY" || element.tagName === "HTML") {
          continue;
        }

        for (const child of element.children) {
          element.before(child);
          elements.push(child);
        }

        element.remove();
      }

      setSelection(elements);
    },
  };
}

export function selectParent() {
  return {
    id: "html.select.parent",
    name: "Selecionar pai",
    hotKey: "Ctrl+ArrowUp",
    description: "Seleciona o elemento pai do elemento selecionado",
    icon: iconSelectParent,
    run({ getSelection, setSelection }) {
      const elements = new Set();

      for (const { element } of getSelection()) {
        if (element.parentElement) {
          elements.add(element.parentElement);
        }
      }

      setSelection(Array.from(elements));
    },
  };
}

export function selectChildren() {
  return {
    id: "html.select.children",
    name: "Selecionar filhos",
    hotKey: "Ctrl+Shift+A",
    description: "Seleciona os elementos filhos do elemento selecionado",
    icon: iconSelectChildren,
    run({ getSelection, setSelection }) {
      const elements = new Set();

      for (const { element } of getSelection()) {
        for (const child of element.children) {
          elements.add(child);
        }
      }

      setSelection(Array.from(elements));
    },
  };
}

export function selectPreviousSibling() {
  return {
    id: "html.select.previous.sibling",
    name: "Selecionar irmão anterior",
    hotKey: "Ctrl+Shift+ArrowLeft",
    description: "Seleciona o irmão anterior do elemento selecionado",
    icon: iconSelectPreviousSibling,
    run({ getSelection, setSelection }) {
      const elements = new Set();

      for (const { element } of getSelection()) {
        if (element.previousElementSibling) {
          elements.add(element.previousElementSibling);
        }
      }

      setSelection(Array.from(elements));
    },
  };
}

export function selectNextSibling() {
  return {
    id: "html.select.next.sibling",
    name: "Selecionar irmão seguinte",
    hotKey: "Ctrl+Shift+ArrowRight",
    description: "Seleciona o irmão seguinte do elemento selecionado",
    icon: iconSelectNextSibling,
    run({ getSelection, setSelection }) {
      const elements = new Set();

      for (const { element } of getSelection()) {
        if (element.nextElementSibling) {
          elements.add(element.nextElementSibling);
        }
      }

      setSelection(Array.from(elements));
    },
  };
}

export function moveUp() {
  return {
    id: "html.element.move.up",
    name: "Mover para cima",
    icon: iconMoveUp,
    hotKey: "ArrowUp",
    description: "Move o elemento selecionado para cima",
    run({ getSelection, setSelection }) {
      const elements = [];

      for (const { element } of getSelection()) {
        if (element.previousElementSibling) {
          element.after(element.previousElementSibling);
        }
        elements.push(element);
      }

      setSelection(elements);
    },
  };
}

export function moveDown() {
  return {
    id: "html.element.move.down",
    name: "Mover para baixo",
    icon: iconMoveDown,
    hotKey: "ArrowDown",
    description: "Move o elemento selecionado para baixo",
    run({ getSelection, setSelection }) {
      const elements = [];

      for (const { element } of getSelection()) {
        elements.push(element);

        if (element.nextElementSibling) {
          element.before(element.nextElementSibling);
        }
      }

      setSelection(elements);
    },
  };
}

export function moveHierarchyUp() {
  return {
    id: "html.element.move.hierarchy.up",
    name: "Mover para fora",
    icon: iconHierarchyMoveUp,
    hotKey: "Shift+ArrowUp",
    description: "Move o elemento selecionado para fora do elemento pai",
    run({ getSelection, setSelection }) {
      const elements = [];

      for (const { element } of getSelection()) {
        const parent = element.parentElement;

        elements.push(element);

        if (!parent || parent.tagName === "HTML" || parent.tagName === "BODY") {
          continue;
        }

        const grandParent = parent.parentElement;

        if (grandParent) {
          grandParent.insertBefore(element, parent);
        }
      }

      setSelection(elements);
    },
  };
}

export function moveHierarchyDown() {
  return {
    id: "html.element.move.hierarchy.down",
    name: "Mover para dentro",
    icon: iconHierarchyMoveDown,
    hotKey: "Shift+ArrowDown",
    description: "Move o elemento selecionado para dentro do próximo elemento",
    run({ getSelection, setSelection }) {
      const elements = [];

      for (const { element } of getSelection()) {
        elements.push(element);

        const nextSibling = element.nextElementSibling;

        if (nextSibling) {
          nextSibling.prepend(element);
        }
      }

      setSelection(elements);
    },
  };
}

export function editAttributes() {
  let lastWindow;
  return {
    id: "html.element.attributes",
    name: "Editar atributos",
    icon: iconEditAttributes,
    hotKey: "Ctrl+E",
    description: "Edita os atributos do elemento selecionado",
    run({ selection }) {
      if (lastWindow) {
        lastWindow.focus();
        return;
      }

      lastWindow = createWindow({
        width: 720,
        height: 520,
        themed: true,
        title: "Atributos do Elemento",
        content: (parent) => EditAttributesWidget(parent, { selection }),
        onClose() {
          lastWindow = null;
        },
      });
    },
  };
}
