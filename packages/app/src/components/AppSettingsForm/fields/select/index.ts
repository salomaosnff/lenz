import { z } from "zod";
import { isAValidNumber, SettingsFieldUtils } from "../../types";
import AppSettingsTextField, { Field } from "./AppSettingsSelect.vue";

function toZodSchema(field: Field) {
  const values = field.options.map((o) => o.value);
  let schema: z.ZodType = z.enum(values as any, {
    required_error: "Este campo é obrigatório",
  });

  if ("multiple" in field && field.multiple) {
    schema = z.array(schema);

    if (isAValidNumber(field.min)) {
      schema = (schema as z.ZodArray<any>).min(field.min, {
        message: `Selecione no mínimo ${field.min} opções`,
      });
    }

    if (isAValidNumber(field.max)) {
      schema = (schema as z.ZodArray<any>).max(field.max, {
        message: `Selecione no máximo ${field.max} opções`,
      });
    }

    if (Array.isArray(field.default)) {
      schema = (schema as z.ZodArray<any>).default(field.default);
    }
  } else {
    if (typeof field.default !== "undefined") {
      schema = schema.default(field.default);
    }
  }

  return schema;
}

export default {
  component: AppSettingsTextField,
  toZodSchema,
} satisfies SettingsFieldUtils;
