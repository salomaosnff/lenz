import { defineStore } from "pinia";

export interface MenuItemAction {
  type?: "item";
  title: string;
  command?: string;

  isVisible?(state: any): boolean;
  isDisabled?(state: any): boolean;

  children?: MenuItem[];
}

export interface MenuItemSeparator {
  type: "separator";
}

export interface MenuItemCheckboxGroup<T = any> {
  type: "checkbox-group";
  title?: string;
  getValue(): T;
  onUpdated?(newValue: T): void;
  items: MenuItemCheckbox<T>[];
}

export interface MenuItemRadioGroup<T = any> {
  type: "radio-group";
  title?: string;
  getValue(): T;
  onUpdated?(newValue: T): void;
  items: MenuItemRadioGroupItem<T>[];
}

export interface MenuItemCheckbox<T = any> {
  title: string;
  command?: string;
  checkedValue?: T;
  uncheckedValue?: T;

  isDisabled?(state: any): boolean;
  isVisible?(state: any): boolean;
}

export interface MenuItemRadioGroupItem<T = any> {
  title: string;
  checkedValue: T;
  command?: string;

  isDisabled?(state: any): boolean;
  isVisible?(state: any): boolean;
}

export type MenuItem =
  | MenuItemAction
  | MenuItemSeparator
  | MenuItemCheckboxGroup
  | MenuItemRadioGroup;

export const useMenuBarStore = defineStore("menubar", () => {
  const menuItems = ref<MenuItem[]>([
    {
      title: "Arquivo",
      type: "item",
      children: [],
    },
    {
      title: "Editar",
      type: "item",
      children: [],
    },
    {
      title: "Inserir",
      type: "item",
      children: [],
    },
    {
      title: "Visualizar",
      type: "item",
      children: [],
    },
    {
      title: "Ajuda",
      children: [],
    },
  ]);

  function addMenuItemsAt(path: string[], items: MenuItem[]) {
    let children = menuItems.value;

    for (const title of path) {
      let item = children.find((item) => item.type === 'item' && item.title === title) as MenuItemAction | undefined

      if (!item) {
        item = {
          title,
          type: "item",
          children: [],
        }

        children.push(item);
      }

      children = item.children as MenuItem[];
    }

    children.push(...items);
  }

  return {
    menuItems,
    addMenuItemsAt,
  };
});
