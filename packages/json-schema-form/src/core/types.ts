export interface BaseFormControl<T> {
  id: string;
  value?: T;
  label: string;
  description?: string;
  placeholder?: string;
  required?: boolean;
}

export interface TextFormControl extends BaseFormControl<string> {
  type: "TextControl";
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  format: "text" | "email" | "url";
}

export interface NumberFormControl extends BaseFormControl<number> {
  type: "NumberControl";
  min?: number;
  max?: number;
  step?: number;
}

export interface CheckboxFormControl extends BaseFormControl<boolean> {
  type: "CheckboxControl";
}

export interface SelectFormControl<T> extends BaseFormControl<T> {
  type: "SelectControl";
  options: { value: T; label: string }[];
}

export interface ObjectFormControl extends BaseFormControl<Record<string, any>> {
  type: "ObjectControl";
  properties: FormElement[];
}

export interface ArrayFormControl extends BaseFormControl<any[]> {
  type: "ArrayControl";
  items: FormElement;
}

export type FormControl =
  | TextFormControl
  | NumberFormControl
  | CheckboxFormControl
  | SelectFormControl<any>
  | ObjectFormControl
  | ArrayFormControl;

export interface VerticalLayout {
  type: "VerticalLayout";
  children: FormElement[];
}

export interface HorizontalLayout {
  type: "HorizontalLayout";
  children: FormElement[];
}

export interface GridLayout {
  type: "GridLayout";
  columns: number;
  children: FormElement[];
}

export interface Group {
  type: "Group";
  label: string;
  children: FormElement[];
}

export type Layout = VerticalLayout | HorizontalLayout | GridLayout;
export type FormElement = FormControl | Layout;
