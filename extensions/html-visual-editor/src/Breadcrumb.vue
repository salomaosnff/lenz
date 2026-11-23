<script setup lang="ts">
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuRoot,
  DropdownMenuTrigger,
} from "reka-ui";
import { computed } from "vue";
import { fold } from "./breadcrumb";
import { describe } from "./model";

const props = defineProps<{
  /** From the page down to the selected element. */
  path: HTMLElement[];
  /** The edits so far: the elements are not reactive, so this says when to read them again. */
  version: number;
}>();
const emit = defineEmits<{ select: [el: HTMLElement] }>();

const SKIPPED = new Set(["SCRIPT", "STYLE", "TEMPLATE", "LINK", "META"]);

const folded = computed(() => fold(props.path));

/** The elements inside one, to go to from the arrow after it. */
function childrenOf(el: HTMLElement) {
  void props.version;
  return [...el.children].filter((child) => !SKIPPED.has(child.tagName)) as HTMLElement[];
}

const last = computed(() => props.path[props.path.length - 1]);
</script>

<template>
  <nav class="hve-crumbs" aria-label="Elementos">
    <template
      v-for="(group, groupIndex) in [folded.head, folded.hidden, folded.tail]"
      :key="groupIndex"
    >
      <!-- The folded middle: one button that lists the elements that did not fit. -->
      <template v-if="groupIndex === 1 && group.length">
        <DropdownMenuRoot>
          <DropdownMenuTrigger
            class="hve-crumb hve-crumb-more"
            title="Elementos ocultos"
            aria-label="Elementos ocultos"
          >
            …
          </DropdownMenuTrigger>
          <DropdownMenuPortal>
            <DropdownMenuContent class="hve-crumb-menu" align="start" :side-offset="4">
              <DropdownMenuItem
                v-for="el in group"
                :key="describe(el)"
                class="hve-crumb-item"
                @select="emit('select', el)"
              >
                {{ describe(el) }}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenuPortal>
        </DropdownMenuRoot>
        <Icon name="lucide:chevron-right" class="hve-crumb-sep" />
      </template>

      <template v-else v-for="(el, index) in group" :key="`${groupIndex}-${index}`">
        <button
          class="hve-crumb"
          :class="{ current: el === last }"
          :title="describe(el)"
          :aria-current="el === last ? 'true' : undefined"
          @click="emit('select', el)"
        >
          {{ describe(el) }}
        </button>
        <!-- The arrow lists what is inside the element before it, as the breadcrumb of VS Code does. -->
        <DropdownMenuRoot v-if="childrenOf(el).length">
          <DropdownMenuTrigger class="hve-crumb-sep-button" aria-label="Elementos dentro">
            <Icon name="lucide:chevron-right" class="hve-crumb-sep" />
          </DropdownMenuTrigger>
          <DropdownMenuPortal>
            <DropdownMenuContent class="hve-crumb-menu" align="start" :side-offset="4">
              <DropdownMenuItem
                v-for="(child, i) in childrenOf(el)"
                :key="i"
                class="hve-crumb-item"
                @select="emit('select', child)"
              >
                {{ describe(child) }}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenuPortal>
        </DropdownMenuRoot>
        <Icon v-else-if="el !== last" name="lucide:chevron-right" class="hve-crumb-sep" />
      </template>
    </template>
  </nav>
</template>
