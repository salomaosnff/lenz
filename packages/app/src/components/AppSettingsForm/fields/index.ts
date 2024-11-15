import { SettingsFieldMapping, SettingsFieldUtils } from "../types";
import BooleanField from "./boolean";
import NumberField from "./number";
import SelectField from "./select";
import TextField from "./text";

export const APP_SETTINGS_FIELDS: Record<
  keyof SettingsFieldMapping,
  SettingsFieldUtils
> = {
  text: TextField,
  boolean: BooleanField,
  number: NumberField,
  select: SelectField,
};
