import{_ as a,c as e,a0 as o,o as r}from"./chunks/framework.BeF2i_lt.js";const u=JSON.parse('{"title":"Módulo de histórico","description":"","frontmatter":{},"headers":[],"relativePath":"api/modules/history.md","filePath":"api/modules/history.md"}'),d={name:"api/modules/history.md"};function i(s,t,h,n,l,c){return r(),e("div",null,t[0]||(t[0]=[o('<h1 id="modulo-de-historico" tabindex="-1">Módulo de histórico <a class="header-anchor" href="#modulo-de-historico" aria-label="Permalink to &quot;Módulo de histórico&quot;">​</a></h1><p>O módulo de histórico é responsável por gerenciar históricos de estados do editor.</p><p>Para utilizar o módulo de histórico, basta importar o módulo <code>lenz:history</code> no arquivo de script de sua extensão.</p><div class="language-ts vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">ts</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">import</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> { ensureHistory } </span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">from</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> &#39;lenz:history&#39;</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">;</span></span></code></pre></div><h2 id="metodos" tabindex="-1">Métodos <a class="header-anchor" href="#metodos" aria-label="Permalink to &quot;Métodos&quot;">​</a></h2><h3 id="ensurehistory-t-key-string-initialdata-t-history-t" tabindex="-1"><code>ensureHistory&lt;T&gt;(key: string, initialData: T): History&lt;T&gt;</code> <a class="header-anchor" href="#ensurehistory-t-key-string-initialdata-t-history-t" aria-label="Permalink to &quot;`ensureHistory&lt;T&gt;(key: string, initialData: T): History&lt;T&gt;`&quot;">​</a></h3><p>Obtém ou cria um histórico de estados.</p><h4 id="parametros" tabindex="-1">Parâmetros <a class="header-anchor" href="#parametros" aria-label="Permalink to &quot;Parâmetros&quot;">​</a></h4><table tabindex="0"><thead><tr><th>Nome</th><th>Tipo</th><th>Descrição</th></tr></thead><tbody><tr><td>key</td><td><code>string</code></td><td>Chave do histórico.</td></tr><tr><td>initialData</td><td><code>T</code></td><td>Dados iniciais do histórico.</td></tr></tbody></table><h4 id="retorno" tabindex="-1">Retorno <a class="header-anchor" href="#retorno" aria-label="Permalink to &quot;Retorno&quot;">​</a></h4><p><code>History&lt;T&gt;</code> - Histórico de estados de tipo <code>T</code>.</p><h3 id="save-t-key-string-data-t-t" tabindex="-1"><code>save&lt;T&gt;(key: string, data: T): T</code> <a class="header-anchor" href="#save-t-key-string-data-t-t" aria-label="Permalink to &quot;`save&lt;T&gt;(key: string, data: T): T`&quot;">​</a></h3><p>Salva um estado no histórico e retorna o estado salvo.</p><h4 id="parametros-1" tabindex="-1">Parâmetros <a class="header-anchor" href="#parametros-1" aria-label="Permalink to &quot;Parâmetros&quot;">​</a></h4><table tabindex="0"><thead><tr><th>Nome</th><th>Tipo</th><th>Descrição</th></tr></thead><tbody><tr><td>key</td><td><code>string</code></td><td>Chave do histórico.</td></tr><tr><td>data</td><td><code>T</code></td><td>Dados a serem salvos no estado.</td></tr></tbody></table><h4 id="retorno-1" tabindex="-1">Retorno <a class="header-anchor" href="#retorno-1" aria-label="Permalink to &quot;Retorno&quot;">​</a></h4><p><code>T</code> - Dados salvos no estado.</p><h3 id="undo-key-string-t" tabindex="-1"><code>undo(key: string): T</code> <a class="header-anchor" href="#undo-key-string-t" aria-label="Permalink to &quot;`undo(key: string): T`&quot;">​</a></h3><p>Desfaz a última alteração no histórico e retorna o estado anterior.</p><h4 id="parametros-2" tabindex="-1">Parâmetros <a class="header-anchor" href="#parametros-2" aria-label="Permalink to &quot;Parâmetros&quot;">​</a></h4><table tabindex="0"><thead><tr><th>Nome</th><th>Tipo</th><th>Descrição</th></tr></thead><tbody><tr><td>key</td><td><code>string</code></td><td>Chave do histórico.</td></tr></tbody></table><h4 id="retorno-2" tabindex="-1">Retorno <a class="header-anchor" href="#retorno-2" aria-label="Permalink to &quot;Retorno&quot;">​</a></h4><p><code>T</code> - Dados do estado anterior.</p><h3 id="redo-key-string-t" tabindex="-1"><code>redo(key: string): T</code> <a class="header-anchor" href="#redo-key-string-t" aria-label="Permalink to &quot;`redo(key: string): T`&quot;">​</a></h3><p>Refaz a última alteração desfeita no histórico e retorna o estado anterior.</p><h4 id="parametros-3" tabindex="-1">Parâmetros <a class="header-anchor" href="#parametros-3" aria-label="Permalink to &quot;Parâmetros&quot;">​</a></h4><table tabindex="0"><thead><tr><th>Nome</th><th>Tipo</th><th>Descrição</th></tr></thead><tbody><tr><td>key</td><td><code>string</code></td><td>Chave do histórico.</td></tr></tbody></table><h3 id="clear-key-string-t" tabindex="-1"><code>clear(key: string): T</code> <a class="header-anchor" href="#clear-key-string-t" aria-label="Permalink to &quot;`clear(key: string): T`&quot;">​</a></h3><p>Apaga todos os estados anteriores ao estado atual e mantém o estado atual.</p><h4 id="parametros-4" tabindex="-1">Parâmetros <a class="header-anchor" href="#parametros-4" aria-label="Permalink to &quot;Parâmetros&quot;">​</a></h4><table tabindex="0"><thead><tr><th>Nome</th><th>Tipo</th><th>Descrição</th></tr></thead><tbody><tr><td>key</td><td><code>string</code></td><td>Chave do histórico.</td></tr></tbody></table><h4 id="retorno-3" tabindex="-1">Retorno <a class="header-anchor" href="#retorno-3" aria-label="Permalink to &quot;Retorno&quot;">​</a></h4><p><code>T</code> - Dados do estado atual.</p><h3 id="drop-key-string-void" tabindex="-1"><code>drop(key: string): void</code> <a class="header-anchor" href="#drop-key-string-void" aria-label="Permalink to &quot;`drop(key: string): void`&quot;">​</a></h3><p>Apaga complemente o histórico.</p><h4 id="parametros-5" tabindex="-1">Parâmetros <a class="header-anchor" href="#parametros-5" aria-label="Permalink to &quot;Parâmetros&quot;">​</a></h4><table tabindex="0"><thead><tr><th>Nome</th><th>Tipo</th><th>Descrição</th></tr></thead><tbody><tr><td>key</td><td><code>string</code></td><td>Chave do histórico.</td></tr></tbody></table><h2 id="tipos" tabindex="-1">Tipos <a class="header-anchor" href="#tipos" aria-label="Permalink to &quot;Tipos&quot;">​</a></h2><h3 id="history-t" tabindex="-1"><code>History&lt;T&gt;</code> <a class="header-anchor" href="#history-t" aria-label="Permalink to &quot;`History&lt;T&gt;`&quot;">​</a></h3><p>Representa um histórico de estados.</p><h4 id="propriedades" tabindex="-1">Propriedades <a class="header-anchor" href="#propriedades" aria-label="Permalink to &quot;Propriedades&quot;">​</a></h4><table tabindex="0"><thead><tr><th>Nome</th><th>Tipo</th><th>Descrição</th></tr></thead><tbody><tr><td><code>current</code></td><td><a href="#snapshot">Snapshot&lt;T&gt;</a></td><td>Snapshot atual do histórico.</td></tr><tr><td><code>count</code></td><td><code>number</code></td><td>Número de estados no histórico.</td></tr><tr><td><code>capacity</code></td><td><code>number</code></td><td>Capacidade máxima do histórico.</td></tr></tbody></table><h4 id="metodos-1" tabindex="-1">Métodos <a class="header-anchor" href="#metodos-1" aria-label="Permalink to &quot;Métodos&quot;">​</a></h4><h5 id="save-data-t-t" tabindex="-1"><code>save(data: T): T</code> <a class="header-anchor" href="#save-data-t-t" aria-label="Permalink to &quot;`save(data: T): T`&quot;">​</a></h5><p>Salva um estado no histórico e retorna o estado salvo.</p><h4 id="parametros-6" tabindex="-1">Parâmetros <a class="header-anchor" href="#parametros-6" aria-label="Permalink to &quot;Parâmetros&quot;">​</a></h4><table tabindex="0"><thead><tr><th>Nome</th><th>Tipo</th><th>Descrição</th></tr></thead><tbody><tr><td>data</td><td><code>T</code></td><td>Dados a serem salvos no estado.</td></tr></tbody></table><h4 id="retorno-4" tabindex="-1">Retorno <a class="header-anchor" href="#retorno-4" aria-label="Permalink to &quot;Retorno&quot;">​</a></h4><p><code>T</code> - Dados salvos no estado.</p><h5 id="undo-t" tabindex="-1"><code>undo(): T</code> <a class="header-anchor" href="#undo-t" aria-label="Permalink to &quot;`undo(): T`&quot;">​</a></h5><p>Desfaz a última alteração no histórico e retorna o estado anterior.</p><h4 id="retorno-5" tabindex="-1">Retorno <a class="header-anchor" href="#retorno-5" aria-label="Permalink to &quot;Retorno&quot;">​</a></h4><p><code>T</code> - Dados do estado anterior.</p><h5 id="redo-t" tabindex="-1"><code>redo(): T</code> <a class="header-anchor" href="#redo-t" aria-label="Permalink to &quot;`redo(): T`&quot;">​</a></h5><p>Refaz a última alteração desfeita no histórico e retorna o estado anterior.</p><h4 id="retorno-6" tabindex="-1">Retorno <a class="header-anchor" href="#retorno-6" aria-label="Permalink to &quot;Retorno&quot;">​</a></h4><p><code>T</code> - Dados do estado anterior.</p><h5 id="clear-t" tabindex="-1"><code>clear(): T</code> <a class="header-anchor" href="#clear-t" aria-label="Permalink to &quot;`clear(): T`&quot;">​</a></h5><p>Apaga todos os estados anteriores ao estado atual e mantém o estado atual.</p><h4 id="retorno-7" tabindex="-1">Retorno <a class="header-anchor" href="#retorno-7" aria-label="Permalink to &quot;Retorno&quot;">​</a></h4><p><code>T</code> - Dados do estado atual.</p><h3 id="snapshot" tabindex="-1"><code>Snapshot&lt;T&gt;</code># <a class="header-anchor" href="#snapshot" aria-label="Permalink to &quot;`Snapshot&lt;T&gt;`#{#snapshot}&quot;">​</a></h3><p>Representa um estado salvo no histórico.</p><h4 id="propriedades-1" tabindex="-1">Propriedades <a class="header-anchor" href="#propriedades-1" aria-label="Permalink to &quot;Propriedades&quot;">​</a></h4><table tabindex="0"><thead><tr><th>Nome</th><th>Tipo</th><th>Descrição</th></tr></thead><tbody><tr><td><code>data</code></td><td><code>T</code></td><td>Dados do estado.</td></tr><tr><td><code>prev</code></td><td><code>Snapshot&lt;T&gt; | null</code></td><td>Estado anterior.</td></tr><tr><td><code>next</code></td><td><code>Snapshot&lt;T&gt; | null</code></td><td>Estado seguinte.</td></tr></tbody></table>',65)]))}const b=a(d,[["render",i]]);export{u as __pageData,b as default};