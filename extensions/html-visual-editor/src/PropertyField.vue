<script setup lang="ts">
import { computed, ref } from "vue";
import {
  TagsInputInput,
  TagsInputItem,
  TagsInputItemDelete,
  TagsInputItemText,
  TagsInputRoot,
} from "reka-ui";
import type { AttributeDefinition } from "./elementStore";
import { fieldKind } from "./attributeField";

const props = defineProps<{
  name: string;
  value: string;
  definition?: AttributeDefinition;
  removable?: boolean;
}>();
const emit = defineEmits<{ change: [value: string]; remove: [] }>();

const field = computed(() => fieldKind(props.definition?.schema ?? {}));
// Keeps a value the spec does not list (e.g. written by hand) selectable.
const choices = computed(() => {
  const options = field.value.options ?? [];
  return props.value && !options.includes(props.value) ? [props.value, ...options] : options;
});
const listId = computed(() => `hve-list-${props.name}`);
const input = (e: Event) => (e.target as HTMLInputElement).value;

// `class` is a list of tags; the tags input rejects duplicates and splits on spaces.
const isClassList = computed(() => props.name === "class");
const tokens = (text: string) => [...new Set(text.split(/\s+/).filter(Boolean))];
const classes = computed(() => tokens(props.value));
const classField = ref<{ $el: HTMLElement } | null>(null);
const setClasses = (list: unknown) => emit("change", (list as string[]).join(" "));
const focusClassInput = () => classField.value?.$el.focus();
</script>

<template>
  <div v-if="isClassList" class="hve-classes">
    <div class="hve-classes-head">
      <span>{{ definition?.label ?? name }}</span>
      <button class="hve-icon" title="Adicionar classe" @click="focusClassInput">
        <Icon name="lucide:plus" class="size-3.5" />
      </button>
    </div>
    <TagsInputRoot
      :model-value="classes"
      delimiter=" "
      add-on-blur
      add-on-paste
      class="hve-tags"
      @update:model-value="setClasses"
    >
      <TagsInputItem v-for="item in classes" :key="item" :value="item" class="hve-tag">
        <TagsInputItemText />
        <TagsInputItemDelete class="hve-tag-delete" title="Remover classe">
          <Icon name="lucide:x" class="size-3" />
        </TagsInputItemDelete>
      </TagsInputItem>
      <TagsInputInput ref="classField" placeholder="Nova classe…" class="hve-tags-input" />
    </TagsInputRoot>
  </div>
  <div v-else class="hve-prop">
    <!-- The description of the attribute shows as a tooltip on the label. -->
    <label
      class="hve-field"
      :class="{ obsolete: !!definition?.status }"
      :title="definition?.description"
    >
      <span>{{ definition?.label ?? name }}</span>
      <input
        v-if="field.kind === 'boolean'"
        type="checkbox"
        class="hve-check"
        :checked="true"
        @change="emit('remove')"
      />
      <select
        v-else-if="field.kind === 'enum'"
        :value="value"
        @change="emit('change', input($event))"
      >
        <option v-for="option in choices" :key="option" :value="option">
          {{ option || "(vazio)" }}
        </option>
      </select>
      <input
        v-else-if="field.kind === 'number'"
        type="number"
        :min="field.min"
        :step="field.integer ? 1 : 'any'"
        :value="value"
        @input="emit('change', input($event))"
      />
      <template v-else>
        <input
          :value="value"
          :list="field.options ? listId : undefined"
          @input="emit('change', input($event))"
        />
        <datalist v-if="field.options" :id="listId">
          <option v-for="option in field.options" :key="option" :value="option" />
        </datalist>
      </template>
    </label>
    <button v-if="removable" class="hve-icon" title="Remover atributo" @click="emit('remove')">
      <Icon name="lucide:x" class="size-3.5" />
    </button>
  </div>
</template>
