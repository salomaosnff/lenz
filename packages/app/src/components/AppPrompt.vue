<script setup lang="ts">
import { PromptSuggestion } from "lenz:dialog";
import { PromptOptions } from "../store/dialog";

const dialogStore = useDialogStore();
const value = ref<string>();

watch(
  () => (dialogStore.currentDialog as PromptOptions)?.defaultValue,
  (val) => {
    value.value = val;
  },
  {
    immediate: true,
  }
);

function respond(fn: (value: any) => void, v: any) {
  fn(v);
  value.value = "";
}

const { Escape } = useMagicKeys();

whenever(Escape, () => {
  if (!dialogStore.currentResolver) return;
  dialogStore.currentResolver.reject(new Error("User canceled"));
});

const suggestions = ref<PromptSuggestion[]>([]);

watchDebounced(
  value,
  async (val) => {
    if (
      dialogStore.currentDialog?.type !== "prompt" ||
      !dialogStore.currentDialog?.getSuggestions
    ) {
      return;
    }

    suggestions.value = await dialogStore.currentDialog.getSuggestions(
      val ?? ""
    );
  },
  { debounce: 150, immediate: true }
);
</script>
<template>
  <Transition>
    <form
      v-if="dialogStore.currentDialog && dialogStore.currentResolver"
      class="app-prompt"
      @submit.prevent
    >
      <AppPanel v-if="dialogStore.currentDialog?.type === 'confirm'">
        <div class="flex gap-2 items-end">
          <div class="flex-1">
            <p v-if="dialogStore.currentDialog.title" class="font-bold">
              {{ dialogStore.currentDialog.title }}
            </p>
            <p v-if="dialogStore.currentDialog.message">
              {{ dialogStore.currentDialog.message }}
            </p>
          </div>

          <div class="flex gap-2">
            <UiBtn
              flat
              color="primary"
              @click="dialogStore.currentResolver?.resolve(false)"
              >{{ dialogStore.currentDialog.cancelText }}</UiBtn
            >
            <UiBtn
              color="primary"
              type="submit"
              @click="dialogStore.currentResolver?.resolve(false)"
              >{{ dialogStore.currentDialog.confirmText }}</UiBtn
            >
          </div>
        </div>
      </AppPanel>
      <AppPanel v-else-if="dialogStore.currentDialog?.type === 'prompt'">
        <div class="flex gap-2 items-end">
          <div class="flex-1">
            <p v-if="dialogStore.currentDialog.title" class="font-bold">
              {{ dialogStore.currentDialog.title }}
            </p>
            <p v-if="dialogStore.currentDialog.message">
              {{ dialogStore.currentDialog.message }}
            </p>

            <UiTextField
              v-model="value"
              :type="
                dialogStore.currentDialog.hidden
                  ? 'password'
                  : dialogStore.currentDialog.inputType
              "
              :placeholder="dialogStore.currentDialog.placeholder"
              hide-messages
              autofocus
            />
          </div>

          <div class="flex gap-2">
            <UiBtn
              flat
              color="primary"
              @click="
                respond(
                  dialogStore.currentResolver.reject,
                  new Error('User canceled')
                )
              "
              >{{ dialogStore.currentDialog.cancelText }}</UiBtn
            >
            <UiBtn
              color="primary"
              type="submit"
              @click="
                respond(
                  dialogStore.currentResolver.resolve,
                  value ?? dialogStore.currentDialog.defaultValue
                )
              "
              >{{ dialogStore.currentDialog.confirmText }}</UiBtn
            >
          </div>
        </div>
        <ul>
          <li
            v-for="{ value, title = value, description = value } of suggestions"
            :key="value"
            class="overflow-hidden mb-1"
            @click="respond(dialogStore.currentResolver.resolve, value)"
          >
            <div
              class="flex gap-2 rounded-md pa-2 cursor-pointer hover:bg--surface-muted items-center w-full"
            >
              <div class="flex-1">
                <p>
                  {{ title }}
                </p>
                <p v-if="description" class="text-3 fg--muted">
                  {{ description }}
                </p>
              </div>
            </div>
          </li>
        </ul>
      </AppPanel>
    </form>
  </Transition>
</template>
<style lang="scss">
.app-prompt {
  box-shadow: 0 0 0 150vmax rgba(0, 0, 0, 0.5);
  border-radius: 0.5rem;

  &.v-enter-active,
  &.v-leave-active {
    transition: all 0.3s;
  }

  &.v-enter-from,
  &.v-leave-to {
    opacity: 0;
    transform: translateY(-100%);
  }
}
</style>
