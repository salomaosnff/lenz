<script setup lang="ts">
import { builders } from "./builders";
</script>

<template>
  <div class="hve-elements">
    <ul v-if="builders.length" class="hve-el-list">
      <li v-for="builder in builders" :key="builder.id">
        <button
          type="button"
          class="hve-el"
          :title="`Abrir o construtor de ${builder.title.toLowerCase()}`"
          @click="builder.open()"
        >
          <Icon :name="builder.icon" class="hve-el-icon" />
          <span class="hve-el-body">
            <span class="hve-el-head">
              <span class="hve-el-label">{{ builder.title }}</span>
              <Icon name="lucide:external-link" class="hve-el-open" />
            </span>
            <span v-if="builder.description" class="hve-el-description">{{
              builder.description
            }}</span>
          </span>
        </button>
      </li>
    </ul>
    <p v-else class="hve-el-empty">Nenhum construtor de elementos instalado.</p>
  </div>
</template>
