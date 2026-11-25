/** The full guide: what the `lenz` prompt gives. */
export const SKILL = `# Páginas no Lenz

Como criar e editar páginas HTML no Lenz com estas ferramentas. Vale para qualquer pedido que envolva as páginas, os elementos ou o layout do projeto.

## Regra de estilo (obrigatória)

**Todo estilo vai inline, no atributo \`style\` de cada elemento.** Isso vale mesmo quando vários elementos têm a mesma aparência: repita o estilo em cada um. Não crie classes para compartilhar estilos.

| Situação                          | Ferramenta                                                          |
| --------------------------------- | ------------------------------------------------------------------- |
| Elemento novo                     | \`insert_element\`, com \`style="..."\` no \`html\` ou o parâmetro \`styles\` |
| Elemento existente                | \`set_styles\` (um elemento por chamada)                              |
| O que o inline não consegue fazer | \`set_style_rule\`                                                    |

\`set_style_rule\` é permitido **apenas** para:

- pseudo-classes: \`:hover\`, \`:focus-visible\`, \`:active\`, \`:nth-child()\`...
- pseudo-elementos: \`::before\`, \`::after\`, \`::placeholder\`...
- media queries (\`@media\`), para ajustes de tela pequena

Estilos de \`html\` e \`body\`, tipografia, cores, espaçamento, grid, flex e \`transition\` são inline. Não use reset com \`*\`: zere \`margin\` e \`padding\` no próprio elemento.

\`set_style_rule\` só cria regras de seletor e de \`@media\`. \`@keyframes\`, \`@font-face\`, \`@import\` e container queries são recusados: não há ferramenta para elas.

## Inline vence a regra

Uma declaração inline tem prioridade sobre a folha de estilos, então um \`:hover\` ou uma media query não muda uma propriedade que já está inline.

1. **Responsividade:** prefira resolver só com inline, usando \`flex-wrap\`, \`clamp()\` e \`grid-template-columns: repeat(auto-fit, minmax(min(100%, 280px), 1fr))\`.
2. **Hover e media query:** use \`!important\` na declaração da regra (ex.: \`{"transform": "translateY(-4px) !important"}\`), mantendo o valor base inline.

Uma classe pode existir só como alvo dessas regras (ex.: \`class="card"\` para \`.card:hover\`).

As regras ficam num bloco próprio (\`<style data-lenz-agent>\`) depois das folhas da página. As folhas que já existem nunca são reescritas; \`get_style_rules\` lista as duas.

## Como apontar um elemento

\`get_element_tree\` dá um id a cada elemento (\`e12\`). Onde há \`target\`, vale um id ou um seletor CSS que case com **um só** elemento (se casar com vários, a ferramenta diz quais). Sem \`target\`, vale o elemento selecionado. Um id deixa de valer se o elemento é removido ou a página é recarregada: peça a árvore de novo.

## Fluxo

1. \`get_app_state\` e \`list_files\` para conhecer o projeto.
2. Arquivo novo: \`write_file\` **somente** com o esqueleto (\`doctype\`, \`head\`, \`body\` vazio). Não escreva o conteúdo da página com \`write_file\`, \`write_tab\` ou \`replace_in_tab\`.
3. \`open_file\`. Se o arquivo não abrir no editor visual, use \`list_editors\` e \`set_tab_editor\` com \`html-visual-editor.visual\`.
4. Em página existente, \`get_element_tree\` antes de alterar.
5. Monte e ajuste com \`insert_element\` (um elemento ou um trecho de \`html\`), \`set_text\`, \`set_html\` (texto formatado), \`set_attributes\`, \`set_styles\`, \`move_element\`, \`reorder_element\`, \`duplicate_element\` e \`remove_element\`. Para saber o que uma tag aceita, \`get_tag_reference\`.
6. \`screenshot\` para conferir em desktop, tablet e celular (1280, 768 e 375 por padrão). Hover não aparece na captura: confira a regra com \`get_style_rules\`.
7. \`save_tab\`.

Cada alteração vira uma entrada do histórico ("Agente: ..."), então o usuário desfaz com Ctrl+Z, e \`undo_tab\` faz o mesmo.

## Limites

- Não se criam \`<script>\`, \`<base>\`, \`<object>\` nem \`<embed>\`, e são recusados atributos de evento (\`onclick\`...), \`srcdoc\` e endereços \`javascript:\`.
- Não há ferramenta para carregar fontes: use as fontes do sistema (\`system-ui\`, \`Georgia\`, \`ui-monospace\`...).
- \`delete_path\` apaga **sem perguntar** e não dá para desfazer: confira o caminho antes.
- \`install_extension\` pede confirmação ao usuário, que pode recusar.

## Boas práticas

Use HTML semântico (\`header\`, \`nav\`, \`main\`, \`section\`, \`footer\`), \`alt\` nas imagens e um \`:focus-visible\` nos links e botões.`;

/**
 * What the server tells the client as it starts, which the agent has in front of it from the first
 * message. Short on purpose: the guide is one call away.
 */
export const INSTRUCTIONS = `Lenz é um editor de páginas HTML que roda no navegador; estas ferramentas o controlam.

- Todo estilo vai inline, no \`style\` de cada elemento (\`insert_element\` e \`set_styles\`). Não crie classes para compartilhar estilos. \`set_style_rule\` só para \`:hover\`, \`::before\`, \`@media\` e o que o inline não faz.
- Comece por \`get_app_state\`. Em página existente, \`get_element_tree\` antes de alterar.
- Monte a página com as ferramentas de elemento, não escrevendo o conteúdo com \`write_file\` ou \`write_tab\`.
- Confira o resultado com \`screenshot\` e salve com \`save_tab\`.
- O guia completo é o prompt \`lenz\`.`;

export interface PromptInfo {
  name: string;
  title: string;
  description: string;
  arguments: { name: string; description: string; required: boolean }[];
}

export const PROMPTS: PromptInfo[] = [
  {
    name: "lenz",
    title: "Lenz: criar e editar páginas",
    description:
      "O guia para criar e editar páginas HTML no Lenz: a regra de estilos inline, o fluxo e os limites das ferramentas.",
    arguments: [
      { name: "tarefa", description: "O que criar ou alterar, se já se sabe.", required: false },
    ],
  },
];

/** What a prompt says, or `undefined` for one that does not exist. */
export function getPrompt(name: string, args: Record<string, unknown> = {}) {
  const prompt = PROMPTS.find((p) => p.name === name);
  if (!prompt) return undefined;
  const task = typeof args.tarefa === "string" ? args.tarefa.trim() : "";
  const text = task ? `${SKILL}\n\n## Tarefa\n\n${task}` : SKILL;
  return {
    description: prompt.description,
    messages: [{ role: "user", content: { type: "text", text } }],
  };
}
