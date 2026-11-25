<script setup lang="ts">
defineProps<{
  games: { id: string; title: string; text: string; difficulty: string; open: () => void }[];
}>();
</script>

<template>
  <div class="fgg-games">
    <button
      v-for="game in games"
      :key="game.id"
      type="button"
      class="fgg-card"
      @click="game.open()"
    >
      <span class="fgg-card-top">
        <span class="fgg-card-title">{{ game.title }}</span>
        <span class="fgg-card-level">{{ game.difficulty }}</span>
      </span>
      <span class="fgg-card-text">{{ game.text }}</span>
      <span class="fgg-card-play">Jogar →</span>
    </button>
  </div>
</template>
