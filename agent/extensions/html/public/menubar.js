import iconHierarchy from "lenz:icons/file_tree";

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
      }
    ],
    edit: [
      {
        id: "html.content.text",
        title: "Editar texto",
        command: "html.content.text",
      },
    ],
    selection: [
      {
        id: "html.select.all",
        title: "Selecionar tudo",
        command: "html.select.all",
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
        title: "Hierarquia",
        icon: iconHierarchy,
        children: [
          {
            id: "html.element.move.up",
            title: "Mover para cima",
            command: "html.element.move.up",
          },
          {
            id: "html.element.move.down",
            title: "Mover para baixo",
            command: "html.element.move.down",
          },
          {
            id: "html.element.move.hierarchy.up",
            title: "Mover para cima na hierarquia",
            command: "html.element.move.hierarchy.up",
          },
          {
            id: "html.element.move.hierarchy.down",
            title: "Mover para baixo na hierarquia",
            command: "html.element.move.hierarchy.down",
          },
        ],
      },
      { id: "html.delete.separator", type: "separator" },
      {
        title: "Excluir",
        command: "html.element.delete",
      },
    ],
  };
}
