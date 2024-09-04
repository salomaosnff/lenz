import { z } from "zod";
import { isAValidNumber, SettingsFieldUtils } from "../../types";
import AppSettingsTextField, { Field } from "./AppSettingsTextField.vue";

function toZodSchema(field: Field) {
  let schema: z.ZodType = z.string();

  if (isAValidNumber(field.min)) {
    schema = (schema as z.ZodString).min(field.min, {
      message: `Este campo deve ter no mínimo ${field.min} caracteres`,
    });
  } else if (field.required) {
    schema = (schema as z.ZodString).min(1, {
      message: "Este campo é obrigatório",
    });
  }

  if (isAValidNumber(field.max)) {
    schema = (schema as z.ZodString).max(field.max, {
      message: `Este campo deve ter no máximo ${field.max} caracteres`,
    });
  }

  if (typeof field.pattern === "string" && field.pattern.length > 0) {
    schema = (schema as z.ZodString).regex(new RegExp(field.pattern), {
      message: `Este campo deve seguir o padrão: ${field.pattern}`,
    });
  }

  if (field.format === "email") {
    schema = (schema as z.ZodString).email({
      message: "Este campo deve ser um e-mail válido",
    });
  } else if (field.format === "url") {
    schema = (schema as z.ZodString).url({
      message: "Este campo deve ser uma URL válida",
    });
  }

  if (typeof field.default === "string") {
    schema = (schema as z.ZodString).default(field.default);
  }

  return schema;
}

export default {
  component: AppSettingsTextField,
  toZodSchema,
} satisfies SettingsFieldUtils;
