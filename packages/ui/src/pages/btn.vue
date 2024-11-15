<script setup lang="ts">
import icon_airplane from 'lenz:icons/airplane';

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
  <div>
    <h1>Hello World!</h1>
    <div class="bg--surface pa-8 rounded-md shadow-md mx-auto w-max">
      <table>
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
              <UiBtn :color @click="handleClick">Botão</UiBtn>
            </td>
            <td>
              <UiBtn @click="handleClick" disabled>Botão</UiBtn>
            </td>
          </tr>
          <tr>
            <td>Default + Icon Left</td>
            <td v-for="(color, key) in colors" :key="key">
              <UiBtn :color @click="handleClick">
                <UiIcon :path="icon_airplane" />
                <span>Botão</span>
              </UiBtn>
            </td>
            <td>
              <UiBtn @click="handleClick" disabled>
                <UiIcon :path="icon_airplane" />
                <span>Botão</span>
              </UiBtn>
            </td>
          </tr>
          <tr>
            <td>Default + Icon Left + Icon Right</td>
            <td v-for="(color, key) in colors" :key="key">
              <UiBtn :color @click="handleClick">
                <UiIcon :path="icon_airplane" />
                <span>Botão</span>
                <UiIcon :path="icon_airplane" />
              </UiBtn>
            </td>
            <td>
              <UiBtn @click="handleClick" disabled>
                <UiIcon :path="icon_airplane" />
                <span>Botão</span>
                <UiIcon :path="icon_airplane" />
              </UiBtn>
            </td>
          </tr>
          <tr>
            <td>Flat</td>
            <td v-for="(color, key) in colors" :key="key">
              <UiBtn :color flat @click="handleClick">Botão</UiBtn>
            </td>
            <td>
              <UiBtn flat disabled>Botão</UiBtn>
            </td>
          </tr>
          <tr>
            <td>Flat + Left Icon</td>
            <td v-for="(color, key) in colors" :key="key">
              <UiBtn :color flat @click="handleClick">
                <UiIcon :path="icon_airplane" />
                <span>Botão</span>
              </UiBtn>
            </td>
            <td>
              <UiBtn flat disabled>
                <UiIcon :path="icon_airplane" />
                <span>Botão</span>
              </UiBtn>
            </td>
          </tr>
          <tr>
            <td>Flat + Right Icon</td>
            <td v-for="(color, key) in colors" :key="key">
              <UiBtn :color flat @click="handleClick">
                <span>Botão</span>
                <UiIcon :path="icon_airplane" />
              </UiBtn>
            </td>
            <td>
              <UiBtn flat disabled>
                <span>Botão</span>
                <UiIcon :path="icon_airplane" />
              </UiBtn>
            </td>
          </tr>
          <tr>
            <td>Flat + Left Icon + Right Icon</td>
            <td v-for="(color, key) in colors" :key="key">
              <UiBtn :color flat @click="handleClick">
                <UiIcon :path="icon_airplane" />
                <span>Botão</span>
                <UiIcon :path="icon_airplane" />
              </UiBtn>
            </td>
            <td>
              <UiBtn flat disabled>
                <UiIcon :path="icon_airplane" />
                <span>Botão</span>
                <UiIcon :path="icon_airplane" />
              </UiBtn>
            </td>
          </tr>
          <tr>
            <td>Loading</td>
            <td v-for="(color, key) in colors" :key="key">
              <UiBtn loading :color>Botão</UiBtn>
            </td>
            <td>
              <UiBtn loading disabled>Botão</UiBtn>
            </td>
          </tr>
          <tr>
            <td>Loading + Flat</td>
            <td v-for="(color, key) in colors" :key="key">
              <UiBtn loading :color flat>Botão</UiBtn>
            </td>
            <td>
              <UiBtn flat loading disabled>Botão</UiBtn>
            </td>
          </tr>
          <tr>
            <td>Icon</td>
            <td v-for="(color, key) in colors" :key="key">
              <UiBtn :color icon @click="handleClick">
                <UiIcon :path="icon_airplane" />
              </UiBtn>
            </td>
            <td>
              <UiBtn disabled icon>
                <UiIcon :path="icon_airplane" />
              </UiBtn>
            </td>
          </tr>
          <tr>
            <td>Icon + Flat</td>
            <td v-for="(color, key) in colors" :key="key">
              <UiBtn :color icon flat @click="handleClick">
                <UiIcon :path="icon_airplane" />
              </UiBtn>
            </td>
            <td>
              <UiBtn disabled icon flat>
                <UiIcon :path="icon_airplane" />
              </UiBtn>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>