import { z } from "zod";
import { SettingsFieldUtils } from "../../types";
import component, { Field } from "./AppSettingsBoolean.vue";

function toZodSchema(field: Field) {
  let schema: z.ZodType = z.boolean();

  if (field.required) {
    schema = z.literal(true, {
      errorMap: () => ({ message: "Este campo é obrigatório" }),
    });
  } else {
    schema = schema.optional();
  }

  return schema;
}

export default {
  component,
  toZodSchema,
} satisfies SettingsFieldUtils;
