<script setup lang="ts">
import { markRaw, ref } from 'vue';
import { z } from 'zod';

const form = ref({})

const schema = markRaw(
  z.object({
    name: z.string().default('Teste'),
    password: z.string().min(6, 'Este campo deve ter no mínimo 6 caracteres')
      .max(20, 'Este campo deve ter no máximo 20 caracteres').default('123456'),
  }).default({})
)

async function onFormSubmit(values: z.output<typeof schema>) {
  console.log(values)
  await new Promise(resolve => setTimeout(resolve, 3000))
}

</script>



<template>
  <div class="pa-8 mx-auto max-w-150">

    <UiForm v-model="form" :schema="schema" @submit="onFormSubmit">
      <UiTextField name="name" placeholder="Digite..." label="Nome" />
      <UiTextField name="password" placeholder="Digite..." label="Password" />

      <UiBtn class="mt-4" type="reset" flat>Reset</UiBtn>
      <UiBtn class="mt-4" type="submit">Submit</UiBtn>
    </UiForm>
    <pre class="pa-4 bg--surface mt-8 rounded-md">{{ form }}</pre>

    <input v-model="form.password" />
  </div>
</template>