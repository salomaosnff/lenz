<script setup lang="ts">
import UiTextField from '../components/UiTextField/UiTextField.vue';

async function handleClick(event: MouseEvent) {
  await new Promise(resolve => setTimeout(resolve, 2000))
  console.log('Button clicked!', event)
}

const colors = {
  'Padrão': undefined,
  'Primário': 'primary',
  'Secundário': 'secondary',
  'Sucesso': 'success',
  'Perigo': 'danger',
  'Aviso': 'warning',
  'Informação': 'info',
  'Cor qualquer': "'red'",
}
</script>

<template>
  <div class="pa-8">
    <h1>TextField</h1>
    <UiSelect :items="['A', 'B', 'C', 'D']" multiple search clearable />
    <div class="bg--surface pa-8 rounded-md shadow-md mx-auto w-full overflow-auto">
      <table class="w-full">
        <thead>
          <tr>
            <th></th>
            <th v-for="(_, key) in colors" :key="key">{{ key }}</th>
            <th>Inativo</th>
          </tr>
        </thead>
        <tbody class="text-center">
          <tr>
            <td>Default</td>
            <td v-for="(color, key) in colors" :key="key">
              <UiTextField placeholder="Digite..." :color />
            </td>
            <td>
              <UiTextField placeholder="Digite..." disabled />
            </td>
          </tr>
          <tr>
            <td>Default + Icon Left</td>
            <td v-for="(color, key) in colors" :key="key">
              <UiTextField placeholder="Digite..." :color prepend-icon="mdiAirplane" />
            </td>
            <td>
              <UiTextField placeholder="Digite..." disabled prepend-icon="mdiAirplane" />
            </td>
          </tr>
          <tr>
            <td>Default + Icon Left + Icon Right</td>
            <td v-for="(color, key) in colors" :key="key">
              <UiTextField placeholder="Digite..." :color prepend-icon="mdiAirplane" append-icon="mdiAirplane" />
            </td>
            <td>
              <UiTextField placeholder="Digite..." disabled prepend-icon="mdiAirplane" append-icon="mdiAirplane" />
            </td>
          </tr>
          <tr>
            <td>Loading</td>
            <td v-for="(color, key) in colors" :key="key">
              <UiTextField placeholder="Digite..." loading :color />
            </td>
            <td>
              <UiTextField placeholder="Digite..." loading disabled />
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <UiTextField class="text-3" placeholder="Pesquisar..." type="search" />
    <UiTextField placeholder="Digite..." error="Este campo está inválido!" />
    <UiTextField placeholder="Digite..." hint="Eu sou uma mensagem de ajuda" />
    <UiTextField placeholder="Digite..." clearable hint="Eu sou um campo apagável" />
    <UiTextField placeholder="Texto livre..." :rows="8" multiline />

    <UiInput error="Este campo está inválido!" />

  </div>
</template>