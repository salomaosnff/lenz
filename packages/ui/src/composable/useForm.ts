import {
  cloneDeep as _cloneDeep,
  get as _get,
  isEqual as _isEqual,
  set as _set,
} from "lodash-es";
import {
  computed,
  inject,
  markRaw,
  MaybeRefOrGetter,
  provide,
  readonly,
  ref,
  Ref,
  toValue,
  watch,
} from "vue";
import { z } from "zod";

const FormProviderSymbol = Symbol("FormProvider");

export const IDLE = 0x00;
export const VALID = 0x01;
export const VALIDATING = 0x02;
export const SUBMITTING = 0x04;
export const SUBMITTED = 0x08;
export const SUBMIT_FAILED = 0x10;

export interface ProvideFormOptions<S extends z.ZodType> {
  schema: MaybeRefOrGetter<S>;
  modelValue: Ref<z.infer<S>>;
  validateOnMount?: MaybeRefOrGetter<boolean>;
  onSubmit?(values: z.output<S>): Promise<any>;
  onValid?(values: z.output<S>): void;
}

export interface UseForm<T> {
  values: Ref<T>;
  errors: Ref<Record<string, string>>;
  state: Ref<number>;

  validate(): Promise<T>;
  reset(): void;
  submit(): Promise<void>;

  get(key: string): any;
  set(key: string, value: any): void;
  setAndValidate(key: string, value: any): Promise<void>;

  getError(key: string): string | null | undefined;
  clearErrors(): void;

  canSubmit(): boolean;
  canReset(): boolean;
  canSet(): boolean;
  canValidate(): boolean;
  validateField(key: string): Promise<void>;
}

export function pathToKey(path: Array<string | number>) {
  let key = "";

  for (const part of path) {
    if (typeof part === "number") {
      key += `[${part}]`;
    } else if (key) {
      key += `.${part}`;
    } else {
      key = part;
    }
  }

  return key;
}

export function provideForm<S extends z.ZodType>(
  options: ProvideFormOptions<S>
): UseForm<z.output<S>> {
  const values = ref(toValue(options.modelValue)) as Ref<z.output<S>>;

  let initialFormValues = _cloneDeep(values.value);

  const state = ref(IDLE);
  const errors = ref<Record<string, string>>({});

  watch(
    values,
    (newValues, oldValues) => {
      if (
        oldValues !== undefined &&
        !_isEqual(newValues, options.modelValue.value)
      ) {
        options.modelValue.value = newValues;
      }
    },
    { deep: true }
  );

  watch(
    () => values.value,
    (newValues) => {
      if (state.value & VALID) {
        options.onValid?.(_cloneDeep(newValues));
      }
    }
  );

  watch(
    options.modelValue,
    (newValues) => {
      if (!_isEqual(newValues, values.value)) {
        values.value = newValues;
      }
    },
    { deep: true }
  );

  function canSubmit() {
    return (
      !!(state.value & VALID) && !(state.value & (VALIDATING | SUBMITTING))
    );
  }

  function canReset() {
    return !(state.value & (VALIDATING | SUBMITTING));
  }

  function canSet() {
    return !(state.value & SUBMITTING);
  }

  function canValidate() {
    return !(state.value & (VALIDATING | SUBMITTING));
  }

  function clearErrors() {
    errors.value = {};
  }

  async function submit() {
    if (state.value & SUBMITTING) {
      throw new Error("Already submitting");
    }

    if (state.value & VALIDATING) {
      throw new Error("Cannot submit while validating");
    }

    state.value &= ~SUBMIT_FAILED;
    state.value |= SUBMITTING;

    try {
      const result = await validateAndUpdateState();

      if (state.value & VALID && result) {
        await options.onSubmit?.(result.values);
        state.value |= SUBMITTED;
      }
    } catch (error) {
      console.error(error);
      state.value |= SUBMIT_FAILED;
    } finally {
      state.value &= ~SUBMITTING;
    }
  }

  function set(key: string, value: any) {
    values.value = _set(values.value ?? {}, key, value);
  }

  async function validateField(key: string) {
    if (state.value & VALIDATING) {
      return;
    }

    delete errors.value[key];

    state.value |= VALIDATING;
    state.value &= ~VALID;

    const schema = toValue(options.schema);

    const validationResult = await schema.safeParseAsync(values.value);

    state.value &= ~VALIDATING;

    if (validationResult.success) {
      state.value |= VALID;
      values.value = validationResult.data;
    } else {
      state.value &= ~VALID;

      for (const issue of validationResult.error.issues) {
        const errorKey = pathToKey(issue.path);

        if (errorKey === key) {
          errors.value[key] = issue.message;
          break;
        }
      }
    }
  }

  async function setAndValidate(key: string, value: any) {
    set(key, value);

    const result = await validateAndUpdateState(false);

    if (typeof result !== "undefined") {
      values.value = result.values;
      const error = _get(result.errors, key);
      errors.value = _set(errors.value, key, error);
    }
  }

  function get(key: string) {
    return _get(values.value, key);
  }

  async function validateOnly() {
    const schema = toValue(options.schema);
    const validationResult = await schema.safeParseAsync(values.value);

    if (validationResult.success) {
      return {
        values: validationResult.data,
        valid: true,
        errors: {} as Record<string, string>,
      };
    }

    return {
      values: values.value,
      valid: false,
      errors: validationResult.error.issues.reduce(
        (acc, error) => {
          const key = pathToKey(error.path);
          acc[key] = error.message;
          return acc;
        },
        {} as Record<string, string>
      ),
    };
  }

  async function validateAndUpdateState(setErrors = true) {
    if (state.value & VALIDATING) {
      return;
    }

    state.value |= VALIDATING;

    const {
      values: newValues,
      valid,
      errors: newErrors,
    } = await validateOnly();

    if (valid) {
      state.value |= VALID;
    } else {
      state.value &= ~VALID;
    }

    if (setErrors) {
      errors.value = newErrors;
    }

    state.value &= ~VALIDATING;

    values.value = newValues;

    return {
      values: newValues,
      valid,
      errors: newErrors,
    };
  }

  async function reset() {
    if (state.value & SUBMITTING) {
      throw new Error("Cannot reset while submitting");
    }

    const schema = toValue(options.schema);

    const result = await schema.safeParseAsync(undefined);

    if (result.success) {
      values.value = result.data;
      state.value |= VALID;
    } else {
      const result = await schema.safeParseAsync(initialFormValues);

      if (result.success) {
        values.value = result.data;
        state.value |= VALID;
      } else {
        values.value = initialFormValues;
        state.value &= ~VALID;
      }
    }

    clearErrors();
  }

  function getError(key: string) {
    return errors.value[key] ?? null;
  }

  const provider: UseForm<z.output<S>> = markRaw({
    values,
    errors,
    state: readonly(state),

    clearErrors,
    getError,

    get,
    set,
    setAndValidate,

    submit,
    reset,
    validate: () => validateAndUpdateState(),

    canReset,
    canSet,
    canSubmit,
    canValidate,
    validateField,
  });

  provide(FormProviderSymbol, provider);

  return provider;
}

export function useForm<T>(): UseForm<T> | undefined {
  return inject<UseForm<T> | undefined>(FormProviderSymbol, undefined);
}

export interface UseFormFieldOptions<T> {
  key: MaybeRefOrGetter<string>;
  modelValue: Ref<T | undefined>;
}

export interface UseFormField<T> {
  error: Ref<string | null | undefined>;
  canSet(): boolean;
  get(): T | undefined;
  set(value: T | undefined): void;
  setAndValidate(value: T | undefined): void;
  clearError(): void;
}

export function useFormField<T>({
  key,
  modelValue,
}: UseFormFieldOptions<T>): UseFormField<T> {
  const form = useForm();

  function get() {
    if (key && form) {
      return _get(form.values.value, toValue(key));
    }
  }

  function set(value: any) {
    form?.set(toValue(key), value);
  }

  function setAndValidate(value: any) {
    form?.setAndValidate(toValue(key), value);
  }

  function canSet() {
    return form?.canSet() ?? true;
  }

  function clearError() {
    delete form?.errors.value[toValue(key)];
  }

  watch(
    modelValue,
    (newValue, oldValue) => {
      const currentValue = get();

      if (oldValue === undefined && newValue === oldValue) {
        modelValue.value = currentValue;
        return;
      }

      if (!_isEqual(newValue, currentValue)) {
        setAndValidate(newValue);
      }
    },
    { deep: true, immediate: true }
  );

  watch(
    get,
    (newValue) => {
      if (!_isEqual(newValue, modelValue.value)) {
        modelValue.value = newValue;
      }
    },
    { deep: true }
  );

  return {
    error: computed(() => form?.getError(toValue(key))),
    canSet,
    clearError,
    get,
    set,
    setAndValidate,
  };
}
