<script setup lang="ts">
import { useDark } from '@vueuse/core';
import { computed, ref } from 'vue';
import UiMenuGroup from '../components/UiMenu/UiMenuGroup.vue';
import UiMenuItem from '../components/UiMenu/UiMenuItem.vue';
import UiMenuItemSeparator from '../components/UiMenu/UiMenuItemSeparator.vue';

const autoSave = ref<boolean>(false);

const isDark = useDark({
    valueDark: 'theme--dark',
    valueLight: 'theme--light'
});
const theme = computed({
    get: () => isDark.value ? 'dark' : 'light',
    set: (value: string) => isDark.value = value === 'dark'
})
</script>

<template>
    <UiMenuBar>
        <UiMenuGroup>
            <template #title>Arquivo</template>
            <UiMenuItem>
                <p>Novo</p>
                <template #right>
                    <UiKbd>Ctrl + N</UiKbd>
                </template>
            </UiMenuItem>
            <UiMenuGroup disabled>
                <template #title>Novo arquivo</template>
                <UiMenuItem>
                    <p>HTML</p>
                </UiMenuItem>
                <UiMenuItem>
                    <p>CSS</p>
                </UiMenuItem>
                <UiMenuItem>
                    <p>JavaScript</p>
                </UiMenuItem>
            </UiMenuGroup>
            <UiMenuItem>
                <p>Abrir</p>
                <template #right>
                    <UiKbd>Ctrl + O</UiKbd>
                </template>
            </UiMenuItem>
            <UiMenuItem>
                <p>Salvar</p>
                <template #right>
                    <UiKbd>Ctrl + S</UiKbd>
                </template>
            </UiMenuItem>
            <UiMenuItem disabled>
                <p>Salvar como...</p>
                <template #right>
                    <UiKbd>Ctrl + Shift + S</UiKbd>
                </template>
            </UiMenuItem>
            <UiMenuItemSeparator />
            <UiMenuItem v-model:check="autoSave">
                <p>Salvar automaticamente</p>
            </UiMenuItem>
            <UiMenuItemSeparator />
            <UiMenuItem v-model:check.radio="theme" checked-value="light">
                <p>Tema Claro</p>
            </UiMenuItem>
            <UiMenuItem v-model:check.radio="theme" checked-value="dark">
                <p>Tema escuro</p>
            </UiMenuItem>
            <UiMenuItemSeparator />

            <UiMenuItem>
                <p>Fechar</p>
                <template #right>
                    <UiKbd>Ctrl + W</UiKbd>
                </template>
            </UiMenuItem>
        </UiMenuGroup>


        <UiMenuGroup>
            <template #title>Deep Menu</template>
            <UiMenuItem>
                <p>Item 1</p>
            </UiMenuItem>
            <UiMenuItem>
                <p>Item 2</p>
            </UiMenuItem>
            <UiMenuItem>
                <p>Item 3</p>
            </UiMenuItem>
            <UiMenuGroup>
                <template #title>Submenu</template>
                <UiMenuItem>
                    <p>Subitem 1</p>
                </UiMenuItem>
                <UiMenuItem>
                    <p>Subitem 2</p>
                </UiMenuItem>
                <UiMenuItem>
                    <p>Subitem 3</p>
                </UiMenuItem>
                <UiMenuGroup>
                    <template #title>Submenu</template>
                    <UiMenuItem>
                        <p>Subitem 1</p>
                    </UiMenuItem>
                    <UiMenuItem>
                        <p>Subitem 2</p>
                    </UiMenuItem>
                    <UiMenuItem>
                        <p>Subitem 3</p>
                    </UiMenuItem>
                    <UiMenuGroup>
                        <template #title>Submenu</template>
                        <UiMenuItem>
                            <p>Subitem 1</p>
                        </UiMenuItem>
                        <UiMenuItem>
                            <p>Subitem 2</p>
                        </UiMenuItem>
                        <UiMenuItem>
                            <p>Subitem 3</p>
                        </UiMenuItem>
                        <UiMenuGroup>
                            <template #title>Submenu</template>
                            <UiMenuItem>
                                <p>Subitem 1</p>
                            </UiMenuItem>
                            <UiMenuItem>
                                <p>Subitem 2</p>
                            </UiMenuItem>
                            <UiMenuItem>
                                <p>Subitem 3</p>
                            </UiMenuItem>
                        </UiMenuGroup>
                    </UiMenuGroup>
                </UiMenuGroup>
            </UiMenuGroup>
        </UiMenuGroup>

        <UiMenuGroup>
            <template #title>Editar</template>
            <UiMenuItem>
                <p>Desfazer</p>
                <template #right>
                    <UiKbd>Ctrl + Z</UiKbd>
                </template>
            </UiMenuItem>
            <UiMenuItem>
                <p>Refazer</p>
                <template #right>
                    <UiKbd>Ctrl + Y</UiKbd>
                </template>
            </UiMenuItem>
            <UiMenuItemSeparator />
            <UiMenuItem>
                <p>Cortar</p>
                <template #right>
                    <UiKbd>Ctrl + X</UiKbd>
                </template>
            </UiMenuItem>
            <UiMenuItem>
                <p>Copiar</p>
                <template #right>
                    <UiKbd>Ctrl + C</UiKbd>
                </template>
            </UiMenuItem>
            <UiMenuItem>
                <p>Colar</p>
                <template #right>
                    <UiKbd>Ctrl + V</UiKbd>
                </template>
            </UiMenuItem>
        </UiMenuGroup>

        <UiMenuGroup>
            <template #title>Exibir</template>

            <UiMenuItem>
                <p>Tela cheia</p>
                <template #right>
                    <UiKbd>F11</UiKbd>
                </template>
            </UiMenuItem>
            <UiMenuItem>
                <p>Barra de ferramentas</p>
            </UiMenuItem>
            <UiMenuItem>
                <p>Barra de status</p>
            </UiMenuItem>
        </UiMenuGroup>
    </UiMenuBar>
</template>