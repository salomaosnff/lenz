# Editor visual de HTML

Edita páginas HTML clicando diretamente nos elementos.

- Árvore de elementos da página
- Paleta de elementos (painel "Editor HTML" na barra de atividades): todos os elementos do catálogo, com nome e descrição; clique para inserir
- Edição de atributos
- Comandos e atalhos de edição

## Ferramentas para agentes

Um agente (por WebMCP ou pelo `lenz-mcp`) edita a página aberta no editor visual com estas ferramentas. Cada elemento tem um id (`e12`) dado por `get_element_tree`; onde há `target`, vale também um seletor CSS que case com um só elemento, e sem `target` vale o elemento selecionado.

| Ferramenta                                            | O que faz                                                                              |
| ----------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `get_element_tree`, `get_element`                     | Lista os elementos com seus ids; descreve um (atributos, estilos, caixa, HTML)         |
| `select_element`                                      | Seleciona um elemento, como um clique                                                  |
| `insert_element`                                      | Insere uma tag (ou um trecho de HTML) dentro, antes ou depois de outro, e devolve o id |
| `set_text`, `set_attributes`, `set_styles`            | Texto, atributos (`href`, `src`, `alt`, `class`...) e CSS inline                       |
| `move_element`, `remove_element`, `duplicate_element` | Move para qualquer pai, exclui, duplica                                                |
| `get_style_rules`, `set_style_rule`                   | Lê as regras das folhas de estilo; cria regras com `:hover` e `@media`                 |
| `screenshot`                                          | Imagens da página renderizada em várias larguras (1280, 768 e 375 por padrão)          |

Cada alteração vira uma entrada do histórico do arquivo ("Agente: ..."), então o usuário desfaz com Ctrl+Z.

- Não se criam `<script>`, `<base>`, `<object>` nem `<embed>`; atributos de evento (`onclick`...), `srcdoc` e endereços `javascript:` são recusados. O que o agente escreve fica salvo no arquivo.
- Os estilos devem ficar inline em cada elemento (`set_styles`): `set_style_rule` só serve ao que o inline não faz (`:hover`, `::before`, `@media`), e as descrições das ferramentas dizem isso ao agente.
- As regras de `set_style_rule` ficam num bloco próprio (`<style data-lenz-agent>`) depois das folhas da página, então vencem regras iguais delas; as folhas da página nunca são reescritas.
- O `screenshot` desenha a página por um SVG: imagens, fontes e folhas de outros endereços são embutidas quando o navegador consegue lê-las (o resultado diz as que não deu), e o JavaScript da página não roda.
