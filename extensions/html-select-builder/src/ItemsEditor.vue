<script setup lang="ts">
/** One row of the list: an option or a group, with what the buttons need to know. */
export interface Row {
  kind: "option" | "group";
  label: string;
  value: string;
  selected: boolean;
  disabled: boolean;
  canUp: boolean;
  canDown: boolean;
}

defineProps<{ rows: Row[] }>();
const emit = defineEmits<{
  update: [index: number, patch: Partial<Pick<Row, "label" | "value" | "selected" | "disabled">>];
  add: [index: number | null, kind: "option" | "group"];
  remove: [index: number];
  move: [index: number, direction: -1 | 1];
}>();

const text = (event: Event) => (event.target as HTMLInputElement).value;
const checked = (event: Event) => (event.target as HTMLInputElement).checked;
</script>

<template>
  <div class="hsb-items">
    <div v-if="rows.length" class="hsb-head" aria-hidden="true">
      <span /> <span>Rótulo</span> <span>Valor</span> <span title="Marcada ao abrir">Padrão</span>
      <span title="Não pode ser escolhida">Off</span> <span />
    </div>

    <div
      v-for="(row, index) in rows"
      :key="index"
      class="hsb-row"
      :class="{ group: row.kind === 'group' }"
    >
      <span class="hsb-move">
        <button
          type="button"
          title="Subir"
          aria-label="Subir"
          :disabled="!row.canUp"
          @click="emit('move', index, -1)"
        >
          <Icon name="lucide:chevron-up" class="size-3" />
        </button>
        <button
          type="button"
          title="Descer"
          aria-label="Descer"
          :disabled="!row.canDown"
          @click="emit('move', index, 1)"
        >
          <Icon name="lucide:chevron-down" class="size-3" />
        </button>
      </span>

      <template v-if="row.kind === 'group'">
        <label class="hsb-group-label">
          <Icon name="lucide:folder" class="size-3.5" />
          <input
            :value="row.label"
            placeholder="Nome do grupo"
            aria-label="Nome do grupo"
            @change="emit('update', index, { label: text($event) })"
          />
        </label>
        <span />
        <input
          type="checkbox"
          :checked="row.disabled"
          aria-label="Grupo desativado"
          @change="emit('update', index, { disabled: checked($event) })"
        />
      </template>

      <template v-else>
        <input
          :value="row.label"
          placeholder="Rótulo"
          aria-label="Rótulo da opção"
          @change="emit('update', index, { label: text($event) })"
        />
        <input
          :value="row.value"
          placeholder="(igual ao rótulo)"
          aria-label="Valor da opção"
          spellcheck="false"
          @change="emit('update', index, { value: text($event) })"
        />
        <input
          type="checkbox"
          :checked="row.selected"
          aria-label="Marcada ao abrir"
          @change="emit('update', index, { selected: checked($event) })"
        />
        <input
          type="checkbox"
          :checked="row.disabled"
          aria-label="Opção desativada"
          @change="emit('update', index, { disabled: checked($event) })"
        />
      </template>

      <button
        type="button"
        class="hsb-remove"
        title="Remover"
        aria-label="Remover"
        @click="emit('remove', index)"
      >
        <Icon name="lucide:trash-2" class="size-3.5" />
      </button>
    </div>

    <p v-if="!rows.length" class="hsb-empty">Sem opções ainda.</p>

    <div class="hsb-add">
      <button type="button" @click="emit('add', rows.length ? rows.length - 1 : null, 'option')">
        <Icon name="lucide:plus" class="size-3.5" /> Opção
      </button>
      <button type="button" @click="emit('add', null, 'group')">
        <Icon name="lucide:folder-plus" class="size-3.5" /> Grupo
      </button>
    </div>
  </div>
</template>
