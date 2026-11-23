<script setup lang="ts">
import { openKeybindingsPage } from "../keybindings/page";
</script>

<template>
  <ul class="placeholder-list">
    <li
      class="placeholder-item"
      tabindex="0"
      @click="openKeybindingsPage()"
      @keydown.enter="openKeybindingsPage()"
    >
      Atalhos de teclado
    </li>
  </ul>
</template>
