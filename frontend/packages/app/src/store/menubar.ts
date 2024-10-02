import { defineStore } from "pinia";

interface MenuItemBase {
  id?: string;
  before?: string[];
  after?: string[];
  isVisible?(state: any): boolean;
}

export interface MenuItemAction extends MenuItemBase {
  id: string;
  type?: "item";
  icon?: string;
  title: string;
  command?: string;
  children?: MenuItem[];

  isDisabled?(state: any): boolean;
}

export interface MenuItemSeparator extends MenuItemBase {
  type: "separator";
}

export interface MenuItemCheckboxGroup<T = any> extends MenuItemBase {
  id: string;
  type: "checkbox-group";
  title?: string;
  getValue(): T;
  onUpdated?(newValue: T): void;
  items: MenuItemCheckbox<T>[];
}

export interface MenuItemRadioGroup<T = any> extends MenuItemBase {
  id: string;
  type: "radio-group";
  title?: string;
  getValue(): T;
  onUpdated?(newValue: T): void;
  items: MenuItemRadioGroupItem<T>[];
}

export interface MenuItemCheckbox<T = any> extends MenuItemBase {
  id: string;
  title: string;
  command?: string;
  checkedValue?: T;
  uncheckedValue?: T;

  isDisabled?(state: any): boolean;
}

export interface MenuItemRadioGroupItem<T = any> extends MenuItemBase {
  id: string;
  title: string;
  checkedValue: T;
  command?: string;

  isDisabled?(state: any): boolean;
}

export type MenuItem =
  | MenuItemAction
  | MenuItemSeparator
  | MenuItemCheckboxGroup
  | MenuItemRadioGroup;

export const useMenuBarStore = defineStore("menubar", () => {
  const menuMap = ref(new Map<string, MenuItem>());
  const menuItems = ref<MenuItem[]>([]);

  function extendMenu(items: MenuItem[], parentId?: string) {
    items = items.filter((item) => typeof item === "object" && item !== null);

    for (const item of items) {
      item.id ??= (item.type === 'item' && item.command) || crypto.randomUUID()
      item.type ??= "item";

      if (item.id) {
        if (menuMap.value.has(item.id)) {
          throw new Error(`Menu com id ${item.id} já existe`);
        } else {
          menuMap.value.set(item.id, item);
        }
      }
    }

    const parent =
      typeof parentId === "string"
        ? (menuMap.value.get(parentId) as MenuItemAction)
        : undefined;

    if (parent) {
      parent.children ??= [];
    }

    function topologicalSort(items: MenuItem[]): MenuItem[] {
      const sorted: MenuItem[] = [];
      const visited = new Set<MenuItem>();

      const itemMap = new Map<string, MenuItem>();

      for (const item of items) {
        if (item.id) {
          itemMap.set(item.id, item);
        }
      }

      // Função auxiliar para inserir o item na lista na posição correta
      function insertInOrder(item: MenuItem) {
        const indexBefore = item.before?.length
          ? sorted.findIndex(
              (sortedItem) =>
                sortedItem.id && item.before?.includes(sortedItem.id)
            )
          : -1;
        const indexAfter = item.after?.length
          ? sorted.findIndex(
              (sortedItem) =>
                sortedItem.id && item.after?.includes(sortedItem.id)
            )
          : -1;

        if (indexBefore >= 0 && indexAfter >= 0 && indexBefore < indexAfter) {
          throw new Error("Dependências cíclicas detectadas.");
        }

        if (indexBefore !== -1) {
          // Se o item tem dependências no `before`, insira ele antes do primeiro item encontrado
          sorted.splice(indexBefore, 0, item);
        } else if (indexAfter !== -1) {
          // Se o item tem dependências no `after`, insira ele depois do último item encontrado
          sorted.splice(indexAfter + 1, 0, item);
        } else {
          // Caso não tenha dependências diretas, insira no final
          sorted.push(item);
        }
      }

      // Visitar cada item para inseri-lo corretamente
      function visit(item: MenuItem) {
        if (visited.has(item)) {
          return;
        }

        visited.add(item);

        // Visitar itens do `before`
        for (const beforeId of item.before ?? []) {
          const beforeItem = itemMap.get(beforeId);
          if (beforeItem) {
            visit(beforeItem);
          }
        }

        // Visitar itens do `after`
        for (const afterId of item.after ?? []) {
          const afterItem = itemMap.get(afterId);
          if (afterItem) {
            visit(afterItem);
          }
        }

        // Inserir o item na posição correta
        insertInOrder(item);
      }

      for (const item of items) {
        visit(item);
      }

      return sorted;
    }

    const newChildren = parent
      ? topologicalSort((parent.children as MenuItem[]).concat(items))
      : topologicalSort(menuItems.value.concat(items));

    if (parent) {
      parent.children = newChildren;
    } else {
      menuItems.value = newChildren;
    }
  }

  extendMenu([
    {
      id: "file",
      title: "Arquivo",
    },
    {
      id: "edit",
      title: "Editar",
    },
    {
      id: "selection",
      title: "Seleção",
    },
    {
      id: "insert",
      title: "Inserir",
    },
    {
      id: "tools",
      title: "Ferramentas",
      children: [],
    },
    {
      id: "view",
      title: "Visualizar",
    },
    {
      id: "help",
      title: "Ajuda",
      children: [
        {
          id: "help.site.separator",
          type: "separator",
          before: ["help.site"],
        },
        {
          id: "help.about",
          title: "Sobre",
          command: "help.about",
          after: ["help.site.separator"],
        },
      ],
    },
  ]);

  return {
    menuItems,
    extendMenu
  };
});
