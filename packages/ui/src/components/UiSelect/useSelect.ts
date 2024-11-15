import { isEqual } from "lodash-es";
import { computed, MaybeRefOrGetter, Ref, toValue } from "vue";

interface UseSelectOptions<T, V> {
  search?: Ref<string | undefined | null>;
  value: Ref<V | V[] | undefined | null>;
  items: MaybeRefOrGetter<T[]>;
  multiple?: MaybeRefOrGetter<boolean>;
  returnObject?: MaybeRefOrGetter<boolean>;

  getKey?(item: T, index: number): string | number;
  getLabel?(item: T): string;
  getValue?(item: T): V;
  compare?(a: V, b: V): boolean;
  filter?(option: SelectOption<T, V>, query: string): boolean;
}

export interface SelectOption<T = unknown, V = unknown> {
  key: string | number;
  label: string;
  data: T;
  value: V;
  isSelected: boolean;
}

function isObject(value: unknown): value is Record<string, any> {
  return typeof value === "object" && value !== null;
}

export function getKeyOrDefault<T>(
  item: T,
  index: number,
  getKey?: (item: T, index: number) => string | number
): number | string {
  if (typeof getKey === "function") {
    return getKey(item, index);
  }

  if (isObject(item)) {
    return item.id ?? item.key ?? JSON.stringify(item);
  }

  return String(item);
}

export function getLabelOrDefault<T>(item: T, getLabel?: (item: T) => string) {
  if (typeof getLabel === "function") {
    return getLabel(item);
  }

  if (isObject(item)) {
    return item.name ?? item.label ?? JSON.stringify(item);
  }

  return String(item);
}

export function getValueOrDefault<T, V>(
  item: T,
  getKey?: (item: T, index: number) => string | number,
  getValue?: (item: T) => V
): V {
  if (typeof getValue === "function") {
    return getValue(item);
  }

  if (isObject(item)) {
    return (
      item.id ?? item.value ?? item.key ?? getKeyOrDefault(item, 0, getKey)
    );
  }

  return item as unknown as V;
}

export function filterOrDefault<T, V>(
  option: SelectOption<T, V>,
  query: string,
  filter?: (option: SelectOption<T, V>, query: string) => boolean
) {
  if (typeof filter === "function") {
    return filter(option, query);
  }

  query = query.toLowerCase();

  return option.label.toLowerCase().includes(query);
}

export function compareOrDefault<V>(
  a: V,
  b: V,
  compare?: (a: V, b: V) => boolean
) {
  if (typeof compare === "function") {
    return compare(a, b);
  }

  return isEqual(a, b);
}

export function useSelect<T, V>(options: UseSelectOptions<T, V>) {
  const valueSet = computed(() => {
    const value = toValue(options.value);
    const valueSet = new Set((Array.isArray(value) ? value : [value]) as V[]);

    return valueSet;
  });

  const allOptions = computed(() => {
    const items = toValue(options.items);
    const isReturnObject = toValue(options.returnObject);

    const selectOptions = items.map<SelectOption<T, V>>((data, index) => {
      return {
        data,
        key: getKeyOrDefault(data, index, options.getKey),
        label: getLabelOrDefault(data, options.getLabel),
        value: (isReturnObject
          ? data
          : getValueOrDefault(data, options.getKey, options.getValue)) as V,
        get isSelected() {
          return Array.from(valueSet.value).some((value) =>
            compareOrDefault(value, this.value, options.compare)
          );
        },
      };
    });

    if (toValue(options.returnObject)) {
      for (const value of valueSet.value) {
        const option = selectOptions.find((option) =>
          compareOrDefault(option.value, value, options.compare)
        );

        if (!option) {
          selectOptions.unshift({
            data: value as unknown as T,
            key: getKeyOrDefault(value as unknown as T, -1, options.getKey),
            label: getLabelOrDefault(value as unknown as T, options.getLabel),
            value,
            get isSelected() {
              return Array.from(valueSet.value).some((value) =>
                compareOrDefault(value, this.value, options.compare)
              );
            },
          });
        }
      }
    }

    return selectOptions;
  });

  const selectedOptions = computed(() =>
    allOptions.value.filter((option) => option.isSelected)
  );
  const selectOption = computed(() => selectedOptions.value[0]);

  function select(option: SelectOption<T, V>) {
    if (option.isSelected) {
      return;
    }

    if (toValue(options.multiple)) {
      const newValueSet = new Set<V>(valueSet.value);
      newValueSet.add(option.value);
      options.value.value = Array.from(newValueSet);
    } else {
      options.value.value = option.value;
    }
  }

  function unselect(option: SelectOption<T, V>) {
    if (!option.isSelected) {
      return;
    }

    if (toValue(options.multiple)) {
      const newValueSet = new Set<V>(valueSet.value);
      newValueSet.delete(option.value);
      options.value.value = Array.from(newValueSet);
    } else {
      options.value.value = undefined;
    }
  }

  function toggle(option: SelectOption<T, V>) {
    if (!option.isSelected) {
      return select(option);
    }

    if (toValue(options.multiple)) {
      return unselect(option);
    }
  }

  const filteredOptions = computed(() => {
    const query = toValue(options.search) ?? "";

    if (query === "") {
      return allOptions.value;
    }

    return allOptions.value.filter((option) =>
      filterOrDefault(option, query, options.filter)
    );
  });

  function clear() {
    if (toValue(options.multiple)) {
      options.value.value = [];
    } else {
      options.value.value = undefined;
    }
  }

  return {
    allOptions,
    selectedOptions,
    selectOption,
    filteredOptions,
    select,
    unselect,
    toggle,
    clear,
  };
}
