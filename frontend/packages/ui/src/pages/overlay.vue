<template>
  <UiOverlayMenu>
    <template #activator="{ attrs }">
      <UiBtn v-bind="attrs">Menu</UiBtn>
    </template>
    <UiPopup>
      Teste
    </UiPopup>
  </UiOverlayMenu>
</template>