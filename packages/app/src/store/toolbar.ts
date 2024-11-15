import { Ref as LenzRef } from "lenz:reactivity";

export interface ButtonToolbarItem {
  type: "button";
  variant: "icon" | "text" | "icon-text" | "text-icon";
  command: string;
  label: string;
  icon?: string | LenzRef<string>;
}

export interface CustomButtonToolbarItem {
  type: "custom-button";
  svg: SVGElement;
}

export interface ToggleGroupToolbarItem<T> {
  type: "toggle-group";
  multiple?: boolean;
  valueRef: LenzRef<string>;
  items: ToggleGroupItem<T>[];
}

export interface ToggleGroupItem<T> {
  variant: "icon" | "text" | "icon-text" | "text-icon";
  label: string;
  icon?: string | LenzRef<string>;
  checkedValue: T;
  uncheckedValue: T;
}

export interface SeparatorToolbarItem {
  type: "separator";
}

export interface PopupToolbarItem {
  type: "popup";
  disabled: boolean | LenzRef<boolean>;
  button: ButtonToolbarItem | CustomButtonToolbarItem;
  content: string | URL
}