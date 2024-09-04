<script setup lang="ts">
import AppSettingsForm from "../components/AppSettingsForm/AppSettingsForm.vue";
import { SettingsField } from "../components/AppSettingsForm/types";

const value = ref();
const fields: SettingsField[] = [
  {
    name: "style",
    type: "select",
    label: "Estilo da borda",
    options: [
      { label: "Sólida", value: "solid" },
      { label: "Tracejada", value: "dashed" },
      { label: "Pontilhada", value: "dotted" },
    ],
  },
  {
    name: "size",
    type: "text",
    label: "Tamanho",
    required: true,
    hint: "Em pixels",
    placeholder: "Ex: 16px",
  },
  {
    name: "color",
    type: "text",
    label: "Cor",
    required: true,
  },
  // {
  //   name: "gender",
  //   label: "Gênero",
  //   type: "select",
  //   options: [
  //     { label: "Masculino", value: "MASC" },
  //     { label: "Feminino", value: "FEM" },
  //     { label: "Outro", value: "OTH" },
  //   ],
  // },
  // {
  //   name: "keepLoggedIn",
  //   type: "boolean",
  //   default: false,
  //   label: "Manter conectado",
  //   hint: "Mantenha-me conectado neste dispositivo",
  //   required: true,
  // },
];
</script>

<template>
  <div class="pa-8">
    <AppSettingsForm v-model:valid-values="value" :fields="fields">
      <template #footer>
        <UiBtn type="submit" no-form-integration>Salvar</UiBtn>
      </template>
    </AppSettingsForm>
    <pre
      :style="
        value && {
          border: `${value.style} ${value.size} ${value.color}`,
        }
      "
      >{{ value }}</pre
    >
  </div>
</template>
