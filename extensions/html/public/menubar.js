import iconHierarchy from "lenz:icons/file_tree";
import iconSelectAll from "lenz:icons/select_all";

export function getMenuBar() {
  return {
    insert: [
      {
        id: "html.insert.div",
        title: "Divisão <div>",
        command: "html.insert.div",
      },
      {
        id: "html.insert.paragraph",
        title: "Parágrafo <p>",
        command: "html.insert.paragraph",
      },
      {
        id: "html.insert.heading",
        title: "Título <h1>",
        command: "html.insert.heading",
      },
      {
        id: "html.insert.img",
        title: "Imagem <img>",
        command: "html.insert.img",
      },
      {
        id: "html.insert.button",
        title: "Botão <button>",
        command: "html.insert.button",
      },
      {
        id: "html.insert.ul",
        title: "Lista não ordenada <ul>",
        command: "html.insert.ul",
      },
      {
        id: "html.insert.ol",
        title: "Lista ordenada <ol>",
        command: "html.insert.ol",
      },
    ],
    edit: [
      {
        id: "html.content.text",
        title: "Editar texto",
        command: "html.content.text",
      },
      {
        id: "html.element.attributes",
        title: "Atributos do elemento",
        command: "html.element.attributes",
      },
    ],
    selection: [
      {
        id: "html.select",
        title: "Selecionar...",
        type: "group",
        icon: iconSelectAll,
        children: [
          {
            id: "html.select.all",
            title: "Tudo",
            command: "html.select.all",
          },
          {
            id: "html.select.children",
            title: "Todos os Filhos",
            command: "html.select.children",
          },
          {
            id: "html.select.parent",
            title: "Pai",
            command: "html.select.parent",
          },
          {
            id: "html.select.next.sibling",
            title: "Próximo irmão",
            command: "html.select.next.sibling",
          },
          {
            id: "html.select.previous.sibling",
            title: "Irmão anterior",
            command: "html.select.previous.sibling",
          },
        ],
      },
      {
        id: "html.element.duplicate",
        title: "Duplicar",
        command: "html.element.duplicate",
      },
      { id: "html.group.separator", type: "separator" },
      {
        id: "html.group",
        title: "Agrupar",
        command: "html.group",
      },
      {
        id: "html.ungroup",
        title: "Desagrupar",
        command: "html.ungroup",
      },
      { id: "html.hierarchy.separator", type: "separator" },
      {
        id: "html.hierarchy",
        title: "Mover Elemento...",
        icon: iconHierarchy,
        children: [
          {
            id: "html.element.move.up",
            title: "Para cima",
            command: "html.element.move.up",
          },
          {
            id: "html.element.move.down",
            title: "Para baixo",
            command: "html.element.move.down",
          },
          {
            id: "html.element.move.hierarchy.up",
            title: "Para fora",
            command: "html.element.move.hierarchy.up",
          },
          {
            id: "html.element.move.hierarchy.down",
            title: "Para dentro",
            command: "html.element.move.hierarchy.down",
          },
        ],
      },
      { id: "html.delete.separator", type: "separator" },
      {
        title: "Excluir elemento",
        command: "html.element.delete",
      },
    ],
  };
}
