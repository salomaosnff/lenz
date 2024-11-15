import { set as _set } from "lodash-es";
import { Component } from "vue";
import z from "zod";
import { APP_SETTINGS_FIELDS } from "./fields";

export interface BaseSettingsField {
  name: string;
  label?: string;
  hint?: string;
  required?: boolean;
}

export interface SettingsFieldUtils {
  component: Component<{ field: SettingsField }>;
  toZodSchema(field: SettingsField): z.ZodType<any, any, any>;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface SettingsFieldMapping {}

export type SettingsField = SettingsFieldMapping[keyof SettingsFieldMapping];

export function isAValidNumber(value: any): value is number {
  return (
    typeof value === "number" && !Number.isNaN(value) && Number.isFinite(value)
  );
}

export function toZodSchema(fields: SettingsField[]) {
  let schema: any;

  for (const field of fields) {
    const { toZodSchema } = APP_SETTINGS_FIELDS[field.type];

    if (!schema) {
      if (/^\[.d+\]/.test(field.name)) {
        schema = [];
      } else {
        schema = schema || {};
      }
    }

    _set(schema, field.name, toZodSchema(field));
  }

  function normalizeSchema(schema: any): z.ZodType {
    if (Array.isArray(schema)) {
      return z.tuple(normalizeSchema(schema[0]) as any).default([]);
    }

    if (schema instanceof z.ZodType) {
      return schema;
    }

    const defaults = Object.entries(schema).reduce((acc, [key, schema]) => {
      if (schema instanceof z.ZodDefault) {
        acc[key] = schema._def.defaultValue();
      }

      return acc;
    }, {} as any);

    return z.object(schema).default(defaults);
  }

  return normalizeSchema(schema);
}
