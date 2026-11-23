<script setup lang="ts">
import { nextTick, onMounted, ref } from "vue";
import type { InputBoxValidationMessage } from "lenz-sdk";
import type { InputRequest } from ".";

const props = defineProps<{ request: InputRequest }>();

const value = ref(props.request.value);
const message = ref<InputBoxValidationMessage>();
const input = ref<HTMLInputElement>();
let token = 0;

/** Validates the text; only the answer to the latest call counts. Returns whether it may be accepted. */
async function validate() {
  const current = ++token;
  const result = await props.request.validate(value.value);
  if (current !== token) return false;
  message.value = result;
  return result?.severity !== "error";
}

async function accept() {
  if (await validate()) props.request.answer(value.value);
}

onMounted(async () => {
  await nextTick();
  const el = input.value;
  if (!el) return;
  el.focus();
  const [start, end] = props.request.valueSelection ?? [0, el.value.length];
  el.setSelectionRange(start, end);
  await validate();
});
</script>

<template>
  <div class="prompt-input">
    <div class="prompt-row">
      <input
        ref="input"
        v-model="value"
        class="prompt-field"
        :class="{ 'prompt-field-error': message?.severity === 'error' }"
        :type="request.password ? 'password' : 'text'"
        :placeholder="request.placeHolder"
        :aria-label="request.prompt ?? request.title ?? 'Texto'"
        :aria-invalid="message?.severity === 'error' ? true : undefined"
        spellcheck="false"
        autocomplete="off"
        @input="validate"
        @keydown.enter.prevent="accept"
      />
      <button class="ext-btn ext-btn-primary" type="button" @mousedown.prevent @click="accept">
        OK
      </button>
    </div>
    <p
      v-if="message"
      class="prompt-message"
      :class="`prompt-message-${message.severity}`"
      role="alert"
    >
      {{ message.message }}
    </p>
    <p v-else-if="request.prompt" class="prompt-hint">{{ request.prompt }}</p>
    <p v-if="message && request.prompt" class="prompt-hint">{{ request.prompt }}</p>
  </div>
</template>
