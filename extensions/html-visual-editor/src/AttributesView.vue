<script setup lang="ts">
import { computed } from "vue";
import PropertyField from "./PropertyField.vue";
import { PINNED, addableProperties, defaultValue, presentProperties } from "./attributeField";
import { useElementStore } from "./elementStore";
import { session } from "./session";

const current = computed(() => session.value);

const info = computed(() => {
  const s = current.value;
  const el = s?.selected.value;
  if (!s || !el) return null;
  void s.version.value; // the DOM is not reactive: re-read after each edit
  return {
    properties: presentProperties(el),
    addable: addableProperties(el, new Set(el.getAttributeNames())),
    leaf: el.children.length === 0 && !["IMG", "BR", "HR", "INPUT"].includes(el.tagName),
    text: el.textContent ?? "",
  };
});

const value = (e: Event) => (e.target as HTMLInputElement).value;

function setAttribute(name: string, next: string) {
  const el = current.value?.selected.value;
  if (!el) return;
  if (next) el.setAttribute(name, next);
  else el.removeAttribute(name);
  current.value!.commit("Editar atributos");
}

/** Writes a property. Only the pinned ones (ID, classes) disappear when emptied. */
function setProperty(name: string, next: string) {
  const el = current.value?.selected.value;
  if (!el) return;
  if (next === "" && PINNED.includes(name)) el.removeAttribute(name);
  else el.setAttribute(name, next);
  current.value!.commit("Editar atributos");
}

function addProperty(event: Event) {
  const select = event.target as HTMLSelectElement;
  const name = select.value;
  select.value = "";
  const el = current.value?.selected.value;
  if (!name || !el) return;
  const definition = useElementStore().getAttributesOfElement(el.tagName.toLowerCase())?.[name];
  setProperty(name, definition ? defaultValue(definition.schema) : "");
}

function setText(next: string) {
  const el = current.value?.selected.value;
  if (!el) return;
  el.textContent = next;
  current.value!.commit("Editar atributos");
}
</script>

<template>
  <div v-if="info" class="hve-attributes">
    <label v-if="info.leaf" class="hve-field">
      <span>Texto</span>
      <textarea rows="2" :value="info.text" @input="setText(value($event))" />
    </label>
    <PropertyField
      v-for="property in info.properties"
      :key="property.name"
      :name="property.name"
      :value="property.value"
      :definition="property.definition"
      :removable="!property.pinned"
      @change="setProperty(property.name, $event)"
      @remove="setAttribute(property.name, '')"
    />
    <select
      v-if="info.addable.length"
      class="hve-add"
      aria-label="Adicionar atributo"
      value=""
      @change="addProperty"
    >
      <option value="" disabled>+ Adicionar atributo…</option>
      <optgroup v-for="group in info.addable" :key="group.label" :label="group.label">
        <option
          v-for="item in group.items"
          :key="item.name"
          :value="item.name"
          :title="item.description"
        >
          {{ item.label }} ({{ item.name }})
        </option>
      </optgroup>
    </select>
  </div>
</template>
