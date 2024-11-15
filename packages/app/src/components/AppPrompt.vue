<script setup lang="ts">
import { PromptOptions } from '../store/dialog';

const dialogStore = useDialogStore();
const value = ref<string>();

watch(() => (dialogStore.currentDialog as PromptOptions)?.defaultValue, (val) => {
  value.value = val;
}, {
  immediate: true
});

function respond(fn: (value: any) => void, v: any) {
  fn(v);
  value.value = ''
}

const {Escape} = useMagicKeys()

whenever(Escape, () => {
  if (!dialogStore.currentResolver) return
  dialogStore.currentResolver.reject(new Error('User canceled'))
})

</script>
<template>
  <Transition>
    <form v-if="dialogStore.currentDialog && dialogStore.currentResolver" class="app-prompt" @submit.prevent>
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
              :type="dialogStore.currentDialog.hidden ? 'password' : 'text'"
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
                respond(dialogStore.currentResolver.reject, new Error('User canceled'))
              "
              >{{ dialogStore.currentDialog.cancelText }}</UiBtn
            >
            <UiBtn
              color="primary"
              type="submit"
              @click="
                respond(dialogStore.currentResolver.resolve, (
                  value ?? dialogStore.currentDialog.defaultValue
                ))
              "
              >{{ dialogStore.currentDialog.confirmText }}</UiBtn>
          </div>
        </div>
      </AppPanel>
    </form>
  </Transition>
</template>
<style lang="scss">
.app-prompt {
  box-shadow: 0 0 0 150vmax rgba(0, 0, 0, 0.5);
  
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
