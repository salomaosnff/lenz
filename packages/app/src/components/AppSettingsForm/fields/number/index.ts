import { z } from "zod";
import { isAValidNumber, SettingsFieldUtils } from "../../types";
import AppSettingsTextField, { Field } from "./AppSettingsNumberField.vue";

function toZodSchema(field: Field) {
  let schema: z.ZodType = z.number({
    required_error: "Este campo é obrigatório",
  });

  if (isAValidNumber(field.min)) {
    schema = (schema as z.ZodNumber).min(field.min, {
      message: `Este campo deve ser no mínimo ${field.min}`,
    });
  }

  if (isAValidNumber(field.max)) {
    schema = (schema as z.ZodNumber).max(field.max, {
      message: `Este campo deve ser no máximo ${field.max}`,
    });
  }

  if (!field.required) {
    schema = schema.optional();
  }

  if (typeof field.default === "string") {
    schema = (schema as z.ZodNumber).default(field.default);
  }

  return schema;
}

export default {
  component: AppSettingsTextField,
  toZodSchema,
} satisfies SettingsFieldUtils;
