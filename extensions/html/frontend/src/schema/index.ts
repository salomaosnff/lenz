import { RefResolver } from "json-schema-ref-resolver";
import { JSONSchema7 } from "json-schema";

const schemas = new RefResolver();

Object.values<{ default: JSONSchema7 }>(
  import.meta.glob("./**/*.json", { eager: true })
).forEach((module) => {
  schemas.addSchema(module.default);
});

export default schemas;
