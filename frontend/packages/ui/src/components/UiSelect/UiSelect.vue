<script setup lang="ts" generic="T, V">
import icon_chevron_down from "lenz:icons/chevron-down";
import { computed } from "vue";

import { useFormField } from "../../composable/useForm";
import { vColor } from "../../directives/vColor";
import {
  compareOrDefault,
  filterOrDefault,
  getKeyOrDefault,
  getLabelOrDefault,
  getValueOrDefault,
  SelectOption,
  useSelect,
} from "./useSelect";

const props = withDefaults(
  defineProps<{
    name?: string;
    label?: string;
    color?: string;
    error?: string;
    items: T[];

    placeholder?: string;

    search?: boolean;
    multiple?: boolean;
    returnObject?: boolean;
    clearable?: boolean;
    disabled?: boolean;
    hideMessages?: boolean;

    compare?(a: V, b: V): boolean;
    filter?(option: SelectOption<T, V>, query: string): boolean;
    getValue?(item: T): V;
    getLabel?(item: T): string;
    getKey?(item: T): string | number;
  }>(),
  {
    color: "primary",
    placeholder: "Selecione...",
  }
);

const modelValue = defineModel<V | V[]>();

const { canSet, error: fieldError } = useFormField({
  key: () => props.name ?? "",
  modelValue,
});

const isOpen = defineModel<boolean>("open");
const searchQuery = defineModel<string>("searchQuery");

const { filteredOptions, selectedOptions, toggle, clear } = useSelect({
  items: () => props.items,
  value: modelValue,
  search: searchQuery,

  compare: (a, b) => compareOrDefault(a, b, props.compare),
  filter: (option, query) => filterOrDefault(option, query, props.filter),
  getKey: (item, index) => getKeyOrDefault(item, index, props.getKey),
  getLabel: (item) => getLabelOrDefault(item, props.getLabel),
  getValue: (item) => getValueOrDefault(item, props.getKey, props.getValue),

  multiple: () => props.multiple,
  returnObject: () => props.returnObject ?? false,
});

const isDisabled = computed(() => props.disabled || !canSet());
</script>
<template>
  <UiOverlayMenu v-model:visible="isOpen" full close-on-click :close-on-click-content="!multiple"
    :disabled="isDisabled">
    <template #activator="{ attrs }">
      <UiInput v-bind="attrs" :disabled="isDisabled" class="cursor-pointer" :label :hideMessages
        :error="error || fieldError || ''" :clearable @clear="clear">
        <div class="pt-1 pl-2 overflow-hidden relative">
          <Transition name="ui-select__selection">
            <template v-if="selectedOptions.length === 0" key="placeholder">
              <p class="fg--muted">{{ placeholder }}</p>
            </template>
            <template v-else-if="selectedOptions.length === 1">
              <slot name="selected" :option="selectedOptions[0]">
                <slot name="option" :option="selectedOptions[0]">
                  <p :key="selectedOptions[0].key">{{ selectedOptions[0].label }}</p>
                </slot>
              </slot>
            </template>
            <template v-else>
              <slot name="selected" :options="selectedOptions">
                <span :key="`count-${selectedOptions.length}`">{{ selectedOptions.length }} selecionados</span>
              </slot>
            </template>
          </Transition>
        </div>

        <template #append>
          <slot name="append">
            <UiIcon :path="icon_chevron_down" class="mr-2 text-5 transition-all" :class="{
              'rotate-180': isOpen,
            }" />
          </slot>
        </template>
      </UiInput>
    </template>

    <UiPopup v-color="color">
      <UiTextField v-if="search" v-model="searchQuery" class="mb-4 mt--4" type="search" clearable
        placeholder="Pesquisar..." autofocus hide-messages />
      <ul class="mx--4 mb--2" v-if="filteredOptions.length">
        <TransitionGroup>
          <li v-for="option in filteredOptions" :key="option.key"
            class="ui-select__item flex gap-2 hover:bg--surface2 cursor-pointer items-center"
            :class="{ '!bg--var': !multiple && option.isSelected }" @click="toggle(option)">
            <UiCheckbox v-if="multiple" :model-value="option.isSelected" class="mt-1 w-full py-2 px-4">
              <slot name="option" :option>
                {{ option.label }}
              </slot>
            </UiCheckbox>
            <slot name="option" :option="option">
              <p class="py-2 px-4">{{ option.label }}</p>
            </slot>
          </li>
        </TransitionGroup>
      </ul>
      <div v-else class="text-center opacity-50 pa-8">
        <p v-if="searchQuery">Nenhum resultado encontrado</p>
        <p v-else>Não há opções disponíveis</p>
      </div>
    </UiPopup>
  </UiOverlayMenu>
</template>

<style lang="scss">
.ui-select {
  &__item {
    transform-origin: 1.5rem 1.5rem;

    &+& {
      border-top: 1px solid var(--color-surface-muted);
    }

    &.v-move,
    &.v-enter-active,
    &.v-leave-active {
      transition: all 0.25s ease;
    }

    &.v-leave-active {
      position: absolute;
    }

    &.v-enter-from,
    &.v-leave-to {
      opacity: 0;
      height: 0;
    }
  }

  &__selection {

    &-enter-active,
    &-leave-active {
      display: block;
      transition: all 0.25s ease;
    }

    &-leave-active {
      position: absolute;
    }

    &-enter-from {
      transform: translateY(100%);
      opacity: 0;
    }

    &-enter-to {
      transform: translateY(0);
      opacity: 1;
    }

    &-leave-from {
      transform: translateY(0);
      opacity: 1;
    }

    &-leave-to {
      transform: translateY(-50%);
      opacity: 0;
    }
  }
}
</style>
