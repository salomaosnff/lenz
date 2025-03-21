declare module "lenz:types" {
    /**
     * Uma função que descarta recursos alocados
     * @internal
     */
    export type LenzDisposer = () => void;
    /**
     * Representa a seleção de um elemento
     */
    export interface ElementSelection {
        /**
         * O seletor CSS que pode ser usado para encontrar o elemento
         */
        selector: string;
        /**
         * O elemento selecionado
         */
        element: HTMLElement;
        /**
         * O retângulo que circunda o elemento relativo à viewport
         */
        box: DOMRect;
    }
}
declare module "lenz:reactivity" {
    import { LenzDisposer } from "lenz:types";
    /**
     * Representa uma porta de um canal de comunicação bidirecional
     */
    export class ChannelPort<Input = unknown, Output = Input> {
        #private;
        /**
         * Retorna se o canal está fechado
         */
        get closed(): boolean;
        constructor(receiver: (data: Input) => void);
        /**
         * Envia dados para o canal
         * @param data Dados recebidos
         */
        send(data: Input): void;
        /**
         * Notifica os ouvintes do canal
         * @param data
         */
        notify(data: Output): void;
        /**
         * Adiciona um ouvinte ao canal
         * @param listener
         * @returns {LenzDisposer} Função para remover o ouvinte
         */
        addListener(listener: (data: Output) => void): LenzDisposer;
        /**
         * Aguarda pelo próximo dado
         * @param signal Sinal de cancelamento
         * @returns {Promise<Output>} Próximo dado recebido
         */
        next(signal?: AbortSignal): Promise<Output>;
        /**
         * Aguarda o fechamento do canal
         * @param signal Sinal de cancelamento
         * @returns {Promise<void>}
         */
        waitClose(signal?: AbortSignal): Promise<void>;
        /**
         * Retorna um iterador assíncrono para escutar os dados
         * @param signal
         * @returns {AsyncIterableIterator<Output>}
         */
        listen(signal?: AbortSignal): AsyncIterableIterator<Output>;
        /**
         * Fecha a porta
         */
        close(): void;
    }
    /**
     * Representa uma Referência Reativa
     */
    export class Ref<T = unknown> {
        #private;
        /**
         * Valor atual da referência
         */
        get value(): T;
        /**
         * Define o valor da referência
         * @param value Novo valor
         */
        set value(value: T);
        constructor(factory: (track: () => void, trigger: () => void) => RefGetSet<T>);
        /**
         * Converte a referência em uma porta de canal
         * @returns
         */
        asPort(): ChannelPort<T, T>;
        /**
         * Adiciona um efeito à ref
         * @param ref
         * @param effect
         * @returns
         */
        static addEffect(ref: Ref<any>, effect: () => void): LenzDisposer;
        /**
         * Dispara a ref
         * @param ref
         */
        static trigger(ref: Ref<unknown>): void;
        /**
         * Adiciona o efeito atual na ref
         * @param ref
         * @returns
         */
        static track(ref: Ref<unknown>): void;
    }
    /**
     * Objeto get/set para referência reativa
     */
    interface RefGetSet<T> {
        /**
         * Função para obter o valor da referência
         */
        get(): T;
        /**
         * Função para definir o valor da referência
         */
        set(value: T): void;
    }
    /**
     * Cria uma nova porta de canal de comunicação
     * @param send
     * @param notify
     */
    export function createChannelPort<Input = unknown, Output = Input>(send: (data: Input) => void): ChannelPort<Input, Output>;
    /**
     * Cria um novo canal de comunicação
     * @returns {[inputPort: ChannelPort<Input, Output>, outputPort: ChannelPort<Output, Input>]} Canal de comunicação
     */
    export function createChannel<Input = unknown, Output = Input>(): [
        inputPort: ChannelPort<Input, Output>,
        outputPort: ChannelPort<Output, Input>
    ];
    /**
     * Cria uma referência reativa customizada
     * @param factory
     * @returns {Ref<T>}
     */
    export function createCustomRef<T>(factory: (track: () => void, trigger: () => void) => RefGetSet<T>): Ref<T>;
    /**
     * Cria uma referência reativa com valor inicial `undefined`
     * @returns {Ref<T | undefined>}
     */
    export function ref<T>(): Ref<T | undefined>;
    /**
     * Cria uma referência reativa para um valor
     * @param value Valor inicial
     * @returns {Ref<T>}
     */
    export function ref<T>(value: T): Ref<T>;
    /**
     * Representa um escopo de efeito
     */
    export class EffectScope {
        #private;
        currentEffect: ((...args: any[]) => void) | null;
        constructor(parent?: EffectScope | null);
        /**
         * Adiciona um disposer ao escopo
         * @param disposer
         * @returns
         */
        addDisposer(disposer: LenzDisposer): LenzDisposer;
        /**
         * Executa um efeito neste escopo
         * @param effect
         * @returns
         */
        run<T>(effect: () => T, track?: boolean): T;
        /**
         * Descarta o escopo e todos os efeitos associados
         */
        dispose(): void;
    }
    /**
     * Cria um novo escopo de efeito
     * @param cb
     * @returns {EffectScope}
     * @example
     * const scope = createScope(() => {
     *  console.log("Efeito executado");
     * });
     */
    export function createScope(cb?: () => void): EffectScope;
    /**
     * Adiciona um disposer ao escopo de efeito atual
     * @param cb
     * @returns {LenzDisposer}
     */
    export function onDispose(cb: () => void): LenzDisposer;
    /**
     * Retorna o escopo de efeito atual
     * @returns {EffectScope}
     * @example
     * const scope = getCurrentScope();
     *
     * scope.run(() => {
     * console.log("Efeito executado");
     * });
     */
    export function getCurrentScope(): EffectScope;
    /**
     * Obtém o valor de uma referência reativa, função ou valor
     * @param source
     * @returns
     */
    export function toValue<T>(source: WatchSource<T> | T): T;
    export type WatchSource<T = unknown> = Ref<T> | (() => T);
    type WatchSourceValue<S> = S extends WatchSource<infer T> ? T : S extends WatchSource<any>[] ? {
        [K in keyof S]: WatchSourceValue<S[K]>;
    } : never;
    /**
     * Observa uma referência reativa
     * @param source
     * @param cb
     * @param options
     * @returns
     */
    export function watch<const S extends (WatchSource<any> | WatchSource<any>[])>(sources: S, cb: (value: WatchSourceValue<S>, oldValue: WatchSourceValue<S> | undefined) => void, { immediate }?: {
        immediate?: boolean;
    }): LenzDisposer;
    /**
     * Executa um efeito e observa suas dependências
     * @param effect
     * @param param1
     * @returns
     */
    export function watchEffect(effect: () => void): LenzDisposer;
}
declare module "lenz:util" {
    global {
        export interface Window {
            /** Store do Editor */
            __LENZ_STORE__?: any;
        }
    }
    /**
     * Garante que o editor foi inicializado
     * @returns Store do editor
     */
    export function ensureInitialized(): Window['lenz:__LENZ_STORE__'];
}
declare module "lenz:commands" {
    /**
     * Módulo para gerenciar e executar comandos do editor
     * @module lenz:commands
     */
    import { Ref } from "lenz:reactivity";
    import type { ElementSelection, LenzDisposer } from "lenz:types";
    /**
     * Representa o contexto de um comando
     */
    export interface CommandContext {
        /**
         * Seleção atual do editor
         */
        selection: Ref<ElementSelection[]>;
        /**
         * Elemento onde o cursor está posicionado
         */
        hover: Ref<ElementSelection | undefined>;
        /**
         * Retorna a seleção atual do editor
         * @deprecated Utilize `selection.value`
         */
        getSelection(): ElementSelection[];
        /**
         * Define a seleção do editor
         * @param selection
         * @deprecated Utilize `selection.value`
         */
        setSelection(selection: HTMLElement[]): void;
        /**
         * Retorna o elemento onde o cursor está posicionado
         * @deprecated Utilize `hover.value`
         */
        getHover(): ElementSelection | undefined;
        /**
         * Retorna o conteúdo do arquivo aberto no editor
         */
        getCurrentContent(): string;
        /**
         * Retorna o documento HTML atualmente aberto no editor
         */
        getCurrentDocument(): Document | undefined;
    }
    /**
     * Representa um comando do editor
     */
    export interface Command {
        /** Identificador único do comando */
        id: string;
        /**
         * Nome do comando
         *
         * Caso não seja informado, o nome do comando não será exibido
         * na paleta de comandos
         */
        name?: string;
        /** Descrição do comando */
        description?: string;
        /** Ícone do comando deve ser uma string contendo um Path de tamanho 16x16 */
        icon?: string;
        /** Função que será executada ao chamar o comando */
        run(context: CommandContext, ...args: any[]): any;
    }
    /**
     * Adiciona um comando ao editor
     * @param command Identificador único do comando
     * @returns Disposer para remover o comando
     *
     * @example
     * ```ts
     * import iconEarth from "lenz:lenz:icons/earth";
     *
     * addCommand({
     *  id: "hello",
     *  name: "Exibir mensagem", // Se não informado, este comando não será exibido na paleta de comandos e não poderá ser executado programaticamente
     *  description: "Exibe uma mensagem no console",
     *  icon: iconEarth,
     *  run(context) {
     *    console.log("Olá, mundo!");
     *  }
     * });
     */
    export function addCommand(command: Command): LenzDisposer;
    /**
     * Executa um comando registrado no editor
     * @param command Identificador único do comando
     * @param args Argumentos que serão passados para o comando
     * @returns Resultado da execução do comando
     */
    export function executeCommand<T>(command: string, ...args: any[]): Promise<T>;
}
declare module "lenz:dialog" {
    /**
     * Opções da janela de confirmação
     */
    export interface ConfirmDialogOptions {
        /** Título da janela de confirmação */
        title: string;
        /** Mensagem exibida na janela de confirmação */
        message: string;
        /**
         * Texto do botão de confirmação
         * @default "OK"
         */
        confirmText?: string;
        /**
         * Texto do botão de cancelamento
         * @default "Cancelar"
         */
        cancelText?: string;
    }
    /**
     * Exibe uma janela de confirmação
     * @param options Opções da janela de confirmação
     * @returns Promise que será resolvida com `true` se o usuário confirmar a ação ou `false` caso contrário.
     * @example
     * ```ts
     * const confirmed = await confirm({
     *   title: "Confirmação",
     *   message: "Deseja realmente excluir o item selecionado?"
     * });
     */
    export function confirm(options: ConfirmDialogOptions): any;
    /**
     * Opções da janela de prompt
     */
    export interface PromptDialogOptions {
        /** Título da janela de prompt */
        title: string;
        /** Mensagem exibida na janela de prompt */
        message: string;
        /** Valor padrão do campo de texto */
        defaultValue?: string;
        /**
         * Oculta os caracteres digitados
         */
        hidden?: boolean;
        /**
         * Texto exibido no campo de texto quando vazio
         */
        placeholder?: string;
        /**
         * Texto do botão de confirmação
         * @default "OK"
         */
        confirmText?: string;
        /**
         * Texto do botão de cancelamento
         * @default "Cancelar"
         */
        cancelText?: string;
        /**
         * Tipo do campo de texto
         * @default "text"
         */
        inputType?: "text" | "password" | "email" | "number" | "tel" | "url" | "search" | "date" | "time" | "datetime-local" | "month" | "week" | "color";
        /**
         * Função que retorna sugestões para o campo de texto
         * @param value Texto digitado pelo usuário
         */
        getSuggestions?(value: string): Promise<PromptSuggestion[]>;
    }
    /**
     * Exibe uma janela de prompt para o usuário inserir um texto
     * @param options Opções da janela de prompt
     * @returns Promise que será resolvida com o texto inserido pelo usuário ou o valor padrão caso o usuário cancele a ação.
     * @example
     * ```ts
     * const name = await prompt({
     *  title: "Informe seu nome",
     *  message: "Digite seu nome completo",
     *  defaultValue: "Fulano de Tal"
     * });
     * ```
     */
    export function prompt(options: PromptDialogOptions): any;
    /**
     * Representa uma sugestão para um prompt
     */
    export interface PromptSuggestion {
        /** Texto da sugestão */
        title: string;
        /** Descrição da sugestão */
        description?: string;
        /** Valor a ser retornado caso a sugestão seja selecionada */
        value: any;
    }
    /**
     * Cria uma função de busca de sugestões para um campo de texto
     * @param suggestions Lista de sugestões disponíveis
     * @returns Função que retorna as sugestões que contém o texto digitado pelo usuário
     */
    export function searchSuggestions(suggestions: PromptSuggestion[]): (value: string) => Promise<PromptSuggestion[]>;
}
declare module "lenz:extensions" {
    /**
     * Obtém uma extensão pelo seu ID
     * @param id
     * @returns
     */
    export function getExtension(id: string): any;
}
declare module "lenz:file" {
    /**
     * Retorna o arquivo atualmente aberto no editor
     * @returns
     */
    export function getCurrentFile(): any;
    /**
     * Abre um arquivo para edição no editor
     * @param filepath Caminho do arquivo a ser aberto
     */
    export function open(filepath: string): Promise<void>;
    /**
     * Escreve conteúdo no arquivo atual
     * @param content Conteúdo a ser escrito ou uma função que retorna o conteúdo
     * @param writeHistory Se deve escrever no histórico de edições
     */
    export function write(content: string | ((lastContent: string) => string | Promise<string>), writeHistory?: boolean): Promise<void>;
    /**
     * Salva o arquivo atual
     */
    export function save(): Promise<void>;
}
declare module "lenz:history" {
    /**
     * Representa um estado de um histórico em um determinado momento
     */
    export class SnapShot<T> {
        /** Dados do snapshot */
        data: T;
        /** Snapshot anterior */
        previous: SnapShot<T> | null;
        /** Próximo snapshot */
        next: SnapShot<T> | null;
        constructor(
        /** Dados do snapshot */
        data: T, 
        /** Snapshot anterior */
        previous?: SnapShot<T> | null, 
        /** Próximo snapshot */
        next?: SnapShot<T> | null);
    }
    /**
     * Representa um histórico de snapshots de um determinado estado
     */
    export class History<T> {
        /** Dados iniciais */
        data: T;
        /** Capacidade máxima de snapshots */
        capacity: number;
        /** SnapShot mais antigo */
        oldest: SnapShot<T>;
        /** SnapShot atual */
        current: SnapShot<T>;
        /** Quantidade de snapshots registrados */
        count: number;
        constructor(
        /** Dados iniciais */
        data: T, 
        /** Capacidade máxima de snapshots */
        capacity?: number);
        /**
         * Retorna se é possível voltar ao estado anterior
         */
        get canUndo(): boolean;
        /**
         * Retorna se é possível refazer o próximo estado
         */
        get canRedo(): boolean;
        /**
         * Desfaz o estado atual
         * @returns Dados do estado anterior
         */
        undo(): T;
        /**
         * Refaz o próximo estado
         * @returns Dados do próximo estado
         */
        redo(): T;
        /**
         * Adiciona um novo estado ao histórico
         * @param data Dados a serem salvos
         * @returns Dados salvos
         */
        push(data: T): T;
        /**
         * Exclui todos os snapshots mais antigos que o snapshot atual
         */
        clear(): void;
    }
    /**
     * Obtém o histórico de um estado ou cria um novo
     * @param key Identificador do estado
     * @param initialData Dados iniciais
     * @returns
     */
    export function ensureHistory(key: string, initialData: string): any;
    /**
     * Salva um novo estado
     * @param key Identificador do estado
     * @param data Dados a serem salvos
     * @returns
     */
    export function save(key: string, data: string): any;
    /**
     * Volta para o estado anterior
     * @param key
     * @returns
     */
    export function undo(key: string): any;
    /**
     * Refaz o próximo estado
     * @param key
     * @returns
     */
    export function redo(key: string): any;
    /**
     * Exclui todo o histórico deste estado
     * @param key
     * @returns
     */
    export function drop(key: string): any;
    /**
     * Obtém o estado atual
     * @param key
     * @returns
     */
    export function read(key: string): any;
    /**
     * Retorna se é possível voltar ao estado atual
     * @param key
     * @returns
     */
    export function canUndo(key: string): any;
    /**
     * Retorna se é possível refazer refazer o próximo estado
     * @param key
     * @returns
     */
    export function canRedo(key: string): any;
}
declare module "lenz:hooks" {
    /**
     * Executa um callback antes de um evento ser disparado
     * @param event Evento a ser monitorado
     * @param callback Função a ser executada
     * @returns Disposer
     */
    export function onBefore(event: string, callback: Function): any;
    /**
     * Executa um callback depois de um evento ser disparado
     * @param event Evento a ser monitorado
     * @param callback Função a ser executada
     * @returns Disposer
     */
    export function onAfter(event: string, callback: Function): any;
}
declare module "lenz:hotkeys" {
    /**
     * Módulo para gerenciar atalhos de teclado
     * @module lenz:hotkeys
     */
    import type { LenzDisposer } from "lenz:types";
    export namespace KeyTypes {
        /**
         * Teclas de modificação
         */
        type Modifier = "Ctrl" | "Alt" | "Shift" | "Cmd";
        /**
         * Teclas de navegação
         */
        type Navigation = "ArrowUp" | "ArrowDown" | "ArrowLeft" | "ArrowRight" | "Home" | "End" | "PageUp" | "PageDown";
        /**
         * Teclas de função
         */
        type Function = "F1" | "F2" | "F3" | "F4" | "F5" | "F6" | "F7" | "F8" | "F9" | "F10" | "F11" | "F12";
        /**
         * Teclas especiais
         */
        type Special = "Enter" | "Esc" | "Tab" | "Space" | "Backspace" | "Delete" | "CapsLock" | "NumLock" | "ScrollLock" | "PrintScreen" | "Insert" | "Pause";
        /**
         * Teclas de símbolos
         */
        type Symbol = "Plus" | "-" | "=" | ";" | "," | "." | "/" | "\\" | "'" | "`" | "[" | "]";
        /**
         * Teclas alfabéticas
         */
        type Alphabetic = "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H" | "I" | "J" | "K" | "L" | "M" | "N" | "O" | "P" | "Q" | "R" | "S" | "T" | "U" | "V" | "W" | "X" | "Y" | "Z";
        /**
         * Teclas numéricas
         */
        type Number = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9";
    }
    /**
     * Representa uma tecla qualquer do teclado
     */
    export type AnyKey = KeyTypes.Modifier | KeyTypes.Navigation | KeyTypes.Function | KeyTypes.Special | KeyTypes.Symbol | KeyTypes.Alphabetic | KeyTypes.Number;
    type ExcludeRepeated<T> = T extends `${infer A}+${infer B}+${infer C}+${infer D}` ? `${A}+${Exclude<B, A | C | D>}+${Exclude<C, A | B | D>}+${Exclude<D, A | B | C>}` : T extends `${infer A}+${infer B}+${infer C}` ? `${A}+${Exclude<B, A | C>}+${Exclude<C, A | B>}` : T extends `${infer A}+${infer B}` ? `${A}+${Exclude<B, A>}` : T;
    /**
     * Representa uma combinação de teclas
     */
    export type Hotkey = AnyKey | ExcludeRepeated<`${KeyTypes.Modifier}+${AnyKey}`> | ExcludeRepeated<`${KeyTypes.Modifier}+${KeyTypes.Modifier}+${AnyKey}`> | ExcludeRepeated<`${KeyTypes.Modifier}+${KeyTypes.Modifier}+${KeyTypes.Modifier}+${AnyKey}`>;
    /**
     * Mapeia combinacoes de teclas para comandos
     * @param hotKeys Mapeamento de teclas para comandos
     * @example
     * ```ts
     * addHotKeys({
     *  "Ctrl+S": 'file.save',
     *  "Ctrl+Z": 'history.undo',
     * });
     * @returns Disposer para remover as teclas de atalho
     */
    export function addHotKeys(hotKeys: Record<string, string>): LenzDisposer;
}
declare module "lenz:invoke" {
    /**
     * Erro de execução de comando
     */
    export class InvokeError extends Error {
        constructor(message: string);
    }
    /**
     * Invoca um comando no servidor de forma assíncrona
     * @param command Comando a ser invocado
     * @param args Argumentos do comando
     * @returns Promise com o resultado da execução
     */
    export function invoke<T>(command: string, args?: Record<string, unknown>): Promise<T>;
    /**
     * Invoca um comando no servidor de forma síncrona
     * @param command Comando a ser invocado
     * @param args Argumentos do comando
     * @returns Resultado da execução
     */
    export function invokeSync(command: string, args?: Record<string, unknown>): string | Promise<string> | ArrayBuffer | Record<string, unknown> | Promise<Record<string, unknown> | null> | Promise<ArrayBuffer> | null | undefined;
}
declare module "lenz:menubar" {
    /**
     * Módulo para gerenciar a barra de menu do editor
     * @module lenz:menubar
     */
    import type { LenzDisposer } from "lenz:types";
    /**
     * Item de menu base
     * @internal
     */
    export interface MenuItemBase {
        /** Identificador do item */
        id?: string;
        /** Itens que este item deve aparecer antes */
        before?: string[];
        /** Itens que este item deve aparecer depois */
        after?: string[];
        /** Função que retorna se o item deve ser visível */
        isVisible?(state: any): boolean;
    }
    /**
     * Item de menu de ação
     */
    export interface MenuItemAction extends MenuItemBase {
        /** Identificador do item */
        id: string;
        /** Tipo do item */
        type?: "item";
        /** O ícone deve ser uma string contendo um Path SVG de tamanho 24x24 */
        icon?: string;
        /** Título do item */
        title: string;
        /** Comando a ser executado ao clicar no item */
        command?: string;
        /** Atalho de teclado para o item */
        children?: MenuItem[];
        /** Função que retorna se o item deve ser desabilitado */
        isDisabled?(state: any): boolean;
    }
    /** Item de menu de separador */
    export interface MenuItemSeparator extends MenuItemBase {
        type: "separator";
    }
    /**
     * Item de menu de grupo de checkbox
     */
    export interface MenuItemCheckboxGroup<T = any> extends MenuItemBase {
        /** Identificador do item */
        id: string;
        /** Tipo do item */
        type: "checkbox-group";
        /** Título do grupo */
        title?: string;
        /** Função que retorna o valor do grupo */
        getValue(): T;
        /** Função chamada ao atualizar o valor do grupo */
        onUpdated?(newValue: T): void;
        /** Itens do grupo */
        items: MenuItemCheckbox<T>[];
    }
    /**
     * Item de menu de checkbox
     */
    export interface MenuItemRadioGroup<T = any> extends MenuItemBase {
        /** Identificador do item */
        id: string;
        /** Tipo do item */
        type: "radio-group";
        /** Título do grupo */
        title?: string;
        /** Função que retorna o valor do grupo */
        getValue(): T;
        /** Função chamada ao atualizar o valor do grupo */
        onUpdated?(newValue: T): void;
        /** Itens do grupo */
        items: MenuItemRadioGroupItem<T>[];
    }
    /**
     * Item de menu de checkbox
     */
    export interface MenuItemCheckbox<T = any> extends MenuItemBase {
        /** Identificador do item */
        id: string;
        /** Título do item */
        title: string;
        /** Comando a ser executado ao clicar no item */
        command?: string;
        /** Valor do item */
        checkedValue?: T;
        /** Valor do item quando desmarcado */
        uncheckedValue?: T;
        /** Função que retorna se o item deve ser desabilitado */
        isDisabled?(state: any): boolean;
    }
    /**
     * Item de menu de radio button
     */
    export interface MenuItemRadioGroupItem<T = any> extends MenuItemBase {
        /** Identificador do item */
        id: string;
        /** Título do item */
        title: string;
        /** Valor do item */
        checkedValue: T;
        /** Comando a ser executado ao clicar no item */
        command?: string;
        /** Função que retorna se o item deve ser desabilitado */
        isDisabled?(state: any): boolean;
    }
    /**
     * Item de menu
     */
    export type MenuItem = MenuItemAction | MenuItemSeparator | MenuItemCheckboxGroup | MenuItemRadioGroup;
    /**
     * Adiciona itens a barra de menu
     * @param items Itens a serem adicionados
     * @param parentId Id do item pai (Itens sem parentId ou com parentId inexistente serão adicionados na raiz)
     *
     * @example
     * ```ts
     * extendMenu([
     *  {
     *    id: "meu.menu",
     *    title: "Meu Menu",
     *    children: [
     *     {
     *      id: "meu.menu.item",
     *      title: "Meu Item",
     *      command: "meu.menu.item",
     *     },
     *   ],
     *  }
     * ], "edit");
     * ```
     */
    export function extendMenu(items: MenuItem[], parentId?: string): LenzDisposer;
}
declare module "lenz:widgets/widget" {
    import { LenzDisposer } from "lenz:types";
    /**
     * Um widget que pode ser adicionado a um elemento
     * @param parent O elemento pai
     * @returns Uma função que descarta recursos alocados
     */
    export type Widget = (parent: HTMLElement) => LenzDisposer | undefined;
}
declare module "lenz:ui" {
    import { Widget } from "lenz:widgets/widget";
    global {
        interface Window {
            /** Dados de inicialização da janela */
            __LENZ_UI_INIT?: any;
        }
    }
    /**
     * Opções da janela de interface
     */
    export interface WindowOptions {
        /** Título da janela */
        title?: string;
        /**
         * Conteúdo da janela
         * Pode ser uma string contendo HTML ou uma URL que será carregada em um iframe controlado pela janela
         * o conteúdo HTML será carregado utilizando a função `fetch()`, serão injetados estilos de tema na janela como variáveis CSS e o conteúdo será exibido em um iframe
         */
        content: Widget;
        /** Largura da janela */
        width?: number;
        /** Altura da janela */
        height?: number;
        /**
         * Define se serão injetados estilos de tema na janela como variáveis CSS
         */
        themed?: boolean;
        /**
         * Posição horizontal da janela
         */
        x?: number;
        /** Posição vertical da janela */
        y?: number;
        /**
         * Define se a janela pode ser redimensionada pelo usuário
         */
        resizable?: boolean;
        /** Remove a borda da janela */
        frame?: boolean;
        /** Bloqueia a interação com o editor enquanto a janela estiver aberta */
        modal?: boolean;
        /** Define se a janela pode ser fechada pelo usuário */
        closable?: boolean;
        /** Define se a janela pode ser movida pelo usuário */
        movable?: boolean;
        /** Define se a janela pode ser encolhida pelo usuário */
        collapsible?: boolean;
        /** Define se a janela possui sombra */
        shadow?: boolean;
        /** Define se a janela possui transparência */
        transparent?: boolean;
        /** Função chamada quando a janela é fechada */
        onClose?(): void;
    }
    /**
     * Cria uma nova janela de interface
     * @param options Opções da janela
     * @returns Uma instância da janela criada
     */
    export function createWindow(options: WindowOptions): any;
    /**
     * Retorna os dados passados para a janea de interface
     * @returns
     */
    export function getData<T>(): T;
    /**
     * Hook para aguardar a inicialização da janela de interface
     * @param cb Função a ser executada quando a janela de interface estiver pronta
     */
    export function onUiInit(cb: Function): any;
    /**
     * Hook para aguardar a destruição da janela de interface
     * @param cb
     */
    export function onUiDestroy(cb: Function): void;
}
declare module "lenz:icons/ab_testing" { export=icon }
declare module "lenz:icons/abacus" { export=icon }
declare module "lenz:icons/abjad_arabic" { export=icon }
declare module "lenz:icons/abjad_hebrew" { export=icon }
declare module "lenz:icons/abugida_devanagari" { export=icon }
declare module "lenz:icons/abugida_thai" { export=icon }
declare module "lenz:icons/access_point" { export=icon }
declare module "lenz:icons/access_point_check" { export=icon }
declare module "lenz:icons/access_point_minus" { export=icon }
declare module "lenz:icons/access_point_network" { export=icon }
declare module "lenz:icons/access_point_network_off" { export=icon }
declare module "lenz:icons/access_point_off" { export=icon }
declare module "lenz:icons/access_point_plus" { export=icon }
declare module "lenz:icons/access_point_remove" { export=icon }
declare module "lenz:icons/account" { export=icon }
declare module "lenz:icons/account_alert" { export=icon }
declare module "lenz:icons/account_alert_outline" { export=icon }
declare module "lenz:icons/account_arrow_down" { export=icon }
declare module "lenz:icons/account_arrow_down_outline" { export=icon }
declare module "lenz:icons/account_arrow_left" { export=icon }
declare module "lenz:icons/account_arrow_left_outline" { export=icon }
declare module "lenz:icons/account_arrow_right" { export=icon }
declare module "lenz:icons/account_arrow_right_outline" { export=icon }
declare module "lenz:icons/account_arrow_up" { export=icon }
declare module "lenz:icons/account_arrow_up_outline" { export=icon }
declare module "lenz:icons/account_badge" { export=icon }
declare module "lenz:icons/account_badge_outline" { export=icon }
declare module "lenz:icons/account_box" { export=icon }
declare module "lenz:icons/account_box_edit_outline" { export=icon }
declare module "lenz:icons/account_box_minus_outline" { export=icon }
declare module "lenz:icons/account_box_multiple" { export=icon }
declare module "lenz:icons/account_box_multiple_outline" { export=icon }
declare module "lenz:icons/account_box_outline" { export=icon }
declare module "lenz:icons/account_box_plus_outline" { export=icon }
declare module "lenz:icons/account_cancel" { export=icon }
declare module "lenz:icons/account_cancel_outline" { export=icon }
declare module "lenz:icons/account_card" { export=icon }
declare module "lenz:icons/account_card_outline" { export=icon }
declare module "lenz:icons/account_cash" { export=icon }
declare module "lenz:icons/account_cash_outline" { export=icon }
declare module "lenz:icons/account_check" { export=icon }
declare module "lenz:icons/account_check_outline" { export=icon }
declare module "lenz:icons/account_child" { export=icon }
declare module "lenz:icons/account_child_circle" { export=icon }
declare module "lenz:icons/account_child_outline" { export=icon }
declare module "lenz:icons/account_circle" { export=icon }
declare module "lenz:icons/account_circle_outline" { export=icon }
declare module "lenz:icons/account_clock" { export=icon }
declare module "lenz:icons/account_clock_outline" { export=icon }
declare module "lenz:icons/account_cog" { export=icon }
declare module "lenz:icons/account_cog_outline" { export=icon }
declare module "lenz:icons/account_convert" { export=icon }
declare module "lenz:icons/account_convert_outline" { export=icon }
declare module "lenz:icons/account_cowboy_hat" { export=icon }
declare module "lenz:icons/account_cowboy_hat_outline" { export=icon }
declare module "lenz:icons/account_credit_card" { export=icon }
declare module "lenz:icons/account_credit_card_outline" { export=icon }
declare module "lenz:icons/account_details" { export=icon }
declare module "lenz:icons/account_details_outline" { export=icon }
declare module "lenz:icons/account_edit" { export=icon }
declare module "lenz:icons/account_edit_outline" { export=icon }
declare module "lenz:icons/account_eye" { export=icon }
declare module "lenz:icons/account_eye_outline" { export=icon }
declare module "lenz:icons/account_file" { export=icon }
declare module "lenz:icons/account_file_outline" { export=icon }
declare module "lenz:icons/account_file_text" { export=icon }
declare module "lenz:icons/account_file_text_outline" { export=icon }
declare module "lenz:icons/account_filter" { export=icon }
declare module "lenz:icons/account_filter_outline" { export=icon }
declare module "lenz:icons/account_group" { export=icon }
declare module "lenz:icons/account_group_outline" { export=icon }
declare module "lenz:icons/account_hard_hat" { export=icon }
declare module "lenz:icons/account_hard_hat_outline" { export=icon }
declare module "lenz:icons/account_heart" { export=icon }
declare module "lenz:icons/account_heart_outline" { export=icon }
declare module "lenz:icons/account_injury" { export=icon }
declare module "lenz:icons/account_injury_outline" { export=icon }
declare module "lenz:icons/account_key" { export=icon }
declare module "lenz:icons/account_key_outline" { export=icon }
declare module "lenz:icons/account_lock" { export=icon }
declare module "lenz:icons/account_lock_open" { export=icon }
declare module "lenz:icons/account_lock_open_outline" { export=icon }
declare module "lenz:icons/account_lock_outline" { export=icon }
declare module "lenz:icons/account_minus" { export=icon }
declare module "lenz:icons/account_minus_outline" { export=icon }
declare module "lenz:icons/account_multiple" { export=icon }
declare module "lenz:icons/account_multiple_check" { export=icon }
declare module "lenz:icons/account_multiple_check_outline" { export=icon }
declare module "lenz:icons/account_multiple_minus" { export=icon }
declare module "lenz:icons/account_multiple_minus_outline" { export=icon }
declare module "lenz:icons/account_multiple_outline" { export=icon }
declare module "lenz:icons/account_multiple_plus" { export=icon }
declare module "lenz:icons/account_multiple_plus_outline" { export=icon }
declare module "lenz:icons/account_multiple_remove" { export=icon }
declare module "lenz:icons/account_multiple_remove_outline" { export=icon }
declare module "lenz:icons/account_music" { export=icon }
declare module "lenz:icons/account_music_outline" { export=icon }
declare module "lenz:icons/account_network" { export=icon }
declare module "lenz:icons/account_network_off" { export=icon }
declare module "lenz:icons/account_network_off_outline" { export=icon }
declare module "lenz:icons/account_network_outline" { export=icon }
declare module "lenz:icons/account_off" { export=icon }
declare module "lenz:icons/account_off_outline" { export=icon }
declare module "lenz:icons/account_outline" { export=icon }
declare module "lenz:icons/account_plus" { export=icon }
declare module "lenz:icons/account_plus_outline" { export=icon }
declare module "lenz:icons/account_question" { export=icon }
declare module "lenz:icons/account_question_outline" { export=icon }
declare module "lenz:icons/account_reactivate" { export=icon }
declare module "lenz:icons/account_reactivate_outline" { export=icon }
declare module "lenz:icons/account_remove" { export=icon }
declare module "lenz:icons/account_remove_outline" { export=icon }
declare module "lenz:icons/account_school" { export=icon }
declare module "lenz:icons/account_school_outline" { export=icon }
declare module "lenz:icons/account_search" { export=icon }
declare module "lenz:icons/account_search_outline" { export=icon }
declare module "lenz:icons/account_settings" { export=icon }
declare module "lenz:icons/account_settings_outline" { export=icon }
declare module "lenz:icons/account_star" { export=icon }
declare module "lenz:icons/account_star_outline" { export=icon }
declare module "lenz:icons/account_supervisor" { export=icon }
declare module "lenz:icons/account_supervisor_circle" { export=icon }
declare module "lenz:icons/account_supervisor_circle_outline" { export=icon }
declare module "lenz:icons/account_supervisor_outline" { export=icon }
declare module "lenz:icons/account_switch" { export=icon }
declare module "lenz:icons/account_switch_outline" { export=icon }
declare module "lenz:icons/account_sync" { export=icon }
declare module "lenz:icons/account_sync_outline" { export=icon }
declare module "lenz:icons/account_tag" { export=icon }
declare module "lenz:icons/account_tag_outline" { export=icon }
declare module "lenz:icons/account_tie" { export=icon }
declare module "lenz:icons/account_tie_hat" { export=icon }
declare module "lenz:icons/account_tie_hat_outline" { export=icon }
declare module "lenz:icons/account_tie_outline" { export=icon }
declare module "lenz:icons/account_tie_voice" { export=icon }
declare module "lenz:icons/account_tie_voice_off" { export=icon }
declare module "lenz:icons/account_tie_voice_off_outline" { export=icon }
declare module "lenz:icons/account_tie_voice_outline" { export=icon }
declare module "lenz:icons/account_tie_woman" { export=icon }
declare module "lenz:icons/account_voice" { export=icon }
declare module "lenz:icons/account_voice_off" { export=icon }
declare module "lenz:icons/account_wrench" { export=icon }
declare module "lenz:icons/account_wrench_outline" { export=icon }
declare module "lenz:icons/adjust" { export=icon }
declare module "lenz:icons/advertisements" { export=icon }
declare module "lenz:icons/advertisements_off" { export=icon }
declare module "lenz:icons/air_conditioner" { export=icon }
declare module "lenz:icons/air_filter" { export=icon }
declare module "lenz:icons/air_horn" { export=icon }
declare module "lenz:icons/air_humidifier" { export=icon }
declare module "lenz:icons/air_humidifier_off" { export=icon }
declare module "lenz:icons/air_purifier" { export=icon }
declare module "lenz:icons/air_purifier_off" { export=icon }
declare module "lenz:icons/airbag" { export=icon }
declare module "lenz:icons/airballoon" { export=icon }
declare module "lenz:icons/airballoon_outline" { export=icon }
declare module "lenz:icons/airplane" { export=icon }
declare module "lenz:icons/airplane_alert" { export=icon }
declare module "lenz:icons/airplane_check" { export=icon }
declare module "lenz:icons/airplane_clock" { export=icon }
declare module "lenz:icons/airplane_cog" { export=icon }
declare module "lenz:icons/airplane_edit" { export=icon }
declare module "lenz:icons/airplane_landing" { export=icon }
declare module "lenz:icons/airplane_marker" { export=icon }
declare module "lenz:icons/airplane_minus" { export=icon }
declare module "lenz:icons/airplane_off" { export=icon }
declare module "lenz:icons/airplane_plus" { export=icon }
declare module "lenz:icons/airplane_remove" { export=icon }
declare module "lenz:icons/airplane_search" { export=icon }
declare module "lenz:icons/airplane_settings" { export=icon }
declare module "lenz:icons/airplane_takeoff" { export=icon }
declare module "lenz:icons/airport" { export=icon }
declare module "lenz:icons/alarm" { export=icon }
declare module "lenz:icons/alarm_bell" { export=icon }
declare module "lenz:icons/alarm_check" { export=icon }
declare module "lenz:icons/alarm_light" { export=icon }
declare module "lenz:icons/alarm_light_off" { export=icon }
declare module "lenz:icons/alarm_light_off_outline" { export=icon }
declare module "lenz:icons/alarm_light_outline" { export=icon }
declare module "lenz:icons/alarm_multiple" { export=icon }
declare module "lenz:icons/alarm_note" { export=icon }
declare module "lenz:icons/alarm_note_off" { export=icon }
declare module "lenz:icons/alarm_off" { export=icon }
declare module "lenz:icons/alarm_panel" { export=icon }
declare module "lenz:icons/alarm_panel_outline" { export=icon }
declare module "lenz:icons/alarm_plus" { export=icon }
declare module "lenz:icons/alarm_snooze" { export=icon }
declare module "lenz:icons/album" { export=icon }
declare module "lenz:icons/alert" { export=icon }
declare module "lenz:icons/alert_box" { export=icon }
declare module "lenz:icons/alert_box_outline" { export=icon }
declare module "lenz:icons/alert_circle" { export=icon }
declare module "lenz:icons/alert_circle_check" { export=icon }
declare module "lenz:icons/alert_circle_check_outline" { export=icon }
declare module "lenz:icons/alert_circle_outline" { export=icon }
declare module "lenz:icons/alert_decagram" { export=icon }
declare module "lenz:icons/alert_decagram_outline" { export=icon }
declare module "lenz:icons/alert_minus" { export=icon }
declare module "lenz:icons/alert_minus_outline" { export=icon }
declare module "lenz:icons/alert_octagon" { export=icon }
declare module "lenz:icons/alert_octagon_outline" { export=icon }
declare module "lenz:icons/alert_octagram" { export=icon }
declare module "lenz:icons/alert_octagram_outline" { export=icon }
declare module "lenz:icons/alert_outline" { export=icon }
declare module "lenz:icons/alert_plus" { export=icon }
declare module "lenz:icons/alert_plus_outline" { export=icon }
declare module "lenz:icons/alert_remove" { export=icon }
declare module "lenz:icons/alert_remove_outline" { export=icon }
declare module "lenz:icons/alert_rhombus" { export=icon }
declare module "lenz:icons/alert_rhombus_outline" { export=icon }
declare module "lenz:icons/alien" { export=icon }
declare module "lenz:icons/alien_outline" { export=icon }
declare module "lenz:icons/align_horizontal_center" { export=icon }
declare module "lenz:icons/align_horizontal_distribute" { export=icon }
declare module "lenz:icons/align_horizontal_left" { export=icon }
declare module "lenz:icons/align_horizontal_right" { export=icon }
declare module "lenz:icons/align_vertical_bottom" { export=icon }
declare module "lenz:icons/align_vertical_center" { export=icon }
declare module "lenz:icons/align_vertical_distribute" { export=icon }
declare module "lenz:icons/align_vertical_top" { export=icon }
declare module "lenz:icons/all_inclusive" { export=icon }
declare module "lenz:icons/all_inclusive_box" { export=icon }
declare module "lenz:icons/all_inclusive_box_outline" { export=icon }
declare module "lenz:icons/allergy" { export=icon }
declare module "lenz:icons/alpha" { export=icon }
declare module "lenz:icons/alpha_a" { export=icon }
declare module "lenz:icons/alpha_abox" { export=icon }
declare module "lenz:icons/alpha_abox_outline" { export=icon }
declare module "lenz:icons/alpha_acircle" { export=icon }
declare module "lenz:icons/alpha_acircle_outline" { export=icon }
declare module "lenz:icons/alpha_b" { export=icon }
declare module "lenz:icons/alpha_bbox" { export=icon }
declare module "lenz:icons/alpha_bbox_outline" { export=icon }
declare module "lenz:icons/alpha_bcircle" { export=icon }
declare module "lenz:icons/alpha_bcircle_outline" { export=icon }
declare module "lenz:icons/alpha_c" { export=icon }
declare module "lenz:icons/alpha_cbox" { export=icon }
declare module "lenz:icons/alpha_cbox_outline" { export=icon }
declare module "lenz:icons/alpha_ccircle" { export=icon }
declare module "lenz:icons/alpha_ccircle_outline" { export=icon }
declare module "lenz:icons/alpha_d" { export=icon }
declare module "lenz:icons/alpha_dbox" { export=icon }
declare module "lenz:icons/alpha_dbox_outline" { export=icon }
declare module "lenz:icons/alpha_dcircle" { export=icon }
declare module "lenz:icons/alpha_dcircle_outline" { export=icon }
declare module "lenz:icons/alpha_e" { export=icon }
declare module "lenz:icons/alpha_ebox" { export=icon }
declare module "lenz:icons/alpha_ebox_outline" { export=icon }
declare module "lenz:icons/alpha_ecircle" { export=icon }
declare module "lenz:icons/alpha_ecircle_outline" { export=icon }
declare module "lenz:icons/alpha_f" { export=icon }
declare module "lenz:icons/alpha_fbox" { export=icon }
declare module "lenz:icons/alpha_fbox_outline" { export=icon }
declare module "lenz:icons/alpha_fcircle" { export=icon }
declare module "lenz:icons/alpha_fcircle_outline" { export=icon }
declare module "lenz:icons/alpha_g" { export=icon }
declare module "lenz:icons/alpha_gbox" { export=icon }
declare module "lenz:icons/alpha_gbox_outline" { export=icon }
declare module "lenz:icons/alpha_gcircle" { export=icon }
declare module "lenz:icons/alpha_gcircle_outline" { export=icon }
declare module "lenz:icons/alpha_h" { export=icon }
declare module "lenz:icons/alpha_hbox" { export=icon }
declare module "lenz:icons/alpha_hbox_outline" { export=icon }
declare module "lenz:icons/alpha_hcircle" { export=icon }
declare module "lenz:icons/alpha_hcircle_outline" { export=icon }
declare module "lenz:icons/alpha_i" { export=icon }
declare module "lenz:icons/alpha_ibox" { export=icon }
declare module "lenz:icons/alpha_ibox_outline" { export=icon }
declare module "lenz:icons/alpha_icircle" { export=icon }
declare module "lenz:icons/alpha_icircle_outline" { export=icon }
declare module "lenz:icons/alpha_j" { export=icon }
declare module "lenz:icons/alpha_jbox" { export=icon }
declare module "lenz:icons/alpha_jbox_outline" { export=icon }
declare module "lenz:icons/alpha_jcircle" { export=icon }
declare module "lenz:icons/alpha_jcircle_outline" { export=icon }
declare module "lenz:icons/alpha_k" { export=icon }
declare module "lenz:icons/alpha_kbox" { export=icon }
declare module "lenz:icons/alpha_kbox_outline" { export=icon }
declare module "lenz:icons/alpha_kcircle" { export=icon }
declare module "lenz:icons/alpha_kcircle_outline" { export=icon }
declare module "lenz:icons/alpha_l" { export=icon }
declare module "lenz:icons/alpha_lbox" { export=icon }
declare module "lenz:icons/alpha_lbox_outline" { export=icon }
declare module "lenz:icons/alpha_lcircle" { export=icon }
declare module "lenz:icons/alpha_lcircle_outline" { export=icon }
declare module "lenz:icons/alpha_m" { export=icon }
declare module "lenz:icons/alpha_mbox" { export=icon }
declare module "lenz:icons/alpha_mbox_outline" { export=icon }
declare module "lenz:icons/alpha_mcircle" { export=icon }
declare module "lenz:icons/alpha_mcircle_outline" { export=icon }
declare module "lenz:icons/alpha_n" { export=icon }
declare module "lenz:icons/alpha_nbox" { export=icon }
declare module "lenz:icons/alpha_nbox_outline" { export=icon }
declare module "lenz:icons/alpha_ncircle" { export=icon }
declare module "lenz:icons/alpha_ncircle_outline" { export=icon }
declare module "lenz:icons/alpha_o" { export=icon }
declare module "lenz:icons/alpha_obox" { export=icon }
declare module "lenz:icons/alpha_obox_outline" { export=icon }
declare module "lenz:icons/alpha_ocircle" { export=icon }
declare module "lenz:icons/alpha_ocircle_outline" { export=icon }
declare module "lenz:icons/alpha_p" { export=icon }
declare module "lenz:icons/alpha_pbox" { export=icon }
declare module "lenz:icons/alpha_pbox_outline" { export=icon }
declare module "lenz:icons/alpha_pcircle" { export=icon }
declare module "lenz:icons/alpha_pcircle_outline" { export=icon }
declare module "lenz:icons/alpha_q" { export=icon }
declare module "lenz:icons/alpha_qbox" { export=icon }
declare module "lenz:icons/alpha_qbox_outline" { export=icon }
declare module "lenz:icons/alpha_qcircle" { export=icon }
declare module "lenz:icons/alpha_qcircle_outline" { export=icon }
declare module "lenz:icons/alpha_r" { export=icon }
declare module "lenz:icons/alpha_rbox" { export=icon }
declare module "lenz:icons/alpha_rbox_outline" { export=icon }
declare module "lenz:icons/alpha_rcircle" { export=icon }
declare module "lenz:icons/alpha_rcircle_outline" { export=icon }
declare module "lenz:icons/alpha_s" { export=icon }
declare module "lenz:icons/alpha_sbox" { export=icon }
declare module "lenz:icons/alpha_sbox_outline" { export=icon }
declare module "lenz:icons/alpha_scircle" { export=icon }
declare module "lenz:icons/alpha_scircle_outline" { export=icon }
declare module "lenz:icons/alpha_t" { export=icon }
declare module "lenz:icons/alpha_tbox" { export=icon }
declare module "lenz:icons/alpha_tbox_outline" { export=icon }
declare module "lenz:icons/alpha_tcircle" { export=icon }
declare module "lenz:icons/alpha_tcircle_outline" { export=icon }
declare module "lenz:icons/alpha_u" { export=icon }
declare module "lenz:icons/alpha_ubox" { export=icon }
declare module "lenz:icons/alpha_ubox_outline" { export=icon }
declare module "lenz:icons/alpha_ucircle" { export=icon }
declare module "lenz:icons/alpha_ucircle_outline" { export=icon }
declare module "lenz:icons/alpha_v" { export=icon }
declare module "lenz:icons/alpha_vbox" { export=icon }
declare module "lenz:icons/alpha_vbox_outline" { export=icon }
declare module "lenz:icons/alpha_vcircle" { export=icon }
declare module "lenz:icons/alpha_vcircle_outline" { export=icon }
declare module "lenz:icons/alpha_w" { export=icon }
declare module "lenz:icons/alpha_wbox" { export=icon }
declare module "lenz:icons/alpha_wbox_outline" { export=icon }
declare module "lenz:icons/alpha_wcircle" { export=icon }
declare module "lenz:icons/alpha_wcircle_outline" { export=icon }
declare module "lenz:icons/alpha_x" { export=icon }
declare module "lenz:icons/alpha_xbox" { export=icon }
declare module "lenz:icons/alpha_xbox_outline" { export=icon }
declare module "lenz:icons/alpha_xcircle" { export=icon }
declare module "lenz:icons/alpha_xcircle_outline" { export=icon }
declare module "lenz:icons/alpha_y" { export=icon }
declare module "lenz:icons/alpha_ybox" { export=icon }
declare module "lenz:icons/alpha_ybox_outline" { export=icon }
declare module "lenz:icons/alpha_ycircle" { export=icon }
declare module "lenz:icons/alpha_ycircle_outline" { export=icon }
declare module "lenz:icons/alpha_z" { export=icon }
declare module "lenz:icons/alpha_zbox" { export=icon }
declare module "lenz:icons/alpha_zbox_outline" { export=icon }
declare module "lenz:icons/alpha_zcircle" { export=icon }
declare module "lenz:icons/alpha_zcircle_outline" { export=icon }
declare module "lenz:icons/alphabet_aurebesh" { export=icon }
declare module "lenz:icons/alphabet_cyrillic" { export=icon }
declare module "lenz:icons/alphabet_greek" { export=icon }
declare module "lenz:icons/alphabet_latin" { export=icon }
declare module "lenz:icons/alphabet_piqad" { export=icon }
declare module "lenz:icons/alphabet_tengwar" { export=icon }
declare module "lenz:icons/alphabetical" { export=icon }
declare module "lenz:icons/alphabetical_off" { export=icon }
declare module "lenz:icons/alphabetical_variant" { export=icon }
declare module "lenz:icons/alphabetical_variant_off" { export=icon }
declare module "lenz:icons/altimeter" { export=icon }
declare module "lenz:icons/ambulance" { export=icon }
declare module "lenz:icons/ammunition" { export=icon }
declare module "lenz:icons/ampersand" { export=icon }
declare module "lenz:icons/amplifier" { export=icon }
declare module "lenz:icons/amplifier_off" { export=icon }
declare module "lenz:icons/anchor" { export=icon }
declare module "lenz:icons/android" { export=icon }
declare module "lenz:icons/android_studio" { export=icon }
declare module "lenz:icons/angle_acute" { export=icon }
declare module "lenz:icons/angle_obtuse" { export=icon }
declare module "lenz:icons/angle_right" { export=icon }
declare module "lenz:icons/angular" { export=icon }
declare module "lenz:icons/angularjs" { export=icon }
declare module "lenz:icons/animation" { export=icon }
declare module "lenz:icons/animation_outline" { export=icon }
declare module "lenz:icons/animation_play" { export=icon }
declare module "lenz:icons/animation_play_outline" { export=icon }
declare module "lenz:icons/ansible" { export=icon }
declare module "lenz:icons/antenna" { export=icon }
declare module "lenz:icons/anvil" { export=icon }
declare module "lenz:icons/apache_kafka" { export=icon }
declare module "lenz:icons/api" { export=icon }
declare module "lenz:icons/api_off" { export=icon }
declare module "lenz:icons/apple" { export=icon }
declare module "lenz:icons/apple_finder" { export=icon }
declare module "lenz:icons/apple_icloud" { export=icon }
declare module "lenz:icons/apple_ios" { export=icon }
declare module "lenz:icons/apple_keyboard_caps" { export=icon }
declare module "lenz:icons/apple_keyboard_command" { export=icon }
declare module "lenz:icons/apple_keyboard_control" { export=icon }
declare module "lenz:icons/apple_keyboard_option" { export=icon }
declare module "lenz:icons/apple_keyboard_shift" { export=icon }
declare module "lenz:icons/apple_safari" { export=icon }
declare module "lenz:icons/application" { export=icon }
declare module "lenz:icons/application_array" { export=icon }
declare module "lenz:icons/application_array_outline" { export=icon }
declare module "lenz:icons/application_braces" { export=icon }
declare module "lenz:icons/application_braces_outline" { export=icon }
declare module "lenz:icons/application_brackets" { export=icon }
declare module "lenz:icons/application_brackets_outline" { export=icon }
declare module "lenz:icons/application_cog" { export=icon }
declare module "lenz:icons/application_cog_outline" { export=icon }
declare module "lenz:icons/application_edit" { export=icon }
declare module "lenz:icons/application_edit_outline" { export=icon }
declare module "lenz:icons/application_export" { export=icon }
declare module "lenz:icons/application_import" { export=icon }
declare module "lenz:icons/application_outline" { export=icon }
declare module "lenz:icons/application_parentheses" { export=icon }
declare module "lenz:icons/application_parentheses_outline" { export=icon }
declare module "lenz:icons/application_settings" { export=icon }
declare module "lenz:icons/application_settings_outline" { export=icon }
declare module "lenz:icons/application_variable" { export=icon }
declare module "lenz:icons/application_variable_outline" { export=icon }
declare module "lenz:icons/approximately_equal" { export=icon }
declare module "lenz:icons/approximately_equal_box" { export=icon }
declare module "lenz:icons/apps" { export=icon }
declare module "lenz:icons/apps_box" { export=icon }
declare module "lenz:icons/arch" { export=icon }
declare module "lenz:icons/archive" { export=icon }
declare module "lenz:icons/archive_alert" { export=icon }
declare module "lenz:icons/archive_alert_outline" { export=icon }
declare module "lenz:icons/archive_arrow_down" { export=icon }
declare module "lenz:icons/archive_arrow_down_outline" { export=icon }
declare module "lenz:icons/archive_arrow_up" { export=icon }
declare module "lenz:icons/archive_arrow_up_outline" { export=icon }
declare module "lenz:icons/archive_cancel" { export=icon }
declare module "lenz:icons/archive_cancel_outline" { export=icon }
declare module "lenz:icons/archive_check" { export=icon }
declare module "lenz:icons/archive_check_outline" { export=icon }
declare module "lenz:icons/archive_clock" { export=icon }
declare module "lenz:icons/archive_clock_outline" { export=icon }
declare module "lenz:icons/archive_cog" { export=icon }
declare module "lenz:icons/archive_cog_outline" { export=icon }
declare module "lenz:icons/archive_edit" { export=icon }
declare module "lenz:icons/archive_edit_outline" { export=icon }
declare module "lenz:icons/archive_eye" { export=icon }
declare module "lenz:icons/archive_eye_outline" { export=icon }
declare module "lenz:icons/archive_lock" { export=icon }
declare module "lenz:icons/archive_lock_open" { export=icon }
declare module "lenz:icons/archive_lock_open_outline" { export=icon }
declare module "lenz:icons/archive_lock_outline" { export=icon }
declare module "lenz:icons/archive_marker" { export=icon }
declare module "lenz:icons/archive_marker_outline" { export=icon }
declare module "lenz:icons/archive_minus" { export=icon }
declare module "lenz:icons/archive_minus_outline" { export=icon }
declare module "lenz:icons/archive_music" { export=icon }
declare module "lenz:icons/archive_music_outline" { export=icon }
declare module "lenz:icons/archive_off" { export=icon }
declare module "lenz:icons/archive_off_outline" { export=icon }
declare module "lenz:icons/archive_outline" { export=icon }
declare module "lenz:icons/archive_plus" { export=icon }
declare module "lenz:icons/archive_plus_outline" { export=icon }
declare module "lenz:icons/archive_refresh" { export=icon }
declare module "lenz:icons/archive_refresh_outline" { export=icon }
declare module "lenz:icons/archive_remove" { export=icon }
declare module "lenz:icons/archive_remove_outline" { export=icon }
declare module "lenz:icons/archive_search" { export=icon }
declare module "lenz:icons/archive_search_outline" { export=icon }
declare module "lenz:icons/archive_settings" { export=icon }
declare module "lenz:icons/archive_settings_outline" { export=icon }
declare module "lenz:icons/archive_star" { export=icon }
declare module "lenz:icons/archive_star_outline" { export=icon }
declare module "lenz:icons/archive_sync" { export=icon }
declare module "lenz:icons/archive_sync_outline" { export=icon }
declare module "lenz:icons/arm_flex" { export=icon }
declare module "lenz:icons/arm_flex_outline" { export=icon }
declare module "lenz:icons/arrange_bring_forward" { export=icon }
declare module "lenz:icons/arrange_bring_to_front" { export=icon }
declare module "lenz:icons/arrange_send_backward" { export=icon }
declare module "lenz:icons/arrange_send_to_back" { export=icon }
declare module "lenz:icons/arrow_all" { export=icon }
declare module "lenz:icons/arrow_bottom_left" { export=icon }
declare module "lenz:icons/arrow_bottom_left_bold_box" { export=icon }
declare module "lenz:icons/arrow_bottom_left_bold_box_outline" { export=icon }
declare module "lenz:icons/arrow_bottom_left_bold_outline" { export=icon }
declare module "lenz:icons/arrow_bottom_left_thick" { export=icon }
declare module "lenz:icons/arrow_bottom_left_thin" { export=icon }
declare module "lenz:icons/arrow_bottom_left_thin_circle_outline" { export=icon }
declare module "lenz:icons/arrow_bottom_right" { export=icon }
declare module "lenz:icons/arrow_bottom_right_bold_box" { export=icon }
declare module "lenz:icons/arrow_bottom_right_bold_box_outline" { export=icon }
declare module "lenz:icons/arrow_bottom_right_bold_outline" { export=icon }
declare module "lenz:icons/arrow_bottom_right_thick" { export=icon }
declare module "lenz:icons/arrow_bottom_right_thin" { export=icon }
declare module "lenz:icons/arrow_bottom_right_thin_circle_outline" { export=icon }
declare module "lenz:icons/arrow_collapse" { export=icon }
declare module "lenz:icons/arrow_collapse_all" { export=icon }
declare module "lenz:icons/arrow_collapse_down" { export=icon }
declare module "lenz:icons/arrow_collapse_horizontal" { export=icon }
declare module "lenz:icons/arrow_collapse_left" { export=icon }
declare module "lenz:icons/arrow_collapse_right" { export=icon }
declare module "lenz:icons/arrow_collapse_up" { export=icon }
declare module "lenz:icons/arrow_collapse_vertical" { export=icon }
declare module "lenz:icons/arrow_decision" { export=icon }
declare module "lenz:icons/arrow_decision_auto" { export=icon }
declare module "lenz:icons/arrow_decision_auto_outline" { export=icon }
declare module "lenz:icons/arrow_decision_outline" { export=icon }
declare module "lenz:icons/arrow_down" { export=icon }
declare module "lenz:icons/arrow_down_bold" { export=icon }
declare module "lenz:icons/arrow_down_bold_box" { export=icon }
declare module "lenz:icons/arrow_down_bold_box_outline" { export=icon }
declare module "lenz:icons/arrow_down_bold_circle" { export=icon }
declare module "lenz:icons/arrow_down_bold_circle_outline" { export=icon }
declare module "lenz:icons/arrow_down_bold_hexagon_outline" { export=icon }
declare module "lenz:icons/arrow_down_bold_outline" { export=icon }
declare module "lenz:icons/arrow_down_box" { export=icon }
declare module "lenz:icons/arrow_down_circle" { export=icon }
declare module "lenz:icons/arrow_down_circle_outline" { export=icon }
declare module "lenz:icons/arrow_down_drop_circle" { export=icon }
declare module "lenz:icons/arrow_down_drop_circle_outline" { export=icon }
declare module "lenz:icons/arrow_down_left" { export=icon }
declare module "lenz:icons/arrow_down_left_bold" { export=icon }
declare module "lenz:icons/arrow_down_right" { export=icon }
declare module "lenz:icons/arrow_down_right_bold" { export=icon }
declare module "lenz:icons/arrow_down_thick" { export=icon }
declare module "lenz:icons/arrow_down_thin" { export=icon }
declare module "lenz:icons/arrow_down_thin_circle_outline" { export=icon }
declare module "lenz:icons/arrow_expand" { export=icon }
declare module "lenz:icons/arrow_expand_all" { export=icon }
declare module "lenz:icons/arrow_expand_down" { export=icon }
declare module "lenz:icons/arrow_expand_horizontal" { export=icon }
declare module "lenz:icons/arrow_expand_left" { export=icon }
declare module "lenz:icons/arrow_expand_right" { export=icon }
declare module "lenz:icons/arrow_expand_up" { export=icon }
declare module "lenz:icons/arrow_expand_vertical" { export=icon }
declare module "lenz:icons/arrow_horizontal_lock" { export=icon }
declare module "lenz:icons/arrow_left" { export=icon }
declare module "lenz:icons/arrow_left_bold" { export=icon }
declare module "lenz:icons/arrow_left_bold_box" { export=icon }
declare module "lenz:icons/arrow_left_bold_box_outline" { export=icon }
declare module "lenz:icons/arrow_left_bold_circle" { export=icon }
declare module "lenz:icons/arrow_left_bold_circle_outline" { export=icon }
declare module "lenz:icons/arrow_left_bold_hexagon_outline" { export=icon }
declare module "lenz:icons/arrow_left_bold_outline" { export=icon }
declare module "lenz:icons/arrow_left_bottom" { export=icon }
declare module "lenz:icons/arrow_left_bottom_bold" { export=icon }
declare module "lenz:icons/arrow_left_box" { export=icon }
declare module "lenz:icons/arrow_left_circle" { export=icon }
declare module "lenz:icons/arrow_left_circle_outline" { export=icon }
declare module "lenz:icons/arrow_left_drop_circle" { export=icon }
declare module "lenz:icons/arrow_left_drop_circle_outline" { export=icon }
declare module "lenz:icons/arrow_left_right" { export=icon }
declare module "lenz:icons/arrow_left_right_bold" { export=icon }
declare module "lenz:icons/arrow_left_right_bold_outline" { export=icon }
declare module "lenz:icons/arrow_left_thick" { export=icon }
declare module "lenz:icons/arrow_left_thin" { export=icon }
declare module "lenz:icons/arrow_left_thin_circle_outline" { export=icon }
declare module "lenz:icons/arrow_left_top" { export=icon }
declare module "lenz:icons/arrow_left_top_bold" { export=icon }
declare module "lenz:icons/arrow_oscillating" { export=icon }
declare module "lenz:icons/arrow_oscillating_off" { export=icon }
declare module "lenz:icons/arrow_projectile" { export=icon }
declare module "lenz:icons/arrow_projectile_multiple" { export=icon }
declare module "lenz:icons/arrow_right" { export=icon }
declare module "lenz:icons/arrow_right_bold" { export=icon }
declare module "lenz:icons/arrow_right_bold_box" { export=icon }
declare module "lenz:icons/arrow_right_bold_box_outline" { export=icon }
declare module "lenz:icons/arrow_right_bold_circle" { export=icon }
declare module "lenz:icons/arrow_right_bold_circle_outline" { export=icon }
declare module "lenz:icons/arrow_right_bold_hexagon_outline" { export=icon }
declare module "lenz:icons/arrow_right_bold_outline" { export=icon }
declare module "lenz:icons/arrow_right_bottom" { export=icon }
declare module "lenz:icons/arrow_right_bottom_bold" { export=icon }
declare module "lenz:icons/arrow_right_box" { export=icon }
declare module "lenz:icons/arrow_right_circle" { export=icon }
declare module "lenz:icons/arrow_right_circle_outline" { export=icon }
declare module "lenz:icons/arrow_right_drop_circle" { export=icon }
declare module "lenz:icons/arrow_right_drop_circle_outline" { export=icon }
declare module "lenz:icons/arrow_right_thick" { export=icon }
declare module "lenz:icons/arrow_right_thin" { export=icon }
declare module "lenz:icons/arrow_right_thin_circle_outline" { export=icon }
declare module "lenz:icons/arrow_right_top" { export=icon }
declare module "lenz:icons/arrow_right_top_bold" { export=icon }
declare module "lenz:icons/arrow_split_horizontal" { export=icon }
declare module "lenz:icons/arrow_split_vertical" { export=icon }
declare module "lenz:icons/arrow_top_left" { export=icon }
declare module "lenz:icons/arrow_top_left_bold_box" { export=icon }
declare module "lenz:icons/arrow_top_left_bold_box_outline" { export=icon }
declare module "lenz:icons/arrow_top_left_bold_outline" { export=icon }
declare module "lenz:icons/arrow_top_left_bottom_right" { export=icon }
declare module "lenz:icons/arrow_top_left_bottom_right_bold" { export=icon }
declare module "lenz:icons/arrow_top_left_thick" { export=icon }
declare module "lenz:icons/arrow_top_left_thin" { export=icon }
declare module "lenz:icons/arrow_top_left_thin_circle_outline" { export=icon }
declare module "lenz:icons/arrow_top_right" { export=icon }
declare module "lenz:icons/arrow_top_right_bold_box" { export=icon }
declare module "lenz:icons/arrow_top_right_bold_box_outline" { export=icon }
declare module "lenz:icons/arrow_top_right_bold_outline" { export=icon }
declare module "lenz:icons/arrow_top_right_bottom_left" { export=icon }
declare module "lenz:icons/arrow_top_right_bottom_left_bold" { export=icon }
declare module "lenz:icons/arrow_top_right_thick" { export=icon }
declare module "lenz:icons/arrow_top_right_thin" { export=icon }
declare module "lenz:icons/arrow_top_right_thin_circle_outline" { export=icon }
declare module "lenz:icons/arrow_udown_left" { export=icon }
declare module "lenz:icons/arrow_udown_left_bold" { export=icon }
declare module "lenz:icons/arrow_udown_right" { export=icon }
declare module "lenz:icons/arrow_udown_right_bold" { export=icon }
declare module "lenz:icons/arrow_uleft_bottom" { export=icon }
declare module "lenz:icons/arrow_uleft_bottom_bold" { export=icon }
declare module "lenz:icons/arrow_uleft_top" { export=icon }
declare module "lenz:icons/arrow_uleft_top_bold" { export=icon }
declare module "lenz:icons/arrow_up" { export=icon }
declare module "lenz:icons/arrow_up_bold" { export=icon }
declare module "lenz:icons/arrow_up_bold_box" { export=icon }
declare module "lenz:icons/arrow_up_bold_box_outline" { export=icon }
declare module "lenz:icons/arrow_up_bold_circle" { export=icon }
declare module "lenz:icons/arrow_up_bold_circle_outline" { export=icon }
declare module "lenz:icons/arrow_up_bold_hexagon_outline" { export=icon }
declare module "lenz:icons/arrow_up_bold_outline" { export=icon }
declare module "lenz:icons/arrow_up_box" { export=icon }
declare module "lenz:icons/arrow_up_circle" { export=icon }
declare module "lenz:icons/arrow_up_circle_outline" { export=icon }
declare module "lenz:icons/arrow_up_down" { export=icon }
declare module "lenz:icons/arrow_up_down_bold" { export=icon }
declare module "lenz:icons/arrow_up_down_bold_outline" { export=icon }
declare module "lenz:icons/arrow_up_drop_circle" { export=icon }
declare module "lenz:icons/arrow_up_drop_circle_outline" { export=icon }
declare module "lenz:icons/arrow_up_left" { export=icon }
declare module "lenz:icons/arrow_up_left_bold" { export=icon }
declare module "lenz:icons/arrow_up_right" { export=icon }
declare module "lenz:icons/arrow_up_right_bold" { export=icon }
declare module "lenz:icons/arrow_up_thick" { export=icon }
declare module "lenz:icons/arrow_up_thin" { export=icon }
declare module "lenz:icons/arrow_up_thin_circle_outline" { export=icon }
declare module "lenz:icons/arrow_uright_bottom" { export=icon }
declare module "lenz:icons/arrow_uright_bottom_bold" { export=icon }
declare module "lenz:icons/arrow_uright_top" { export=icon }
declare module "lenz:icons/arrow_uright_top_bold" { export=icon }
declare module "lenz:icons/arrow_uup_left" { export=icon }
declare module "lenz:icons/arrow_uup_left_bold" { export=icon }
declare module "lenz:icons/arrow_uup_right" { export=icon }
declare module "lenz:icons/arrow_uup_right_bold" { export=icon }
declare module "lenz:icons/arrow_vertical_lock" { export=icon }
declare module "lenz:icons/artboard" { export=icon }
declare module "lenz:icons/artstation" { export=icon }
declare module "lenz:icons/aspect_ratio" { export=icon }
declare module "lenz:icons/assistant" { export=icon }
declare module "lenz:icons/asterisk" { export=icon }
declare module "lenz:icons/asterisk_circle_outline" { export=icon }
declare module "lenz:icons/at" { export=icon }
declare module "lenz:icons/atlassian" { export=icon }
declare module "lenz:icons/atm" { export=icon }
declare module "lenz:icons/atom" { export=icon }
declare module "lenz:icons/atom_variant" { export=icon }
declare module "lenz:icons/attachment" { export=icon }
declare module "lenz:icons/attachment_check" { export=icon }
declare module "lenz:icons/attachment_lock" { export=icon }
declare module "lenz:icons/attachment_minus" { export=icon }
declare module "lenz:icons/attachment_off" { export=icon }
declare module "lenz:icons/attachment_plus" { export=icon }
declare module "lenz:icons/attachment_remove" { export=icon }
declare module "lenz:icons/atv" { export=icon }
declare module "lenz:icons/audio_input_rca" { export=icon }
declare module "lenz:icons/audio_input_stereo_minijack" { export=icon }
declare module "lenz:icons/audio_input_xlr" { export=icon }
declare module "lenz:icons/audio_video" { export=icon }
declare module "lenz:icons/audio_video_off" { export=icon }
declare module "lenz:icons/augmented_reality" { export=icon }
declare module "lenz:icons/aurora" { export=icon }
declare module "lenz:icons/auto_download" { export=icon }
declare module "lenz:icons/auto_fix" { export=icon }
declare module "lenz:icons/auto_mode" { export=icon }
declare module "lenz:icons/auto_upload" { export=icon }
declare module "lenz:icons/autorenew" { export=icon }
declare module "lenz:icons/autorenew_off" { export=icon }
declare module "lenz:icons/av_timer" { export=icon }
declare module "lenz:icons/awning" { export=icon }
declare module "lenz:icons/awning_outline" { export=icon }
declare module "lenz:icons/aws" { export=icon }
declare module "lenz:icons/axe" { export=icon }
declare module "lenz:icons/axe_battle" { export=icon }
declare module "lenz:icons/axis" { export=icon }
declare module "lenz:icons/axis_arrow" { export=icon }
declare module "lenz:icons/axis_arrow_info" { export=icon }
declare module "lenz:icons/axis_arrow_lock" { export=icon }
declare module "lenz:icons/axis_lock" { export=icon }
declare module "lenz:icons/axis_xarrow" { export=icon }
declare module "lenz:icons/axis_xarrow_lock" { export=icon }
declare module "lenz:icons/axis_xrotate_clockwise" { export=icon }
declare module "lenz:icons/axis_xrotate_counterclockwise" { export=icon }
declare module "lenz:icons/axis_xyarrow_lock" { export=icon }
declare module "lenz:icons/axis_yarrow" { export=icon }
declare module "lenz:icons/axis_yarrow_lock" { export=icon }
declare module "lenz:icons/axis_yrotate_clockwise" { export=icon }
declare module "lenz:icons/axis_yrotate_counterclockwise" { export=icon }
declare module "lenz:icons/axis_zarrow" { export=icon }
declare module "lenz:icons/axis_zarrow_lock" { export=icon }
declare module "lenz:icons/axis_zrotate_clockwise" { export=icon }
declare module "lenz:icons/axis_zrotate_counterclockwise" { export=icon }
declare module "lenz:icons/babel" { export=icon }
declare module "lenz:icons/baby" { export=icon }
declare module "lenz:icons/baby_bottle" { export=icon }
declare module "lenz:icons/baby_bottle_outline" { export=icon }
declare module "lenz:icons/baby_buggy" { export=icon }
declare module "lenz:icons/baby_buggy_off" { export=icon }
declare module "lenz:icons/baby_carriage" { export=icon }
declare module "lenz:icons/baby_carriage_off" { export=icon }
declare module "lenz:icons/baby_face" { export=icon }
declare module "lenz:icons/baby_face_outline" { export=icon }
declare module "lenz:icons/backburger" { export=icon }
declare module "lenz:icons/backspace" { export=icon }
declare module "lenz:icons/backspace_outline" { export=icon }
declare module "lenz:icons/backspace_reverse" { export=icon }
declare module "lenz:icons/backspace_reverse_outline" { export=icon }
declare module "lenz:icons/backup_restore" { export=icon }
declare module "lenz:icons/bacteria" { export=icon }
declare module "lenz:icons/bacteria_outline" { export=icon }
declare module "lenz:icons/badge_account" { export=icon }
declare module "lenz:icons/badge_account_alert" { export=icon }
declare module "lenz:icons/badge_account_alert_outline" { export=icon }
declare module "lenz:icons/badge_account_horizontal" { export=icon }
declare module "lenz:icons/badge_account_horizontal_outline" { export=icon }
declare module "lenz:icons/badge_account_outline" { export=icon }
declare module "lenz:icons/badminton" { export=icon }
declare module "lenz:icons/bag_carry_on" { export=icon }
declare module "lenz:icons/bag_carry_on_check" { export=icon }
declare module "lenz:icons/bag_carry_on_off" { export=icon }
declare module "lenz:icons/bag_checked" { export=icon }
declare module "lenz:icons/bag_personal" { export=icon }
declare module "lenz:icons/bag_personal_off" { export=icon }
declare module "lenz:icons/bag_personal_off_outline" { export=icon }
declare module "lenz:icons/bag_personal_outline" { export=icon }
declare module "lenz:icons/bag_personal_plus" { export=icon }
declare module "lenz:icons/bag_personal_plus_outline" { export=icon }
declare module "lenz:icons/bag_personal_tag" { export=icon }
declare module "lenz:icons/bag_personal_tag_outline" { export=icon }
declare module "lenz:icons/bag_suitcase" { export=icon }
declare module "lenz:icons/bag_suitcase_off" { export=icon }
declare module "lenz:icons/bag_suitcase_off_outline" { export=icon }
declare module "lenz:icons/bag_suitcase_outline" { export=icon }
declare module "lenz:icons/baguette" { export=icon }
declare module "lenz:icons/balcony" { export=icon }
declare module "lenz:icons/balloon" { export=icon }
declare module "lenz:icons/ballot" { export=icon }
declare module "lenz:icons/ballot_outline" { export=icon }
declare module "lenz:icons/ballot_recount" { export=icon }
declare module "lenz:icons/ballot_recount_outline" { export=icon }
declare module "lenz:icons/bandage" { export=icon }
declare module "lenz:icons/bank" { export=icon }
declare module "lenz:icons/bank_check" { export=icon }
declare module "lenz:icons/bank_circle" { export=icon }
declare module "lenz:icons/bank_circle_outline" { export=icon }
declare module "lenz:icons/bank_minus" { export=icon }
declare module "lenz:icons/bank_off" { export=icon }
declare module "lenz:icons/bank_off_outline" { export=icon }
declare module "lenz:icons/bank_outline" { export=icon }
declare module "lenz:icons/bank_plus" { export=icon }
declare module "lenz:icons/bank_remove" { export=icon }
declare module "lenz:icons/bank_transfer" { export=icon }
declare module "lenz:icons/bank_transfer_in" { export=icon }
declare module "lenz:icons/bank_transfer_out" { export=icon }
declare module "lenz:icons/barcode" { export=icon }
declare module "lenz:icons/barcode_off" { export=icon }
declare module "lenz:icons/barcode_scan" { export=icon }
declare module "lenz:icons/barley" { export=icon }
declare module "lenz:icons/barley_off" { export=icon }
declare module "lenz:icons/barn" { export=icon }
declare module "lenz:icons/barrel" { export=icon }
declare module "lenz:icons/barrel_outline" { export=icon }
declare module "lenz:icons/baseball" { export=icon }
declare module "lenz:icons/baseball_bat" { export=icon }
declare module "lenz:icons/baseball_diamond" { export=icon }
declare module "lenz:icons/baseball_diamond_outline" { export=icon }
declare module "lenz:icons/baseball_outline" { export=icon }
declare module "lenz:icons/bash" { export=icon }
declare module "lenz:icons/basket" { export=icon }
declare module "lenz:icons/basket_check" { export=icon }
declare module "lenz:icons/basket_check_outline" { export=icon }
declare module "lenz:icons/basket_fill" { export=icon }
declare module "lenz:icons/basket_minus" { export=icon }
declare module "lenz:icons/basket_minus_outline" { export=icon }
declare module "lenz:icons/basket_off" { export=icon }
declare module "lenz:icons/basket_off_outline" { export=icon }
declare module "lenz:icons/basket_outline" { export=icon }
declare module "lenz:icons/basket_plus" { export=icon }
declare module "lenz:icons/basket_plus_outline" { export=icon }
declare module "lenz:icons/basket_remove" { export=icon }
declare module "lenz:icons/basket_remove_outline" { export=icon }
declare module "lenz:icons/basket_unfill" { export=icon }
declare module "lenz:icons/basketball" { export=icon }
declare module "lenz:icons/basketball_hoop" { export=icon }
declare module "lenz:icons/basketball_hoop_outline" { export=icon }
declare module "lenz:icons/bat" { export=icon }
declare module "lenz:icons/bathtub" { export=icon }
declare module "lenz:icons/bathtub_outline" { export=icon }
declare module "lenz:icons/battery" { export=icon }
declare module "lenz:icons/battery10" { export=icon }
declare module "lenz:icons/battery10bluetooth" { export=icon }
declare module "lenz:icons/battery20" { export=icon }
declare module "lenz:icons/battery20bluetooth" { export=icon }
declare module "lenz:icons/battery30" { export=icon }
declare module "lenz:icons/battery30bluetooth" { export=icon }
declare module "lenz:icons/battery40" { export=icon }
declare module "lenz:icons/battery40bluetooth" { export=icon }
declare module "lenz:icons/battery50" { export=icon }
declare module "lenz:icons/battery50bluetooth" { export=icon }
declare module "lenz:icons/battery60" { export=icon }
declare module "lenz:icons/battery60bluetooth" { export=icon }
declare module "lenz:icons/battery70" { export=icon }
declare module "lenz:icons/battery70bluetooth" { export=icon }
declare module "lenz:icons/battery80" { export=icon }
declare module "lenz:icons/battery80bluetooth" { export=icon }
declare module "lenz:icons/battery90" { export=icon }
declare module "lenz:icons/battery90bluetooth" { export=icon }
declare module "lenz:icons/battery_alert" { export=icon }
declare module "lenz:icons/battery_alert_bluetooth" { export=icon }
declare module "lenz:icons/battery_alert_variant" { export=icon }
declare module "lenz:icons/battery_alert_variant_outline" { export=icon }
declare module "lenz:icons/battery_arrow_down" { export=icon }
declare module "lenz:icons/battery_arrow_down_outline" { export=icon }
declare module "lenz:icons/battery_arrow_up" { export=icon }
declare module "lenz:icons/battery_arrow_up_outline" { export=icon }
declare module "lenz:icons/battery_bluetooth" { export=icon }
declare module "lenz:icons/battery_bluetooth_variant" { export=icon }
declare module "lenz:icons/battery_charging" { export=icon }
declare module "lenz:icons/battery_charging10" { export=icon }
declare module "lenz:icons/battery_charging100" { export=icon }
declare module "lenz:icons/battery_charging20" { export=icon }
declare module "lenz:icons/battery_charging30" { export=icon }
declare module "lenz:icons/battery_charging40" { export=icon }
declare module "lenz:icons/battery_charging50" { export=icon }
declare module "lenz:icons/battery_charging60" { export=icon }
declare module "lenz:icons/battery_charging70" { export=icon }
declare module "lenz:icons/battery_charging80" { export=icon }
declare module "lenz:icons/battery_charging90" { export=icon }
declare module "lenz:icons/battery_charging_high" { export=icon }
declare module "lenz:icons/battery_charging_low" { export=icon }
declare module "lenz:icons/battery_charging_medium" { export=icon }
declare module "lenz:icons/battery_charging_outline" { export=icon }
declare module "lenz:icons/battery_charging_wireless" { export=icon }
declare module "lenz:icons/battery_charging_wireless10" { export=icon }
declare module "lenz:icons/battery_charging_wireless20" { export=icon }
declare module "lenz:icons/battery_charging_wireless30" { export=icon }
declare module "lenz:icons/battery_charging_wireless40" { export=icon }
declare module "lenz:icons/battery_charging_wireless50" { export=icon }
declare module "lenz:icons/battery_charging_wireless60" { export=icon }
declare module "lenz:icons/battery_charging_wireless70" { export=icon }
declare module "lenz:icons/battery_charging_wireless80" { export=icon }
declare module "lenz:icons/battery_charging_wireless90" { export=icon }
declare module "lenz:icons/battery_charging_wireless_alert" { export=icon }
declare module "lenz:icons/battery_charging_wireless_outline" { export=icon }
declare module "lenz:icons/battery_check" { export=icon }
declare module "lenz:icons/battery_check_outline" { export=icon }
declare module "lenz:icons/battery_clock" { export=icon }
declare module "lenz:icons/battery_clock_outline" { export=icon }
declare module "lenz:icons/battery_heart" { export=icon }
declare module "lenz:icons/battery_heart_outline" { export=icon }
declare module "lenz:icons/battery_heart_variant" { export=icon }
declare module "lenz:icons/battery_high" { export=icon }
declare module "lenz:icons/battery_lock" { export=icon }
declare module "lenz:icons/battery_lock_open" { export=icon }
declare module "lenz:icons/battery_low" { export=icon }
declare module "lenz:icons/battery_medium" { export=icon }
declare module "lenz:icons/battery_minus" { export=icon }
declare module "lenz:icons/battery_minus_outline" { export=icon }
declare module "lenz:icons/battery_minus_variant" { export=icon }
declare module "lenz:icons/battery_negative" { export=icon }
declare module "lenz:icons/battery_off" { export=icon }
declare module "lenz:icons/battery_off_outline" { export=icon }
declare module "lenz:icons/battery_outline" { export=icon }
declare module "lenz:icons/battery_plus" { export=icon }
declare module "lenz:icons/battery_plus_outline" { export=icon }
declare module "lenz:icons/battery_plus_variant" { export=icon }
declare module "lenz:icons/battery_positive" { export=icon }
declare module "lenz:icons/battery_remove" { export=icon }
declare module "lenz:icons/battery_remove_outline" { export=icon }
declare module "lenz:icons/battery_sync" { export=icon }
declare module "lenz:icons/battery_sync_outline" { export=icon }
declare module "lenz:icons/battery_unknown" { export=icon }
declare module "lenz:icons/battery_unknown_bluetooth" { export=icon }
declare module "lenz:icons/beach" { export=icon }
declare module "lenz:icons/beaker" { export=icon }
declare module "lenz:icons/beaker_alert" { export=icon }
declare module "lenz:icons/beaker_alert_outline" { export=icon }
declare module "lenz:icons/beaker_check" { export=icon }
declare module "lenz:icons/beaker_check_outline" { export=icon }
declare module "lenz:icons/beaker_minus" { export=icon }
declare module "lenz:icons/beaker_minus_outline" { export=icon }
declare module "lenz:icons/beaker_outline" { export=icon }
declare module "lenz:icons/beaker_plus" { export=icon }
declare module "lenz:icons/beaker_plus_outline" { export=icon }
declare module "lenz:icons/beaker_question" { export=icon }
declare module "lenz:icons/beaker_question_outline" { export=icon }
declare module "lenz:icons/beaker_remove" { export=icon }
declare module "lenz:icons/beaker_remove_outline" { export=icon }
declare module "lenz:icons/bed" { export=icon }
declare module "lenz:icons/bed_clock" { export=icon }
declare module "lenz:icons/bed_double" { export=icon }
declare module "lenz:icons/bed_double_outline" { export=icon }
declare module "lenz:icons/bed_empty" { export=icon }
declare module "lenz:icons/bed_king" { export=icon }
declare module "lenz:icons/bed_king_outline" { export=icon }
declare module "lenz:icons/bed_outline" { export=icon }
declare module "lenz:icons/bed_queen" { export=icon }
declare module "lenz:icons/bed_queen_outline" { export=icon }
declare module "lenz:icons/bed_single" { export=icon }
declare module "lenz:icons/bed_single_outline" { export=icon }
declare module "lenz:icons/bee" { export=icon }
declare module "lenz:icons/bee_flower" { export=icon }
declare module "lenz:icons/beehive_off_outline" { export=icon }
declare module "lenz:icons/beehive_outline" { export=icon }
declare module "lenz:icons/beekeeper" { export=icon }
declare module "lenz:icons/beer" { export=icon }
declare module "lenz:icons/beer_outline" { export=icon }
declare module "lenz:icons/bell" { export=icon }
declare module "lenz:icons/bell_alert" { export=icon }
declare module "lenz:icons/bell_alert_outline" { export=icon }
declare module "lenz:icons/bell_badge" { export=icon }
declare module "lenz:icons/bell_badge_outline" { export=icon }
declare module "lenz:icons/bell_cancel" { export=icon }
declare module "lenz:icons/bell_cancel_outline" { export=icon }
declare module "lenz:icons/bell_check" { export=icon }
declare module "lenz:icons/bell_check_outline" { export=icon }
declare module "lenz:icons/bell_circle" { export=icon }
declare module "lenz:icons/bell_circle_outline" { export=icon }
declare module "lenz:icons/bell_cog" { export=icon }
declare module "lenz:icons/bell_cog_outline" { export=icon }
declare module "lenz:icons/bell_minus" { export=icon }
declare module "lenz:icons/bell_minus_outline" { export=icon }
declare module "lenz:icons/bell_off" { export=icon }
declare module "lenz:icons/bell_off_outline" { export=icon }
declare module "lenz:icons/bell_outline" { export=icon }
declare module "lenz:icons/bell_plus" { export=icon }
declare module "lenz:icons/bell_plus_outline" { export=icon }
declare module "lenz:icons/bell_remove" { export=icon }
declare module "lenz:icons/bell_remove_outline" { export=icon }
declare module "lenz:icons/bell_ring" { export=icon }
declare module "lenz:icons/bell_ring_outline" { export=icon }
declare module "lenz:icons/bell_sleep" { export=icon }
declare module "lenz:icons/bell_sleep_outline" { export=icon }
declare module "lenz:icons/bench" { export=icon }
declare module "lenz:icons/bench_back" { export=icon }
declare module "lenz:icons/beta" { export=icon }
declare module "lenz:icons/betamax" { export=icon }
declare module "lenz:icons/biathlon" { export=icon }
declare module "lenz:icons/bicycle" { export=icon }
declare module "lenz:icons/bicycle_basket" { export=icon }
declare module "lenz:icons/bicycle_cargo" { export=icon }
declare module "lenz:icons/bicycle_electric" { export=icon }
declare module "lenz:icons/bicycle_penny_farthing" { export=icon }
declare module "lenz:icons/bike" { export=icon }
declare module "lenz:icons/bike_fast" { export=icon }
declare module "lenz:icons/bike_pedal" { export=icon }
declare module "lenz:icons/bike_pedal_clipless" { export=icon }
declare module "lenz:icons/bike_pedal_mountain" { export=icon }
declare module "lenz:icons/billboard" { export=icon }
declare module "lenz:icons/billiards" { export=icon }
declare module "lenz:icons/billiards_rack" { export=icon }
declare module "lenz:icons/binoculars" { export=icon }
declare module "lenz:icons/bio" { export=icon }
declare module "lenz:icons/biohazard" { export=icon }
declare module "lenz:icons/bird" { export=icon }
declare module "lenz:icons/bitbucket" { export=icon }
declare module "lenz:icons/bitcoin" { export=icon }
declare module "lenz:icons/black_mesa" { export=icon }
declare module "lenz:icons/blender" { export=icon }
declare module "lenz:icons/blender_outline" { export=icon }
declare module "lenz:icons/blender_software" { export=icon }
declare module "lenz:icons/blinds" { export=icon }
declare module "lenz:icons/blinds_horizontal" { export=icon }
declare module "lenz:icons/blinds_horizontal_closed" { export=icon }
declare module "lenz:icons/blinds_open" { export=icon }
declare module "lenz:icons/blinds_vertical" { export=icon }
declare module "lenz:icons/blinds_vertical_closed" { export=icon }
declare module "lenz:icons/block_helper" { export=icon }
declare module "lenz:icons/blood_bag" { export=icon }
declare module "lenz:icons/bluetooth" { export=icon }
declare module "lenz:icons/bluetooth_audio" { export=icon }
declare module "lenz:icons/bluetooth_connect" { export=icon }
declare module "lenz:icons/bluetooth_off" { export=icon }
declare module "lenz:icons/bluetooth_settings" { export=icon }
declare module "lenz:icons/bluetooth_transfer" { export=icon }
declare module "lenz:icons/blur" { export=icon }
declare module "lenz:icons/blur_linear" { export=icon }
declare module "lenz:icons/blur_off" { export=icon }
declare module "lenz:icons/blur_radial" { export=icon }
declare module "lenz:icons/bolt" { export=icon }
declare module "lenz:icons/bomb" { export=icon }
declare module "lenz:icons/bomb_off" { export=icon }
declare module "lenz:icons/bone" { export=icon }
declare module "lenz:icons/bone_off" { export=icon }
declare module "lenz:icons/book" { export=icon }
declare module "lenz:icons/book_account" { export=icon }
declare module "lenz:icons/book_account_outline" { export=icon }
declare module "lenz:icons/book_alert" { export=icon }
declare module "lenz:icons/book_alert_outline" { export=icon }
declare module "lenz:icons/book_alphabet" { export=icon }
declare module "lenz:icons/book_arrow_down" { export=icon }
declare module "lenz:icons/book_arrow_down_outline" { export=icon }
declare module "lenz:icons/book_arrow_left" { export=icon }
declare module "lenz:icons/book_arrow_left_outline" { export=icon }
declare module "lenz:icons/book_arrow_right" { export=icon }
declare module "lenz:icons/book_arrow_right_outline" { export=icon }
declare module "lenz:icons/book_arrow_up" { export=icon }
declare module "lenz:icons/book_arrow_up_outline" { export=icon }
declare module "lenz:icons/book_cancel" { export=icon }
declare module "lenz:icons/book_cancel_outline" { export=icon }
declare module "lenz:icons/book_check" { export=icon }
declare module "lenz:icons/book_check_outline" { export=icon }
declare module "lenz:icons/book_clock" { export=icon }
declare module "lenz:icons/book_clock_outline" { export=icon }
declare module "lenz:icons/book_cog" { export=icon }
declare module "lenz:icons/book_cog_outline" { export=icon }
declare module "lenz:icons/book_cross" { export=icon }
declare module "lenz:icons/book_edit" { export=icon }
declare module "lenz:icons/book_edit_outline" { export=icon }
declare module "lenz:icons/book_education" { export=icon }
declare module "lenz:icons/book_education_outline" { export=icon }
declare module "lenz:icons/book_heart" { export=icon }
declare module "lenz:icons/book_heart_outline" { export=icon }
declare module "lenz:icons/book_information_variant" { export=icon }
declare module "lenz:icons/book_lock" { export=icon }
declare module "lenz:icons/book_lock_open" { export=icon }
declare module "lenz:icons/book_lock_open_outline" { export=icon }
declare module "lenz:icons/book_lock_outline" { export=icon }
declare module "lenz:icons/book_marker" { export=icon }
declare module "lenz:icons/book_marker_outline" { export=icon }
declare module "lenz:icons/book_minus" { export=icon }
declare module "lenz:icons/book_minus_multiple" { export=icon }
declare module "lenz:icons/book_minus_multiple_outline" { export=icon }
declare module "lenz:icons/book_minus_outline" { export=icon }
declare module "lenz:icons/book_multiple" { export=icon }
declare module "lenz:icons/book_multiple_outline" { export=icon }
declare module "lenz:icons/book_music" { export=icon }
declare module "lenz:icons/book_music_outline" { export=icon }
declare module "lenz:icons/book_off" { export=icon }
declare module "lenz:icons/book_off_outline" { export=icon }
declare module "lenz:icons/book_open" { export=icon }
declare module "lenz:icons/book_open_blank_variant" { export=icon }
declare module "lenz:icons/book_open_blank_variant_outline" { export=icon }
declare module "lenz:icons/book_open_outline" { export=icon }
declare module "lenz:icons/book_open_page_variant" { export=icon }
declare module "lenz:icons/book_open_page_variant_outline" { export=icon }
declare module "lenz:icons/book_open_variant" { export=icon }
declare module "lenz:icons/book_open_variant_outline" { export=icon }
declare module "lenz:icons/book_outline" { export=icon }
declare module "lenz:icons/book_play" { export=icon }
declare module "lenz:icons/book_play_outline" { export=icon }
declare module "lenz:icons/book_plus" { export=icon }
declare module "lenz:icons/book_plus_multiple" { export=icon }
declare module "lenz:icons/book_plus_multiple_outline" { export=icon }
declare module "lenz:icons/book_plus_outline" { export=icon }
declare module "lenz:icons/book_refresh" { export=icon }
declare module "lenz:icons/book_refresh_outline" { export=icon }
declare module "lenz:icons/book_remove" { export=icon }
declare module "lenz:icons/book_remove_multiple" { export=icon }
declare module "lenz:icons/book_remove_multiple_outline" { export=icon }
declare module "lenz:icons/book_remove_outline" { export=icon }
declare module "lenz:icons/book_search" { export=icon }
declare module "lenz:icons/book_search_outline" { export=icon }
declare module "lenz:icons/book_settings" { export=icon }
declare module "lenz:icons/book_settings_outline" { export=icon }
declare module "lenz:icons/book_sync" { export=icon }
declare module "lenz:icons/book_sync_outline" { export=icon }
declare module "lenz:icons/book_variant" { export=icon }
declare module "lenz:icons/bookmark" { export=icon }
declare module "lenz:icons/bookmark_box" { export=icon }
declare module "lenz:icons/bookmark_box_multiple" { export=icon }
declare module "lenz:icons/bookmark_box_multiple_outline" { export=icon }
declare module "lenz:icons/bookmark_box_outline" { export=icon }
declare module "lenz:icons/bookmark_check" { export=icon }
declare module "lenz:icons/bookmark_check_outline" { export=icon }
declare module "lenz:icons/bookmark_minus" { export=icon }
declare module "lenz:icons/bookmark_minus_outline" { export=icon }
declare module "lenz:icons/bookmark_multiple" { export=icon }
declare module "lenz:icons/bookmark_multiple_outline" { export=icon }
declare module "lenz:icons/bookmark_music" { export=icon }
declare module "lenz:icons/bookmark_music_outline" { export=icon }
declare module "lenz:icons/bookmark_off" { export=icon }
declare module "lenz:icons/bookmark_off_outline" { export=icon }
declare module "lenz:icons/bookmark_outline" { export=icon }
declare module "lenz:icons/bookmark_plus" { export=icon }
declare module "lenz:icons/bookmark_plus_outline" { export=icon }
declare module "lenz:icons/bookmark_remove" { export=icon }
declare module "lenz:icons/bookmark_remove_outline" { export=icon }
declare module "lenz:icons/bookshelf" { export=icon }
declare module "lenz:icons/boom_gate" { export=icon }
declare module "lenz:icons/boom_gate_alert" { export=icon }
declare module "lenz:icons/boom_gate_alert_outline" { export=icon }
declare module "lenz:icons/boom_gate_arrow_down" { export=icon }
declare module "lenz:icons/boom_gate_arrow_down_outline" { export=icon }
declare module "lenz:icons/boom_gate_arrow_up" { export=icon }
declare module "lenz:icons/boom_gate_arrow_up_outline" { export=icon }
declare module "lenz:icons/boom_gate_outline" { export=icon }
declare module "lenz:icons/boom_gate_up" { export=icon }
declare module "lenz:icons/boom_gate_up_outline" { export=icon }
declare module "lenz:icons/boombox" { export=icon }
declare module "lenz:icons/boomerang" { export=icon }
declare module "lenz:icons/bootstrap" { export=icon }
declare module "lenz:icons/border_all" { export=icon }
declare module "lenz:icons/border_all_variant" { export=icon }
declare module "lenz:icons/border_bottom" { export=icon }
declare module "lenz:icons/border_bottom_variant" { export=icon }
declare module "lenz:icons/border_color" { export=icon }
declare module "lenz:icons/border_horizontal" { export=icon }
declare module "lenz:icons/border_inside" { export=icon }
declare module "lenz:icons/border_left" { export=icon }
declare module "lenz:icons/border_left_variant" { export=icon }
declare module "lenz:icons/border_none" { export=icon }
declare module "lenz:icons/border_none_variant" { export=icon }
declare module "lenz:icons/border_outside" { export=icon }
declare module "lenz:icons/border_radius" { export=icon }
declare module "lenz:icons/border_right" { export=icon }
declare module "lenz:icons/border_right_variant" { export=icon }
declare module "lenz:icons/border_style" { export=icon }
declare module "lenz:icons/border_top" { export=icon }
declare module "lenz:icons/border_top_variant" { export=icon }
declare module "lenz:icons/border_vertical" { export=icon }
declare module "lenz:icons/bottle_soda" { export=icon }
declare module "lenz:icons/bottle_soda_classic" { export=icon }
declare module "lenz:icons/bottle_soda_classic_outline" { export=icon }
declare module "lenz:icons/bottle_soda_outline" { export=icon }
declare module "lenz:icons/bottle_tonic" { export=icon }
declare module "lenz:icons/bottle_tonic_outline" { export=icon }
declare module "lenz:icons/bottle_tonic_plus" { export=icon }
declare module "lenz:icons/bottle_tonic_plus_outline" { export=icon }
declare module "lenz:icons/bottle_tonic_skull" { export=icon }
declare module "lenz:icons/bottle_tonic_skull_outline" { export=icon }
declare module "lenz:icons/bottle_wine" { export=icon }
declare module "lenz:icons/bottle_wine_outline" { export=icon }
declare module "lenz:icons/bow_arrow" { export=icon }
declare module "lenz:icons/bow_tie" { export=icon }
declare module "lenz:icons/bowl" { export=icon }
declare module "lenz:icons/bowl_mix" { export=icon }
declare module "lenz:icons/bowl_mix_outline" { export=icon }
declare module "lenz:icons/bowl_outline" { export=icon }
declare module "lenz:icons/bowling" { export=icon }
declare module "lenz:icons/box" { export=icon }
declare module "lenz:icons/box_cutter" { export=icon }
declare module "lenz:icons/box_cutter_off" { export=icon }
declare module "lenz:icons/box_shadow" { export=icon }
declare module "lenz:icons/boxing_glove" { export=icon }
declare module "lenz:icons/braille" { export=icon }
declare module "lenz:icons/brain" { export=icon }
declare module "lenz:icons/bread_slice" { export=icon }
declare module "lenz:icons/bread_slice_outline" { export=icon }
declare module "lenz:icons/bridge" { export=icon }
declare module "lenz:icons/briefcase" { export=icon }
declare module "lenz:icons/briefcase_account" { export=icon }
declare module "lenz:icons/briefcase_account_outline" { export=icon }
declare module "lenz:icons/briefcase_arrow_left_right" { export=icon }
declare module "lenz:icons/briefcase_arrow_left_right_outline" { export=icon }
declare module "lenz:icons/briefcase_arrow_up_down" { export=icon }
declare module "lenz:icons/briefcase_arrow_up_down_outline" { export=icon }
declare module "lenz:icons/briefcase_check" { export=icon }
declare module "lenz:icons/briefcase_check_outline" { export=icon }
declare module "lenz:icons/briefcase_clock" { export=icon }
declare module "lenz:icons/briefcase_clock_outline" { export=icon }
declare module "lenz:icons/briefcase_download" { export=icon }
declare module "lenz:icons/briefcase_download_outline" { export=icon }
declare module "lenz:icons/briefcase_edit" { export=icon }
declare module "lenz:icons/briefcase_edit_outline" { export=icon }
declare module "lenz:icons/briefcase_eye" { export=icon }
declare module "lenz:icons/briefcase_eye_outline" { export=icon }
declare module "lenz:icons/briefcase_minus" { export=icon }
declare module "lenz:icons/briefcase_minus_outline" { export=icon }
declare module "lenz:icons/briefcase_off" { export=icon }
declare module "lenz:icons/briefcase_off_outline" { export=icon }
declare module "lenz:icons/briefcase_outline" { export=icon }
declare module "lenz:icons/briefcase_plus" { export=icon }
declare module "lenz:icons/briefcase_plus_outline" { export=icon }
declare module "lenz:icons/briefcase_remove" { export=icon }
declare module "lenz:icons/briefcase_remove_outline" { export=icon }
declare module "lenz:icons/briefcase_search" { export=icon }
declare module "lenz:icons/briefcase_search_outline" { export=icon }
declare module "lenz:icons/briefcase_upload" { export=icon }
declare module "lenz:icons/briefcase_upload_outline" { export=icon }
declare module "lenz:icons/briefcase_variant" { export=icon }
declare module "lenz:icons/briefcase_variant_off" { export=icon }
declare module "lenz:icons/briefcase_variant_off_outline" { export=icon }
declare module "lenz:icons/briefcase_variant_outline" { export=icon }
declare module "lenz:icons/brightness1" { export=icon }
declare module "lenz:icons/brightness2" { export=icon }
declare module "lenz:icons/brightness3" { export=icon }
declare module "lenz:icons/brightness4" { export=icon }
declare module "lenz:icons/brightness5" { export=icon }
declare module "lenz:icons/brightness6" { export=icon }
declare module "lenz:icons/brightness7" { export=icon }
declare module "lenz:icons/brightness_auto" { export=icon }
declare module "lenz:icons/brightness_percent" { export=icon }
declare module "lenz:icons/broadcast" { export=icon }
declare module "lenz:icons/broadcast_off" { export=icon }
declare module "lenz:icons/broom" { export=icon }
declare module "lenz:icons/brush" { export=icon }
declare module "lenz:icons/brush_off" { export=icon }
declare module "lenz:icons/brush_outline" { export=icon }
declare module "lenz:icons/brush_variant" { export=icon }
declare module "lenz:icons/bucket" { export=icon }
declare module "lenz:icons/bucket_outline" { export=icon }
declare module "lenz:icons/buffet" { export=icon }
declare module "lenz:icons/bug" { export=icon }
declare module "lenz:icons/bug_check" { export=icon }
declare module "lenz:icons/bug_check_outline" { export=icon }
declare module "lenz:icons/bug_outline" { export=icon }
declare module "lenz:icons/bug_pause" { export=icon }
declare module "lenz:icons/bug_pause_outline" { export=icon }
declare module "lenz:icons/bug_play" { export=icon }
declare module "lenz:icons/bug_play_outline" { export=icon }
declare module "lenz:icons/bug_stop" { export=icon }
declare module "lenz:icons/bug_stop_outline" { export=icon }
declare module "lenz:icons/bugle" { export=icon }
declare module "lenz:icons/bulkhead_light" { export=icon }
declare module "lenz:icons/bulldozer" { export=icon }
declare module "lenz:icons/bullet" { export=icon }
declare module "lenz:icons/bulletin_board" { export=icon }
declare module "lenz:icons/bullhorn" { export=icon }
declare module "lenz:icons/bullhorn_outline" { export=icon }
declare module "lenz:icons/bullhorn_variant" { export=icon }
declare module "lenz:icons/bullhorn_variant_outline" { export=icon }
declare module "lenz:icons/bullseye" { export=icon }
declare module "lenz:icons/bullseye_arrow" { export=icon }
declare module "lenz:icons/bulma" { export=icon }
declare module "lenz:icons/bunk_bed" { export=icon }
declare module "lenz:icons/bunk_bed_outline" { export=icon }
declare module "lenz:icons/bus" { export=icon }
declare module "lenz:icons/bus_alert" { export=icon }
declare module "lenz:icons/bus_articulated_end" { export=icon }
declare module "lenz:icons/bus_articulated_front" { export=icon }
declare module "lenz:icons/bus_clock" { export=icon }
declare module "lenz:icons/bus_double_decker" { export=icon }
declare module "lenz:icons/bus_electric" { export=icon }
declare module "lenz:icons/bus_marker" { export=icon }
declare module "lenz:icons/bus_multiple" { export=icon }
declare module "lenz:icons/bus_school" { export=icon }
declare module "lenz:icons/bus_side" { export=icon }
declare module "lenz:icons/bus_sign" { export=icon }
declare module "lenz:icons/bus_stop" { export=icon }
declare module "lenz:icons/bus_stop_covered" { export=icon }
declare module "lenz:icons/bus_stop_uncovered" { export=icon }
declare module "lenz:icons/bus_wrench" { export=icon }
declare module "lenz:icons/butterfly" { export=icon }
declare module "lenz:icons/butterfly_outline" { export=icon }
declare module "lenz:icons/button_cursor" { export=icon }
declare module "lenz:icons/button_pointer" { export=icon }
declare module "lenz:icons/cabin_aframe" { export=icon }
declare module "lenz:icons/cable_data" { export=icon }
declare module "lenz:icons/cached" { export=icon }
declare module "lenz:icons/cactus" { export=icon }
declare module "lenz:icons/cake" { export=icon }
declare module "lenz:icons/cake_layered" { export=icon }
declare module "lenz:icons/cake_variant" { export=icon }
declare module "lenz:icons/cake_variant_outline" { export=icon }
declare module "lenz:icons/calculator" { export=icon }
declare module "lenz:icons/calculator_variant" { export=icon }
declare module "lenz:icons/calculator_variant_outline" { export=icon }
declare module "lenz:icons/calendar" { export=icon }
declare module "lenz:icons/calendar_account" { export=icon }
declare module "lenz:icons/calendar_account_outline" { export=icon }
declare module "lenz:icons/calendar_alert" { export=icon }
declare module "lenz:icons/calendar_alert_outline" { export=icon }
declare module "lenz:icons/calendar_arrow_left" { export=icon }
declare module "lenz:icons/calendar_arrow_right" { export=icon }
declare module "lenz:icons/calendar_badge" { export=icon }
declare module "lenz:icons/calendar_badge_outline" { export=icon }
declare module "lenz:icons/calendar_blank" { export=icon }
declare module "lenz:icons/calendar_blank_multiple" { export=icon }
declare module "lenz:icons/calendar_blank_outline" { export=icon }
declare module "lenz:icons/calendar_check" { export=icon }
declare module "lenz:icons/calendar_check_outline" { export=icon }
declare module "lenz:icons/calendar_clock" { export=icon }
declare module "lenz:icons/calendar_clock_outline" { export=icon }
declare module "lenz:icons/calendar_collapse_horizontal" { export=icon }
declare module "lenz:icons/calendar_collapse_horizontal_outline" { export=icon }
declare module "lenz:icons/calendar_cursor" { export=icon }
declare module "lenz:icons/calendar_cursor_outline" { export=icon }
declare module "lenz:icons/calendar_edit" { export=icon }
declare module "lenz:icons/calendar_edit_outline" { export=icon }
declare module "lenz:icons/calendar_end" { export=icon }
declare module "lenz:icons/calendar_end_outline" { export=icon }
declare module "lenz:icons/calendar_expand_horizontal" { export=icon }
declare module "lenz:icons/calendar_expand_horizontal_outline" { export=icon }
declare module "lenz:icons/calendar_export" { export=icon }
declare module "lenz:icons/calendar_export_outline" { export=icon }
declare module "lenz:icons/calendar_filter" { export=icon }
declare module "lenz:icons/calendar_filter_outline" { export=icon }
declare module "lenz:icons/calendar_heart" { export=icon }
declare module "lenz:icons/calendar_heart_outline" { export=icon }
declare module "lenz:icons/calendar_import" { export=icon }
declare module "lenz:icons/calendar_import_outline" { export=icon }
declare module "lenz:icons/calendar_lock" { export=icon }
declare module "lenz:icons/calendar_lock_open" { export=icon }
declare module "lenz:icons/calendar_lock_open_outline" { export=icon }
declare module "lenz:icons/calendar_lock_outline" { export=icon }
declare module "lenz:icons/calendar_minus" { export=icon }
declare module "lenz:icons/calendar_minus_outline" { export=icon }
declare module "lenz:icons/calendar_month" { export=icon }
declare module "lenz:icons/calendar_month_outline" { export=icon }
declare module "lenz:icons/calendar_multiple" { export=icon }
declare module "lenz:icons/calendar_multiple_check" { export=icon }
declare module "lenz:icons/calendar_multiselect" { export=icon }
declare module "lenz:icons/calendar_multiselect_outline" { export=icon }
declare module "lenz:icons/calendar_outline" { export=icon }
declare module "lenz:icons/calendar_plus" { export=icon }
declare module "lenz:icons/calendar_plus_outline" { export=icon }
declare module "lenz:icons/calendar_question" { export=icon }
declare module "lenz:icons/calendar_question_outline" { export=icon }
declare module "lenz:icons/calendar_range" { export=icon }
declare module "lenz:icons/calendar_range_outline" { export=icon }
declare module "lenz:icons/calendar_refresh" { export=icon }
declare module "lenz:icons/calendar_refresh_outline" { export=icon }
declare module "lenz:icons/calendar_remove" { export=icon }
declare module "lenz:icons/calendar_remove_outline" { export=icon }
declare module "lenz:icons/calendar_search" { export=icon }
declare module "lenz:icons/calendar_search_outline" { export=icon }
declare module "lenz:icons/calendar_star" { export=icon }
declare module "lenz:icons/calendar_star_four_points" { export=icon }
declare module "lenz:icons/calendar_star_outline" { export=icon }
declare module "lenz:icons/calendar_start" { export=icon }
declare module "lenz:icons/calendar_start_outline" { export=icon }
declare module "lenz:icons/calendar_sync" { export=icon }
declare module "lenz:icons/calendar_sync_outline" { export=icon }
declare module "lenz:icons/calendar_text" { export=icon }
declare module "lenz:icons/calendar_text_outline" { export=icon }
declare module "lenz:icons/calendar_today" { export=icon }
declare module "lenz:icons/calendar_today_outline" { export=icon }
declare module "lenz:icons/calendar_week" { export=icon }
declare module "lenz:icons/calendar_week_begin" { export=icon }
declare module "lenz:icons/calendar_week_begin_outline" { export=icon }
declare module "lenz:icons/calendar_week_outline" { export=icon }
declare module "lenz:icons/calendar_weekend" { export=icon }
declare module "lenz:icons/calendar_weekend_outline" { export=icon }
declare module "lenz:icons/call_made" { export=icon }
declare module "lenz:icons/call_merge" { export=icon }
declare module "lenz:icons/call_missed" { export=icon }
declare module "lenz:icons/call_received" { export=icon }
declare module "lenz:icons/call_split" { export=icon }
declare module "lenz:icons/camcorder" { export=icon }
declare module "lenz:icons/camcorder_off" { export=icon }
declare module "lenz:icons/camera" { export=icon }
declare module "lenz:icons/camera_account" { export=icon }
declare module "lenz:icons/camera_burst" { export=icon }
declare module "lenz:icons/camera_control" { export=icon }
declare module "lenz:icons/camera_document" { export=icon }
declare module "lenz:icons/camera_document_off" { export=icon }
declare module "lenz:icons/camera_enhance" { export=icon }
declare module "lenz:icons/camera_enhance_outline" { export=icon }
declare module "lenz:icons/camera_flip" { export=icon }
declare module "lenz:icons/camera_flip_outline" { export=icon }
declare module "lenz:icons/camera_front" { export=icon }
declare module "lenz:icons/camera_front_variant" { export=icon }
declare module "lenz:icons/camera_gopro" { export=icon }
declare module "lenz:icons/camera_image" { export=icon }
declare module "lenz:icons/camera_iris" { export=icon }
declare module "lenz:icons/camera_lock" { export=icon }
declare module "lenz:icons/camera_lock_open" { export=icon }
declare module "lenz:icons/camera_lock_open_outline" { export=icon }
declare module "lenz:icons/camera_lock_outline" { export=icon }
declare module "lenz:icons/camera_marker" { export=icon }
declare module "lenz:icons/camera_marker_outline" { export=icon }
declare module "lenz:icons/camera_metering_center" { export=icon }
declare module "lenz:icons/camera_metering_matrix" { export=icon }
declare module "lenz:icons/camera_metering_partial" { export=icon }
declare module "lenz:icons/camera_metering_spot" { export=icon }
declare module "lenz:icons/camera_off" { export=icon }
declare module "lenz:icons/camera_off_outline" { export=icon }
declare module "lenz:icons/camera_outline" { export=icon }
declare module "lenz:icons/camera_party_mode" { export=icon }
declare module "lenz:icons/camera_plus" { export=icon }
declare module "lenz:icons/camera_plus_outline" { export=icon }
declare module "lenz:icons/camera_rear" { export=icon }
declare module "lenz:icons/camera_rear_variant" { export=icon }
declare module "lenz:icons/camera_retake" { export=icon }
declare module "lenz:icons/camera_retake_outline" { export=icon }
declare module "lenz:icons/camera_switch" { export=icon }
declare module "lenz:icons/camera_switch_outline" { export=icon }
declare module "lenz:icons/camera_timer" { export=icon }
declare module "lenz:icons/camera_wireless" { export=icon }
declare module "lenz:icons/camera_wireless_outline" { export=icon }
declare module "lenz:icons/campfire" { export=icon }
declare module "lenz:icons/cancel" { export=icon }
declare module "lenz:icons/candelabra" { export=icon }
declare module "lenz:icons/candelabra_fire" { export=icon }
declare module "lenz:icons/candle" { export=icon }
declare module "lenz:icons/candy" { export=icon }
declare module "lenz:icons/candy_off" { export=icon }
declare module "lenz:icons/candy_off_outline" { export=icon }
declare module "lenz:icons/candy_outline" { export=icon }
declare module "lenz:icons/candycane" { export=icon }
declare module "lenz:icons/cannabis" { export=icon }
declare module "lenz:icons/cannabis_off" { export=icon }
declare module "lenz:icons/caps_lock" { export=icon }
declare module "lenz:icons/car" { export=icon }
declare module "lenz:icons/car2plus" { export=icon }
declare module "lenz:icons/car3plus" { export=icon }
declare module "lenz:icons/car_arrow_left" { export=icon }
declare module "lenz:icons/car_arrow_right" { export=icon }
declare module "lenz:icons/car_back" { export=icon }
declare module "lenz:icons/car_battery" { export=icon }
declare module "lenz:icons/car_brake_abs" { export=icon }
declare module "lenz:icons/car_brake_alert" { export=icon }
declare module "lenz:icons/car_brake_fluid_level" { export=icon }
declare module "lenz:icons/car_brake_hold" { export=icon }
declare module "lenz:icons/car_brake_low_pressure" { export=icon }
declare module "lenz:icons/car_brake_parking" { export=icon }
declare module "lenz:icons/car_brake_retarder" { export=icon }
declare module "lenz:icons/car_brake_temperature" { export=icon }
declare module "lenz:icons/car_brake_worn_linings" { export=icon }
declare module "lenz:icons/car_child_seat" { export=icon }
declare module "lenz:icons/car_clock" { export=icon }
declare module "lenz:icons/car_clutch" { export=icon }
declare module "lenz:icons/car_cog" { export=icon }
declare module "lenz:icons/car_connected" { export=icon }
declare module "lenz:icons/car_convertible" { export=icon }
declare module "lenz:icons/car_coolant_level" { export=icon }
declare module "lenz:icons/car_cruise_control" { export=icon }
declare module "lenz:icons/car_defrost_front" { export=icon }
declare module "lenz:icons/car_defrost_rear" { export=icon }
declare module "lenz:icons/car_door" { export=icon }
declare module "lenz:icons/car_door_lock" { export=icon }
declare module "lenz:icons/car_door_lock_open" { export=icon }
declare module "lenz:icons/car_electric" { export=icon }
declare module "lenz:icons/car_electric_outline" { export=icon }
declare module "lenz:icons/car_emergency" { export=icon }
declare module "lenz:icons/car_esp" { export=icon }
declare module "lenz:icons/car_estate" { export=icon }
declare module "lenz:icons/car_hatchback" { export=icon }
declare module "lenz:icons/car_info" { export=icon }
declare module "lenz:icons/car_key" { export=icon }
declare module "lenz:icons/car_lifted_pickup" { export=icon }
declare module "lenz:icons/car_light_alert" { export=icon }
declare module "lenz:icons/car_light_dimmed" { export=icon }
declare module "lenz:icons/car_light_fog" { export=icon }
declare module "lenz:icons/car_light_high" { export=icon }
declare module "lenz:icons/car_limousine" { export=icon }
declare module "lenz:icons/car_multiple" { export=icon }
declare module "lenz:icons/car_off" { export=icon }
declare module "lenz:icons/car_outline" { export=icon }
declare module "lenz:icons/car_parking_lights" { export=icon }
declare module "lenz:icons/car_pickup" { export=icon }
declare module "lenz:icons/car_search" { export=icon }
declare module "lenz:icons/car_search_outline" { export=icon }
declare module "lenz:icons/car_seat" { export=icon }
declare module "lenz:icons/car_seat_cooler" { export=icon }
declare module "lenz:icons/car_seat_heater" { export=icon }
declare module "lenz:icons/car_select" { export=icon }
declare module "lenz:icons/car_settings" { export=icon }
declare module "lenz:icons/car_shift_pattern" { export=icon }
declare module "lenz:icons/car_side" { export=icon }
declare module "lenz:icons/car_speed_limiter" { export=icon }
declare module "lenz:icons/car_sports" { export=icon }
declare module "lenz:icons/car_tire_alert" { export=icon }
declare module "lenz:icons/car_traction_control" { export=icon }
declare module "lenz:icons/car_turbocharger" { export=icon }
declare module "lenz:icons/car_wash" { export=icon }
declare module "lenz:icons/car_windshield" { export=icon }
declare module "lenz:icons/car_windshield_outline" { export=icon }
declare module "lenz:icons/car_wireless" { export=icon }
declare module "lenz:icons/car_wrench" { export=icon }
declare module "lenz:icons/carabiner" { export=icon }
declare module "lenz:icons/caravan" { export=icon }
declare module "lenz:icons/card" { export=icon }
declare module "lenz:icons/card_account_details" { export=icon }
declare module "lenz:icons/card_account_details_outline" { export=icon }
declare module "lenz:icons/card_account_details_star" { export=icon }
declare module "lenz:icons/card_account_details_star_outline" { export=icon }
declare module "lenz:icons/card_account_mail" { export=icon }
declare module "lenz:icons/card_account_mail_outline" { export=icon }
declare module "lenz:icons/card_account_phone" { export=icon }
declare module "lenz:icons/card_account_phone_outline" { export=icon }
declare module "lenz:icons/card_bulleted" { export=icon }
declare module "lenz:icons/card_bulleted_off" { export=icon }
declare module "lenz:icons/card_bulleted_off_outline" { export=icon }
declare module "lenz:icons/card_bulleted_outline" { export=icon }
declare module "lenz:icons/card_bulleted_settings" { export=icon }
declare module "lenz:icons/card_bulleted_settings_outline" { export=icon }
declare module "lenz:icons/card_minus" { export=icon }
declare module "lenz:icons/card_minus_outline" { export=icon }
declare module "lenz:icons/card_multiple" { export=icon }
declare module "lenz:icons/card_multiple_outline" { export=icon }
declare module "lenz:icons/card_off" { export=icon }
declare module "lenz:icons/card_off_outline" { export=icon }
declare module "lenz:icons/card_outline" { export=icon }
declare module "lenz:icons/card_plus" { export=icon }
declare module "lenz:icons/card_plus_outline" { export=icon }
declare module "lenz:icons/card_remove" { export=icon }
declare module "lenz:icons/card_remove_outline" { export=icon }
declare module "lenz:icons/card_search" { export=icon }
declare module "lenz:icons/card_search_outline" { export=icon }
declare module "lenz:icons/card_text" { export=icon }
declare module "lenz:icons/card_text_outline" { export=icon }
declare module "lenz:icons/cards" { export=icon }
declare module "lenz:icons/cards_club" { export=icon }
declare module "lenz:icons/cards_club_outline" { export=icon }
declare module "lenz:icons/cards_diamond" { export=icon }
declare module "lenz:icons/cards_diamond_outline" { export=icon }
declare module "lenz:icons/cards_heart" { export=icon }
declare module "lenz:icons/cards_heart_outline" { export=icon }
declare module "lenz:icons/cards_outline" { export=icon }
declare module "lenz:icons/cards_playing" { export=icon }
declare module "lenz:icons/cards_playing_club" { export=icon }
declare module "lenz:icons/cards_playing_club_multiple" { export=icon }
declare module "lenz:icons/cards_playing_club_multiple_outline" { export=icon }
declare module "lenz:icons/cards_playing_club_outline" { export=icon }
declare module "lenz:icons/cards_playing_diamond" { export=icon }
declare module "lenz:icons/cards_playing_diamond_multiple" { export=icon }
declare module "lenz:icons/cards_playing_diamond_multiple_outline" { export=icon }
declare module "lenz:icons/cards_playing_diamond_outline" { export=icon }
declare module "lenz:icons/cards_playing_heart" { export=icon }
declare module "lenz:icons/cards_playing_heart_multiple" { export=icon }
declare module "lenz:icons/cards_playing_heart_multiple_outline" { export=icon }
declare module "lenz:icons/cards_playing_heart_outline" { export=icon }
declare module "lenz:icons/cards_playing_outline" { export=icon }
declare module "lenz:icons/cards_playing_spade" { export=icon }
declare module "lenz:icons/cards_playing_spade_multiple" { export=icon }
declare module "lenz:icons/cards_playing_spade_multiple_outline" { export=icon }
declare module "lenz:icons/cards_playing_spade_outline" { export=icon }
declare module "lenz:icons/cards_spade" { export=icon }
declare module "lenz:icons/cards_spade_outline" { export=icon }
declare module "lenz:icons/cards_variant" { export=icon }
declare module "lenz:icons/carrot" { export=icon }
declare module "lenz:icons/cart" { export=icon }
declare module "lenz:icons/cart_arrow_down" { export=icon }
declare module "lenz:icons/cart_arrow_right" { export=icon }
declare module "lenz:icons/cart_arrow_up" { export=icon }
declare module "lenz:icons/cart_check" { export=icon }
declare module "lenz:icons/cart_heart" { export=icon }
declare module "lenz:icons/cart_minus" { export=icon }
declare module "lenz:icons/cart_off" { export=icon }
declare module "lenz:icons/cart_outline" { export=icon }
declare module "lenz:icons/cart_percent" { export=icon }
declare module "lenz:icons/cart_plus" { export=icon }
declare module "lenz:icons/cart_remove" { export=icon }
declare module "lenz:icons/cart_variant" { export=icon }
declare module "lenz:icons/case_sensitive_alt" { export=icon }
declare module "lenz:icons/cash" { export=icon }
declare module "lenz:icons/cash100" { export=icon }
declare module "lenz:icons/cash_check" { export=icon }
declare module "lenz:icons/cash_clock" { export=icon }
declare module "lenz:icons/cash_edit" { export=icon }
declare module "lenz:icons/cash_fast" { export=icon }
declare module "lenz:icons/cash_lock" { export=icon }
declare module "lenz:icons/cash_lock_open" { export=icon }
declare module "lenz:icons/cash_marker" { export=icon }
declare module "lenz:icons/cash_minus" { export=icon }
declare module "lenz:icons/cash_multiple" { export=icon }
declare module "lenz:icons/cash_off" { export=icon }
declare module "lenz:icons/cash_plus" { export=icon }
declare module "lenz:icons/cash_refund" { export=icon }
declare module "lenz:icons/cash_register" { export=icon }
declare module "lenz:icons/cash_remove" { export=icon }
declare module "lenz:icons/cash_sync" { export=icon }
declare module "lenz:icons/cassette" { export=icon }
declare module "lenz:icons/cast" { export=icon }
declare module "lenz:icons/cast_audio" { export=icon }
declare module "lenz:icons/cast_audio_variant" { export=icon }
declare module "lenz:icons/cast_connected" { export=icon }
declare module "lenz:icons/cast_education" { export=icon }
declare module "lenz:icons/cast_off" { export=icon }
declare module "lenz:icons/cast_variant" { export=icon }
declare module "lenz:icons/castle" { export=icon }
declare module "lenz:icons/cat" { export=icon }
declare module "lenz:icons/cctv" { export=icon }
declare module "lenz:icons/cctv_off" { export=icon }
declare module "lenz:icons/ceiling_fan" { export=icon }
declare module "lenz:icons/ceiling_fan_light" { export=icon }
declare module "lenz:icons/ceiling_light" { export=icon }
declare module "lenz:icons/ceiling_light_multiple" { export=icon }
declare module "lenz:icons/ceiling_light_multiple_outline" { export=icon }
declare module "lenz:icons/ceiling_light_outline" { export=icon }
declare module "lenz:icons/cellphone" { export=icon }
declare module "lenz:icons/cellphone_arrow_down" { export=icon }
declare module "lenz:icons/cellphone_arrow_down_variant" { export=icon }
declare module "lenz:icons/cellphone_basic" { export=icon }
declare module "lenz:icons/cellphone_charging" { export=icon }
declare module "lenz:icons/cellphone_check" { export=icon }
declare module "lenz:icons/cellphone_cog" { export=icon }
declare module "lenz:icons/cellphone_dock" { export=icon }
declare module "lenz:icons/cellphone_information" { export=icon }
declare module "lenz:icons/cellphone_key" { export=icon }
declare module "lenz:icons/cellphone_link" { export=icon }
declare module "lenz:icons/cellphone_link_off" { export=icon }
declare module "lenz:icons/cellphone_lock" { export=icon }
declare module "lenz:icons/cellphone_marker" { export=icon }
declare module "lenz:icons/cellphone_message" { export=icon }
declare module "lenz:icons/cellphone_message_off" { export=icon }
declare module "lenz:icons/cellphone_nfc" { export=icon }
declare module "lenz:icons/cellphone_nfc_off" { export=icon }
declare module "lenz:icons/cellphone_off" { export=icon }
declare module "lenz:icons/cellphone_play" { export=icon }
declare module "lenz:icons/cellphone_remove" { export=icon }
declare module "lenz:icons/cellphone_screenshot" { export=icon }
declare module "lenz:icons/cellphone_settings" { export=icon }
declare module "lenz:icons/cellphone_sound" { export=icon }
declare module "lenz:icons/cellphone_text" { export=icon }
declare module "lenz:icons/cellphone_wireless" { export=icon }
declare module "lenz:icons/centos" { export=icon }
declare module "lenz:icons/certificate" { export=icon }
declare module "lenz:icons/certificate_outline" { export=icon }
declare module "lenz:icons/chair_rolling" { export=icon }
declare module "lenz:icons/chair_school" { export=icon }
declare module "lenz:icons/chandelier" { export=icon }
declare module "lenz:icons/charity" { export=icon }
declare module "lenz:icons/charity_search" { export=icon }
declare module "lenz:icons/chart_arc" { export=icon }
declare module "lenz:icons/chart_areaspline" { export=icon }
declare module "lenz:icons/chart_areaspline_variant" { export=icon }
declare module "lenz:icons/chart_bar" { export=icon }
declare module "lenz:icons/chart_bar_stacked" { export=icon }
declare module "lenz:icons/chart_bell_curve" { export=icon }
declare module "lenz:icons/chart_bell_curve_cumulative" { export=icon }
declare module "lenz:icons/chart_box" { export=icon }
declare module "lenz:icons/chart_box_multiple" { export=icon }
declare module "lenz:icons/chart_box_multiple_outline" { export=icon }
declare module "lenz:icons/chart_box_outline" { export=icon }
declare module "lenz:icons/chart_box_plus_outline" { export=icon }
declare module "lenz:icons/chart_bubble" { export=icon }
declare module "lenz:icons/chart_donut" { export=icon }
declare module "lenz:icons/chart_donut_variant" { export=icon }
declare module "lenz:icons/chart_gantt" { export=icon }
declare module "lenz:icons/chart_histogram" { export=icon }
declare module "lenz:icons/chart_line" { export=icon }
declare module "lenz:icons/chart_line_stacked" { export=icon }
declare module "lenz:icons/chart_line_variant" { export=icon }
declare module "lenz:icons/chart_multiline" { export=icon }
declare module "lenz:icons/chart_multiple" { export=icon }
declare module "lenz:icons/chart_pie" { export=icon }
declare module "lenz:icons/chart_pie_outline" { export=icon }
declare module "lenz:icons/chart_ppf" { export=icon }
declare module "lenz:icons/chart_sankey" { export=icon }
declare module "lenz:icons/chart_sankey_variant" { export=icon }
declare module "lenz:icons/chart_scatter_plot" { export=icon }
declare module "lenz:icons/chart_scatter_plot_hexbin" { export=icon }
declare module "lenz:icons/chart_timeline" { export=icon }
declare module "lenz:icons/chart_timeline_variant" { export=icon }
declare module "lenz:icons/chart_timeline_variant_shimmer" { export=icon }
declare module "lenz:icons/chart_tree" { export=icon }
declare module "lenz:icons/chart_waterfall" { export=icon }
declare module "lenz:icons/chat" { export=icon }
declare module "lenz:icons/chat_alert" { export=icon }
declare module "lenz:icons/chat_alert_outline" { export=icon }
declare module "lenz:icons/chat_minus" { export=icon }
declare module "lenz:icons/chat_minus_outline" { export=icon }
declare module "lenz:icons/chat_outline" { export=icon }
declare module "lenz:icons/chat_plus" { export=icon }
declare module "lenz:icons/chat_plus_outline" { export=icon }
declare module "lenz:icons/chat_processing" { export=icon }
declare module "lenz:icons/chat_processing_outline" { export=icon }
declare module "lenz:icons/chat_question" { export=icon }
declare module "lenz:icons/chat_question_outline" { export=icon }
declare module "lenz:icons/chat_remove" { export=icon }
declare module "lenz:icons/chat_remove_outline" { export=icon }
declare module "lenz:icons/chat_sleep" { export=icon }
declare module "lenz:icons/chat_sleep_outline" { export=icon }
declare module "lenz:icons/check" { export=icon }
declare module "lenz:icons/check_all" { export=icon }
declare module "lenz:icons/check_bold" { export=icon }
declare module "lenz:icons/check_circle" { export=icon }
declare module "lenz:icons/check_circle_outline" { export=icon }
declare module "lenz:icons/check_decagram" { export=icon }
declare module "lenz:icons/check_decagram_outline" { export=icon }
declare module "lenz:icons/check_network" { export=icon }
declare module "lenz:icons/check_network_outline" { export=icon }
declare module "lenz:icons/check_outline" { export=icon }
declare module "lenz:icons/check_underline" { export=icon }
declare module "lenz:icons/check_underline_circle" { export=icon }
declare module "lenz:icons/check_underline_circle_outline" { export=icon }
declare module "lenz:icons/checkbook" { export=icon }
declare module "lenz:icons/checkbook_arrow_left" { export=icon }
declare module "lenz:icons/checkbook_arrow_right" { export=icon }
declare module "lenz:icons/checkbox_blank" { export=icon }
declare module "lenz:icons/checkbox_blank_badge" { export=icon }
declare module "lenz:icons/checkbox_blank_badge_outline" { export=icon }
declare module "lenz:icons/checkbox_blank_circle" { export=icon }
declare module "lenz:icons/checkbox_blank_circle_outline" { export=icon }
declare module "lenz:icons/checkbox_blank_off" { export=icon }
declare module "lenz:icons/checkbox_blank_off_outline" { export=icon }
declare module "lenz:icons/checkbox_blank_outline" { export=icon }
declare module "lenz:icons/checkbox_intermediate" { export=icon }
declare module "lenz:icons/checkbox_intermediate_variant" { export=icon }
declare module "lenz:icons/checkbox_marked" { export=icon }
declare module "lenz:icons/checkbox_marked_circle" { export=icon }
declare module "lenz:icons/checkbox_marked_circle_auto_outline" { export=icon }
declare module "lenz:icons/checkbox_marked_circle_minus_outline" { export=icon }
declare module "lenz:icons/checkbox_marked_circle_outline" { export=icon }
declare module "lenz:icons/checkbox_marked_circle_plus_outline" { export=icon }
declare module "lenz:icons/checkbox_marked_outline" { export=icon }
declare module "lenz:icons/checkbox_multiple_blank" { export=icon }
declare module "lenz:icons/checkbox_multiple_blank_circle" { export=icon }
declare module "lenz:icons/checkbox_multiple_blank_circle_outline" { export=icon }
declare module "lenz:icons/checkbox_multiple_blank_outline" { export=icon }
declare module "lenz:icons/checkbox_multiple_marked" { export=icon }
declare module "lenz:icons/checkbox_multiple_marked_circle" { export=icon }
declare module "lenz:icons/checkbox_multiple_marked_circle_outline" { export=icon }
declare module "lenz:icons/checkbox_multiple_marked_outline" { export=icon }
declare module "lenz:icons/checkbox_multiple_outline" { export=icon }
declare module "lenz:icons/checkbox_outline" { export=icon }
declare module "lenz:icons/checkerboard" { export=icon }
declare module "lenz:icons/checkerboard_minus" { export=icon }
declare module "lenz:icons/checkerboard_plus" { export=icon }
declare module "lenz:icons/checkerboard_remove" { export=icon }
declare module "lenz:icons/cheese" { export=icon }
declare module "lenz:icons/cheese_off" { export=icon }
declare module "lenz:icons/chef_hat" { export=icon }
declare module "lenz:icons/chemical_weapon" { export=icon }
declare module "lenz:icons/chess_bishop" { export=icon }
declare module "lenz:icons/chess_king" { export=icon }
declare module "lenz:icons/chess_knight" { export=icon }
declare module "lenz:icons/chess_pawn" { export=icon }
declare module "lenz:icons/chess_queen" { export=icon }
declare module "lenz:icons/chess_rook" { export=icon }
declare module "lenz:icons/chevron_double_down" { export=icon }
declare module "lenz:icons/chevron_double_left" { export=icon }
declare module "lenz:icons/chevron_double_right" { export=icon }
declare module "lenz:icons/chevron_double_up" { export=icon }
declare module "lenz:icons/chevron_down" { export=icon }
declare module "lenz:icons/chevron_down_box" { export=icon }
declare module "lenz:icons/chevron_down_box_outline" { export=icon }
declare module "lenz:icons/chevron_down_circle" { export=icon }
declare module "lenz:icons/chevron_down_circle_outline" { export=icon }
declare module "lenz:icons/chevron_left" { export=icon }
declare module "lenz:icons/chevron_left_box" { export=icon }
declare module "lenz:icons/chevron_left_box_outline" { export=icon }
declare module "lenz:icons/chevron_left_circle" { export=icon }
declare module "lenz:icons/chevron_left_circle_outline" { export=icon }
declare module "lenz:icons/chevron_right" { export=icon }
declare module "lenz:icons/chevron_right_box" { export=icon }
declare module "lenz:icons/chevron_right_box_outline" { export=icon }
declare module "lenz:icons/chevron_right_circle" { export=icon }
declare module "lenz:icons/chevron_right_circle_outline" { export=icon }
declare module "lenz:icons/chevron_triple_down" { export=icon }
declare module "lenz:icons/chevron_triple_left" { export=icon }
declare module "lenz:icons/chevron_triple_right" { export=icon }
declare module "lenz:icons/chevron_triple_up" { export=icon }
declare module "lenz:icons/chevron_up" { export=icon }
declare module "lenz:icons/chevron_up_box" { export=icon }
declare module "lenz:icons/chevron_up_box_outline" { export=icon }
declare module "lenz:icons/chevron_up_circle" { export=icon }
declare module "lenz:icons/chevron_up_circle_outline" { export=icon }
declare module "lenz:icons/chili_alert" { export=icon }
declare module "lenz:icons/chili_alert_outline" { export=icon }
declare module "lenz:icons/chili_hot" { export=icon }
declare module "lenz:icons/chili_hot_outline" { export=icon }
declare module "lenz:icons/chili_medium" { export=icon }
declare module "lenz:icons/chili_medium_outline" { export=icon }
declare module "lenz:icons/chili_mild" { export=icon }
declare module "lenz:icons/chili_mild_outline" { export=icon }
declare module "lenz:icons/chili_off" { export=icon }
declare module "lenz:icons/chili_off_outline" { export=icon }
declare module "lenz:icons/chip" { export=icon }
declare module "lenz:icons/church" { export=icon }
declare module "lenz:icons/church_outline" { export=icon }
declare module "lenz:icons/cigar" { export=icon }
declare module "lenz:icons/cigar_off" { export=icon }
declare module "lenz:icons/circle" { export=icon }
declare module "lenz:icons/circle_box" { export=icon }
declare module "lenz:icons/circle_box_outline" { export=icon }
declare module "lenz:icons/circle_double" { export=icon }
declare module "lenz:icons/circle_edit_outline" { export=icon }
declare module "lenz:icons/circle_expand" { export=icon }
declare module "lenz:icons/circle_half" { export=icon }
declare module "lenz:icons/circle_half_full" { export=icon }
declare module "lenz:icons/circle_medium" { export=icon }
declare module "lenz:icons/circle_multiple" { export=icon }
declare module "lenz:icons/circle_multiple_outline" { export=icon }
declare module "lenz:icons/circle_off_outline" { export=icon }
declare module "lenz:icons/circle_opacity" { export=icon }
declare module "lenz:icons/circle_outline" { export=icon }
declare module "lenz:icons/circle_slice1" { export=icon }
declare module "lenz:icons/circle_slice2" { export=icon }
declare module "lenz:icons/circle_slice3" { export=icon }
declare module "lenz:icons/circle_slice4" { export=icon }
declare module "lenz:icons/circle_slice5" { export=icon }
declare module "lenz:icons/circle_slice6" { export=icon }
declare module "lenz:icons/circle_slice7" { export=icon }
declare module "lenz:icons/circle_slice8" { export=icon }
declare module "lenz:icons/circle_small" { export=icon }
declare module "lenz:icons/circular_saw" { export=icon }
declare module "lenz:icons/city" { export=icon }
declare module "lenz:icons/city_switch" { export=icon }
declare module "lenz:icons/city_variant" { export=icon }
declare module "lenz:icons/city_variant_outline" { export=icon }
declare module "lenz:icons/clipboard" { export=icon }
declare module "lenz:icons/clipboard_account" { export=icon }
declare module "lenz:icons/clipboard_account_outline" { export=icon }
declare module "lenz:icons/clipboard_alert" { export=icon }
declare module "lenz:icons/clipboard_alert_outline" { export=icon }
declare module "lenz:icons/clipboard_arrow_down" { export=icon }
declare module "lenz:icons/clipboard_arrow_down_outline" { export=icon }
declare module "lenz:icons/clipboard_arrow_left" { export=icon }
declare module "lenz:icons/clipboard_arrow_left_outline" { export=icon }
declare module "lenz:icons/clipboard_arrow_right" { export=icon }
declare module "lenz:icons/clipboard_arrow_right_outline" { export=icon }
declare module "lenz:icons/clipboard_arrow_up" { export=icon }
declare module "lenz:icons/clipboard_arrow_up_outline" { export=icon }
declare module "lenz:icons/clipboard_check" { export=icon }
declare module "lenz:icons/clipboard_check_multiple" { export=icon }
declare module "lenz:icons/clipboard_check_multiple_outline" { export=icon }
declare module "lenz:icons/clipboard_check_outline" { export=icon }
declare module "lenz:icons/clipboard_clock" { export=icon }
declare module "lenz:icons/clipboard_clock_outline" { export=icon }
declare module "lenz:icons/clipboard_edit" { export=icon }
declare module "lenz:icons/clipboard_edit_outline" { export=icon }
declare module "lenz:icons/clipboard_file" { export=icon }
declare module "lenz:icons/clipboard_file_outline" { export=icon }
declare module "lenz:icons/clipboard_flow" { export=icon }
declare module "lenz:icons/clipboard_flow_outline" { export=icon }
declare module "lenz:icons/clipboard_list" { export=icon }
declare module "lenz:icons/clipboard_list_outline" { export=icon }
declare module "lenz:icons/clipboard_minus" { export=icon }
declare module "lenz:icons/clipboard_minus_outline" { export=icon }
declare module "lenz:icons/clipboard_multiple" { export=icon }
declare module "lenz:icons/clipboard_multiple_outline" { export=icon }
declare module "lenz:icons/clipboard_off" { export=icon }
declare module "lenz:icons/clipboard_off_outline" { export=icon }
declare module "lenz:icons/clipboard_outline" { export=icon }
declare module "lenz:icons/clipboard_play" { export=icon }
declare module "lenz:icons/clipboard_play_multiple" { export=icon }
declare module "lenz:icons/clipboard_play_multiple_outline" { export=icon }
declare module "lenz:icons/clipboard_play_outline" { export=icon }
declare module "lenz:icons/clipboard_plus" { export=icon }
declare module "lenz:icons/clipboard_plus_outline" { export=icon }
declare module "lenz:icons/clipboard_pulse" { export=icon }
declare module "lenz:icons/clipboard_pulse_outline" { export=icon }
declare module "lenz:icons/clipboard_remove" { export=icon }
declare module "lenz:icons/clipboard_remove_outline" { export=icon }
declare module "lenz:icons/clipboard_search" { export=icon }
declare module "lenz:icons/clipboard_search_outline" { export=icon }
declare module "lenz:icons/clipboard_text" { export=icon }
declare module "lenz:icons/clipboard_text_clock" { export=icon }
declare module "lenz:icons/clipboard_text_clock_outline" { export=icon }
declare module "lenz:icons/clipboard_text_multiple" { export=icon }
declare module "lenz:icons/clipboard_text_multiple_outline" { export=icon }
declare module "lenz:icons/clipboard_text_off" { export=icon }
declare module "lenz:icons/clipboard_text_off_outline" { export=icon }
declare module "lenz:icons/clipboard_text_outline" { export=icon }
declare module "lenz:icons/clipboard_text_play" { export=icon }
declare module "lenz:icons/clipboard_text_play_outline" { export=icon }
declare module "lenz:icons/clipboard_text_search" { export=icon }
declare module "lenz:icons/clipboard_text_search_outline" { export=icon }
declare module "lenz:icons/clippy" { export=icon }
declare module "lenz:icons/clock" { export=icon }
declare module "lenz:icons/clock_alert" { export=icon }
declare module "lenz:icons/clock_alert_outline" { export=icon }
declare module "lenz:icons/clock_check" { export=icon }
declare module "lenz:icons/clock_check_outline" { export=icon }
declare module "lenz:icons/clock_digital" { export=icon }
declare module "lenz:icons/clock_edit" { export=icon }
declare module "lenz:icons/clock_edit_outline" { export=icon }
declare module "lenz:icons/clock_end" { export=icon }
declare module "lenz:icons/clock_fast" { export=icon }
declare module "lenz:icons/clock_in" { export=icon }
declare module "lenz:icons/clock_minus" { export=icon }
declare module "lenz:icons/clock_minus_outline" { export=icon }
declare module "lenz:icons/clock_out" { export=icon }
declare module "lenz:icons/clock_outline" { export=icon }
declare module "lenz:icons/clock_plus" { export=icon }
declare module "lenz:icons/clock_plus_outline" { export=icon }
declare module "lenz:icons/clock_remove" { export=icon }
declare module "lenz:icons/clock_remove_outline" { export=icon }
declare module "lenz:icons/clock_star_four_points" { export=icon }
declare module "lenz:icons/clock_star_four_points_outline" { export=icon }
declare module "lenz:icons/clock_start" { export=icon }
declare module "lenz:icons/clock_time_eight" { export=icon }
declare module "lenz:icons/clock_time_eight_outline" { export=icon }
declare module "lenz:icons/clock_time_eleven" { export=icon }
declare module "lenz:icons/clock_time_eleven_outline" { export=icon }
declare module "lenz:icons/clock_time_five" { export=icon }
declare module "lenz:icons/clock_time_five_outline" { export=icon }
declare module "lenz:icons/clock_time_four" { export=icon }
declare module "lenz:icons/clock_time_four_outline" { export=icon }
declare module "lenz:icons/clock_time_nine" { export=icon }
declare module "lenz:icons/clock_time_nine_outline" { export=icon }
declare module "lenz:icons/clock_time_one" { export=icon }
declare module "lenz:icons/clock_time_one_outline" { export=icon }
declare module "lenz:icons/clock_time_seven" { export=icon }
declare module "lenz:icons/clock_time_seven_outline" { export=icon }
declare module "lenz:icons/clock_time_six" { export=icon }
declare module "lenz:icons/clock_time_six_outline" { export=icon }
declare module "lenz:icons/clock_time_ten" { export=icon }
declare module "lenz:icons/clock_time_ten_outline" { export=icon }
declare module "lenz:icons/clock_time_three" { export=icon }
declare module "lenz:icons/clock_time_three_outline" { export=icon }
declare module "lenz:icons/clock_time_twelve" { export=icon }
declare module "lenz:icons/clock_time_twelve_outline" { export=icon }
declare module "lenz:icons/clock_time_two" { export=icon }
declare module "lenz:icons/clock_time_two_outline" { export=icon }
declare module "lenz:icons/close" { export=icon }
declare module "lenz:icons/close_box" { export=icon }
declare module "lenz:icons/close_box_multiple" { export=icon }
declare module "lenz:icons/close_box_multiple_outline" { export=icon }
declare module "lenz:icons/close_box_outline" { export=icon }
declare module "lenz:icons/close_circle" { export=icon }
declare module "lenz:icons/close_circle_multiple" { export=icon }
declare module "lenz:icons/close_circle_multiple_outline" { export=icon }
declare module "lenz:icons/close_circle_outline" { export=icon }
declare module "lenz:icons/close_network" { export=icon }
declare module "lenz:icons/close_network_outline" { export=icon }
declare module "lenz:icons/close_octagon" { export=icon }
declare module "lenz:icons/close_octagon_outline" { export=icon }
declare module "lenz:icons/close_outline" { export=icon }
declare module "lenz:icons/close_thick" { export=icon }
declare module "lenz:icons/closed_caption" { export=icon }
declare module "lenz:icons/closed_caption_outline" { export=icon }
declare module "lenz:icons/cloud" { export=icon }
declare module "lenz:icons/cloud_alert" { export=icon }
declare module "lenz:icons/cloud_alert_outline" { export=icon }
declare module "lenz:icons/cloud_arrow_down" { export=icon }
declare module "lenz:icons/cloud_arrow_down_outline" { export=icon }
declare module "lenz:icons/cloud_arrow_left" { export=icon }
declare module "lenz:icons/cloud_arrow_left_outline" { export=icon }
declare module "lenz:icons/cloud_arrow_right" { export=icon }
declare module "lenz:icons/cloud_arrow_right_outline" { export=icon }
declare module "lenz:icons/cloud_arrow_up" { export=icon }
declare module "lenz:icons/cloud_arrow_up_outline" { export=icon }
declare module "lenz:icons/cloud_braces" { export=icon }
declare module "lenz:icons/cloud_cancel" { export=icon }
declare module "lenz:icons/cloud_cancel_outline" { export=icon }
declare module "lenz:icons/cloud_check" { export=icon }
declare module "lenz:icons/cloud_check_outline" { export=icon }
declare module "lenz:icons/cloud_check_variant" { export=icon }
declare module "lenz:icons/cloud_check_variant_outline" { export=icon }
declare module "lenz:icons/cloud_circle" { export=icon }
declare module "lenz:icons/cloud_circle_outline" { export=icon }
declare module "lenz:icons/cloud_clock" { export=icon }
declare module "lenz:icons/cloud_clock_outline" { export=icon }
declare module "lenz:icons/cloud_cog" { export=icon }
declare module "lenz:icons/cloud_cog_outline" { export=icon }
declare module "lenz:icons/cloud_download" { export=icon }
declare module "lenz:icons/cloud_download_outline" { export=icon }
declare module "lenz:icons/cloud_key" { export=icon }
declare module "lenz:icons/cloud_key_outline" { export=icon }
declare module "lenz:icons/cloud_lock" { export=icon }
declare module "lenz:icons/cloud_lock_open" { export=icon }
declare module "lenz:icons/cloud_lock_open_outline" { export=icon }
declare module "lenz:icons/cloud_lock_outline" { export=icon }
declare module "lenz:icons/cloud_minus" { export=icon }
declare module "lenz:icons/cloud_minus_outline" { export=icon }
declare module "lenz:icons/cloud_off" { export=icon }
declare module "lenz:icons/cloud_off_outline" { export=icon }
declare module "lenz:icons/cloud_outline" { export=icon }
declare module "lenz:icons/cloud_percent" { export=icon }
declare module "lenz:icons/cloud_percent_outline" { export=icon }
declare module "lenz:icons/cloud_plus" { export=icon }
declare module "lenz:icons/cloud_plus_outline" { export=icon }
declare module "lenz:icons/cloud_print" { export=icon }
declare module "lenz:icons/cloud_print_outline" { export=icon }
declare module "lenz:icons/cloud_question" { export=icon }
declare module "lenz:icons/cloud_question_outline" { export=icon }
declare module "lenz:icons/cloud_refresh" { export=icon }
declare module "lenz:icons/cloud_refresh_outline" { export=icon }
declare module "lenz:icons/cloud_refresh_variant" { export=icon }
declare module "lenz:icons/cloud_refresh_variant_outline" { export=icon }
declare module "lenz:icons/cloud_remove" { export=icon }
declare module "lenz:icons/cloud_remove_outline" { export=icon }
declare module "lenz:icons/cloud_search" { export=icon }
declare module "lenz:icons/cloud_search_outline" { export=icon }
declare module "lenz:icons/cloud_sync" { export=icon }
declare module "lenz:icons/cloud_sync_outline" { export=icon }
declare module "lenz:icons/cloud_tags" { export=icon }
declare module "lenz:icons/cloud_upload" { export=icon }
declare module "lenz:icons/cloud_upload_outline" { export=icon }
declare module "lenz:icons/clouds" { export=icon }
declare module "lenz:icons/clover" { export=icon }
declare module "lenz:icons/clover_outline" { export=icon }
declare module "lenz:icons/coach_lamp" { export=icon }
declare module "lenz:icons/coach_lamp_variant" { export=icon }
declare module "lenz:icons/coat_rack" { export=icon }
declare module "lenz:icons/code_array" { export=icon }
declare module "lenz:icons/code_block_braces" { export=icon }
declare module "lenz:icons/code_block_brackets" { export=icon }
declare module "lenz:icons/code_block_parentheses" { export=icon }
declare module "lenz:icons/code_block_tags" { export=icon }
declare module "lenz:icons/code_braces" { export=icon }
declare module "lenz:icons/code_braces_box" { export=icon }
declare module "lenz:icons/code_brackets" { export=icon }
declare module "lenz:icons/code_equal" { export=icon }
declare module "lenz:icons/code_greater_than" { export=icon }
declare module "lenz:icons/code_greater_than_or_equal" { export=icon }
declare module "lenz:icons/code_json" { export=icon }
declare module "lenz:icons/code_less_than" { export=icon }
declare module "lenz:icons/code_less_than_or_equal" { export=icon }
declare module "lenz:icons/code_not_equal" { export=icon }
declare module "lenz:icons/code_not_equal_variant" { export=icon }
declare module "lenz:icons/code_parentheses" { export=icon }
declare module "lenz:icons/code_parentheses_box" { export=icon }
declare module "lenz:icons/code_string" { export=icon }
declare module "lenz:icons/code_tags" { export=icon }
declare module "lenz:icons/code_tags_check" { export=icon }
declare module "lenz:icons/codepen" { export=icon }
declare module "lenz:icons/coffee" { export=icon }
declare module "lenz:icons/coffee_maker" { export=icon }
declare module "lenz:icons/coffee_maker_check" { export=icon }
declare module "lenz:icons/coffee_maker_check_outline" { export=icon }
declare module "lenz:icons/coffee_maker_outline" { export=icon }
declare module "lenz:icons/coffee_off" { export=icon }
declare module "lenz:icons/coffee_off_outline" { export=icon }
declare module "lenz:icons/coffee_outline" { export=icon }
declare module "lenz:icons/coffee_to_go" { export=icon }
declare module "lenz:icons/coffee_to_go_outline" { export=icon }
declare module "lenz:icons/coffin" { export=icon }
declare module "lenz:icons/cog" { export=icon }
declare module "lenz:icons/cog_box" { export=icon }
declare module "lenz:icons/cog_clockwise" { export=icon }
declare module "lenz:icons/cog_counterclockwise" { export=icon }
declare module "lenz:icons/cog_off" { export=icon }
declare module "lenz:icons/cog_off_outline" { export=icon }
declare module "lenz:icons/cog_outline" { export=icon }
declare module "lenz:icons/cog_pause" { export=icon }
declare module "lenz:icons/cog_pause_outline" { export=icon }
declare module "lenz:icons/cog_play" { export=icon }
declare module "lenz:icons/cog_play_outline" { export=icon }
declare module "lenz:icons/cog_refresh" { export=icon }
declare module "lenz:icons/cog_refresh_outline" { export=icon }
declare module "lenz:icons/cog_stop" { export=icon }
declare module "lenz:icons/cog_stop_outline" { export=icon }
declare module "lenz:icons/cog_sync" { export=icon }
declare module "lenz:icons/cog_sync_outline" { export=icon }
declare module "lenz:icons/cog_transfer" { export=icon }
declare module "lenz:icons/cog_transfer_outline" { export=icon }
declare module "lenz:icons/cogs" { export=icon }
declare module "lenz:icons/collage" { export=icon }
declare module "lenz:icons/collapse_all" { export=icon }
declare module "lenz:icons/collapse_all_outline" { export=icon }
declare module "lenz:icons/color_helper" { export=icon }
declare module "lenz:icons/comma" { export=icon }
declare module "lenz:icons/comma_box" { export=icon }
declare module "lenz:icons/comma_box_outline" { export=icon }
declare module "lenz:icons/comma_circle" { export=icon }
declare module "lenz:icons/comma_circle_outline" { export=icon }
declare module "lenz:icons/comment" { export=icon }
declare module "lenz:icons/comment_account" { export=icon }
declare module "lenz:icons/comment_account_outline" { export=icon }
declare module "lenz:icons/comment_alert" { export=icon }
declare module "lenz:icons/comment_alert_outline" { export=icon }
declare module "lenz:icons/comment_arrow_left" { export=icon }
declare module "lenz:icons/comment_arrow_left_outline" { export=icon }
declare module "lenz:icons/comment_arrow_right" { export=icon }
declare module "lenz:icons/comment_arrow_right_outline" { export=icon }
declare module "lenz:icons/comment_bookmark" { export=icon }
declare module "lenz:icons/comment_bookmark_outline" { export=icon }
declare module "lenz:icons/comment_check" { export=icon }
declare module "lenz:icons/comment_check_outline" { export=icon }
declare module "lenz:icons/comment_edit" { export=icon }
declare module "lenz:icons/comment_edit_outline" { export=icon }
declare module "lenz:icons/comment_eye" { export=icon }
declare module "lenz:icons/comment_eye_outline" { export=icon }
declare module "lenz:icons/comment_flash" { export=icon }
declare module "lenz:icons/comment_flash_outline" { export=icon }
declare module "lenz:icons/comment_minus" { export=icon }
declare module "lenz:icons/comment_minus_outline" { export=icon }
declare module "lenz:icons/comment_multiple" { export=icon }
declare module "lenz:icons/comment_multiple_outline" { export=icon }
declare module "lenz:icons/comment_off" { export=icon }
declare module "lenz:icons/comment_off_outline" { export=icon }
declare module "lenz:icons/comment_outline" { export=icon }
declare module "lenz:icons/comment_plus" { export=icon }
declare module "lenz:icons/comment_plus_outline" { export=icon }
declare module "lenz:icons/comment_processing" { export=icon }
declare module "lenz:icons/comment_processing_outline" { export=icon }
declare module "lenz:icons/comment_question" { export=icon }
declare module "lenz:icons/comment_question_outline" { export=icon }
declare module "lenz:icons/comment_quote" { export=icon }
declare module "lenz:icons/comment_quote_outline" { export=icon }
declare module "lenz:icons/comment_remove" { export=icon }
declare module "lenz:icons/comment_remove_outline" { export=icon }
declare module "lenz:icons/comment_search" { export=icon }
declare module "lenz:icons/comment_search_outline" { export=icon }
declare module "lenz:icons/comment_text" { export=icon }
declare module "lenz:icons/comment_text_multiple" { export=icon }
declare module "lenz:icons/comment_text_multiple_outline" { export=icon }
declare module "lenz:icons/comment_text_outline" { export=icon }
declare module "lenz:icons/compare" { export=icon }
declare module "lenz:icons/compare_horizontal" { export=icon }
declare module "lenz:icons/compare_remove" { export=icon }
declare module "lenz:icons/compare_vertical" { export=icon }
declare module "lenz:icons/compass" { export=icon }
declare module "lenz:icons/compass_off" { export=icon }
declare module "lenz:icons/compass_off_outline" { export=icon }
declare module "lenz:icons/compass_outline" { export=icon }
declare module "lenz:icons/compass_rose" { export=icon }
declare module "lenz:icons/compost" { export=icon }
declare module "lenz:icons/cone" { export=icon }
declare module "lenz:icons/cone_off" { export=icon }
declare module "lenz:icons/connection" { export=icon }
declare module "lenz:icons/console" { export=icon }
declare module "lenz:icons/console_line" { export=icon }
declare module "lenz:icons/console_network" { export=icon }
declare module "lenz:icons/console_network_outline" { export=icon }
declare module "lenz:icons/consolidate" { export=icon }
declare module "lenz:icons/contactless_payment" { export=icon }
declare module "lenz:icons/contactless_payment_circle" { export=icon }
declare module "lenz:icons/contactless_payment_circle_outline" { export=icon }
declare module "lenz:icons/contacts" { export=icon }
declare module "lenz:icons/contacts_outline" { export=icon }
declare module "lenz:icons/contain" { export=icon }
declare module "lenz:icons/contain_end" { export=icon }
declare module "lenz:icons/contain_start" { export=icon }
declare module "lenz:icons/content_copy" { export=icon }
declare module "lenz:icons/content_cut" { export=icon }
declare module "lenz:icons/content_duplicate" { export=icon }
declare module "lenz:icons/content_paste" { export=icon }
declare module "lenz:icons/content_save" { export=icon }
declare module "lenz:icons/content_save_alert" { export=icon }
declare module "lenz:icons/content_save_alert_outline" { export=icon }
declare module "lenz:icons/content_save_all" { export=icon }
declare module "lenz:icons/content_save_all_outline" { export=icon }
declare module "lenz:icons/content_save_check" { export=icon }
declare module "lenz:icons/content_save_check_outline" { export=icon }
declare module "lenz:icons/content_save_cog" { export=icon }
declare module "lenz:icons/content_save_cog_outline" { export=icon }
declare module "lenz:icons/content_save_edit" { export=icon }
declare module "lenz:icons/content_save_edit_outline" { export=icon }
declare module "lenz:icons/content_save_minus" { export=icon }
declare module "lenz:icons/content_save_minus_outline" { export=icon }
declare module "lenz:icons/content_save_move" { export=icon }
declare module "lenz:icons/content_save_move_outline" { export=icon }
declare module "lenz:icons/content_save_off" { export=icon }
declare module "lenz:icons/content_save_off_outline" { export=icon }
declare module "lenz:icons/content_save_outline" { export=icon }
declare module "lenz:icons/content_save_plus" { export=icon }
declare module "lenz:icons/content_save_plus_outline" { export=icon }
declare module "lenz:icons/content_save_settings" { export=icon }
declare module "lenz:icons/content_save_settings_outline" { export=icon }
declare module "lenz:icons/contrast" { export=icon }
declare module "lenz:icons/contrast_box" { export=icon }
declare module "lenz:icons/contrast_circle" { export=icon }
declare module "lenz:icons/controller" { export=icon }
declare module "lenz:icons/controller_classic" { export=icon }
declare module "lenz:icons/controller_classic_outline" { export=icon }
declare module "lenz:icons/controller_off" { export=icon }
declare module "lenz:icons/cookie" { export=icon }
declare module "lenz:icons/cookie_alert" { export=icon }
declare module "lenz:icons/cookie_alert_outline" { export=icon }
declare module "lenz:icons/cookie_check" { export=icon }
declare module "lenz:icons/cookie_check_outline" { export=icon }
declare module "lenz:icons/cookie_clock" { export=icon }
declare module "lenz:icons/cookie_clock_outline" { export=icon }
declare module "lenz:icons/cookie_cog" { export=icon }
declare module "lenz:icons/cookie_cog_outline" { export=icon }
declare module "lenz:icons/cookie_edit" { export=icon }
declare module "lenz:icons/cookie_edit_outline" { export=icon }
declare module "lenz:icons/cookie_lock" { export=icon }
declare module "lenz:icons/cookie_lock_outline" { export=icon }
declare module "lenz:icons/cookie_minus" { export=icon }
declare module "lenz:icons/cookie_minus_outline" { export=icon }
declare module "lenz:icons/cookie_off" { export=icon }
declare module "lenz:icons/cookie_off_outline" { export=icon }
declare module "lenz:icons/cookie_outline" { export=icon }
declare module "lenz:icons/cookie_plus" { export=icon }
declare module "lenz:icons/cookie_plus_outline" { export=icon }
declare module "lenz:icons/cookie_refresh" { export=icon }
declare module "lenz:icons/cookie_refresh_outline" { export=icon }
declare module "lenz:icons/cookie_remove" { export=icon }
declare module "lenz:icons/cookie_remove_outline" { export=icon }
declare module "lenz:icons/cookie_settings" { export=icon }
declare module "lenz:icons/cookie_settings_outline" { export=icon }
declare module "lenz:icons/coolant_temperature" { export=icon }
declare module "lenz:icons/copyleft" { export=icon }
declare module "lenz:icons/copyright" { export=icon }
declare module "lenz:icons/cordova" { export=icon }
declare module "lenz:icons/corn" { export=icon }
declare module "lenz:icons/corn_off" { export=icon }
declare module "lenz:icons/cosine_wave" { export=icon }
declare module "lenz:icons/counter" { export=icon }
declare module "lenz:icons/countertop" { export=icon }
declare module "lenz:icons/countertop_outline" { export=icon }
declare module "lenz:icons/cow" { export=icon }
declare module "lenz:icons/cow_off" { export=icon }
declare module "lenz:icons/cpu32bit" { export=icon }
declare module "lenz:icons/cpu64bit" { export=icon }
declare module "lenz:icons/cradle" { export=icon }
declare module "lenz:icons/cradle_outline" { export=icon }
declare module "lenz:icons/crane" { export=icon }
declare module "lenz:icons/creation" { export=icon }
declare module "lenz:icons/creation_outline" { export=icon }
declare module "lenz:icons/creative_commons" { export=icon }
declare module "lenz:icons/credit_card" { export=icon }
declare module "lenz:icons/credit_card_check" { export=icon }
declare module "lenz:icons/credit_card_check_outline" { export=icon }
declare module "lenz:icons/credit_card_chip" { export=icon }
declare module "lenz:icons/credit_card_chip_outline" { export=icon }
declare module "lenz:icons/credit_card_clock" { export=icon }
declare module "lenz:icons/credit_card_clock_outline" { export=icon }
declare module "lenz:icons/credit_card_edit" { export=icon }
declare module "lenz:icons/credit_card_edit_outline" { export=icon }
declare module "lenz:icons/credit_card_fast" { export=icon }
declare module "lenz:icons/credit_card_fast_outline" { export=icon }
declare module "lenz:icons/credit_card_lock" { export=icon }
declare module "lenz:icons/credit_card_lock_outline" { export=icon }
declare module "lenz:icons/credit_card_marker" { export=icon }
declare module "lenz:icons/credit_card_marker_outline" { export=icon }
declare module "lenz:icons/credit_card_minus" { export=icon }
declare module "lenz:icons/credit_card_minus_outline" { export=icon }
declare module "lenz:icons/credit_card_multiple" { export=icon }
declare module "lenz:icons/credit_card_multiple_outline" { export=icon }
declare module "lenz:icons/credit_card_off" { export=icon }
declare module "lenz:icons/credit_card_off_outline" { export=icon }
declare module "lenz:icons/credit_card_outline" { export=icon }
declare module "lenz:icons/credit_card_plus" { export=icon }
declare module "lenz:icons/credit_card_plus_outline" { export=icon }
declare module "lenz:icons/credit_card_refresh" { export=icon }
declare module "lenz:icons/credit_card_refresh_outline" { export=icon }
declare module "lenz:icons/credit_card_refund" { export=icon }
declare module "lenz:icons/credit_card_refund_outline" { export=icon }
declare module "lenz:icons/credit_card_remove" { export=icon }
declare module "lenz:icons/credit_card_remove_outline" { export=icon }
declare module "lenz:icons/credit_card_scan" { export=icon }
declare module "lenz:icons/credit_card_scan_outline" { export=icon }
declare module "lenz:icons/credit_card_search" { export=icon }
declare module "lenz:icons/credit_card_search_outline" { export=icon }
declare module "lenz:icons/credit_card_settings" { export=icon }
declare module "lenz:icons/credit_card_settings_outline" { export=icon }
declare module "lenz:icons/credit_card_sync" { export=icon }
declare module "lenz:icons/credit_card_sync_outline" { export=icon }
declare module "lenz:icons/credit_card_wireless" { export=icon }
declare module "lenz:icons/credit_card_wireless_off" { export=icon }
declare module "lenz:icons/credit_card_wireless_off_outline" { export=icon }
declare module "lenz:icons/credit_card_wireless_outline" { export=icon }
declare module "lenz:icons/cricket" { export=icon }
declare module "lenz:icons/crop" { export=icon }
declare module "lenz:icons/crop_free" { export=icon }
declare module "lenz:icons/crop_landscape" { export=icon }
declare module "lenz:icons/crop_portrait" { export=icon }
declare module "lenz:icons/crop_rotate" { export=icon }
declare module "lenz:icons/crop_square" { export=icon }
declare module "lenz:icons/cross" { export=icon }
declare module "lenz:icons/cross_bolnisi" { export=icon }
declare module "lenz:icons/cross_celtic" { export=icon }
declare module "lenz:icons/cross_outline" { export=icon }
declare module "lenz:icons/crosshairs" { export=icon }
declare module "lenz:icons/crosshairs_gps" { export=icon }
declare module "lenz:icons/crosshairs_off" { export=icon }
declare module "lenz:icons/crosshairs_question" { export=icon }
declare module "lenz:icons/crowd" { export=icon }
declare module "lenz:icons/crown" { export=icon }
declare module "lenz:icons/crown_circle" { export=icon }
declare module "lenz:icons/crown_circle_outline" { export=icon }
declare module "lenz:icons/crown_outline" { export=icon }
declare module "lenz:icons/cryengine" { export=icon }
declare module "lenz:icons/crystal_ball" { export=icon }
declare module "lenz:icons/cube" { export=icon }
declare module "lenz:icons/cube_off" { export=icon }
declare module "lenz:icons/cube_off_outline" { export=icon }
declare module "lenz:icons/cube_outline" { export=icon }
declare module "lenz:icons/cube_scan" { export=icon }
declare module "lenz:icons/cube_send" { export=icon }
declare module "lenz:icons/cube_unfolded" { export=icon }
declare module "lenz:icons/cup" { export=icon }
declare module "lenz:icons/cup_off" { export=icon }
declare module "lenz:icons/cup_off_outline" { export=icon }
declare module "lenz:icons/cup_outline" { export=icon }
declare module "lenz:icons/cup_water" { export=icon }
declare module "lenz:icons/cupboard" { export=icon }
declare module "lenz:icons/cupboard_outline" { export=icon }
declare module "lenz:icons/cupcake" { export=icon }
declare module "lenz:icons/curling" { export=icon }
declare module "lenz:icons/currency_bdt" { export=icon }
declare module "lenz:icons/currency_brl" { export=icon }
declare module "lenz:icons/currency_btc" { export=icon }
declare module "lenz:icons/currency_cny" { export=icon }
declare module "lenz:icons/currency_eth" { export=icon }
declare module "lenz:icons/currency_eur" { export=icon }
declare module "lenz:icons/currency_eur_off" { export=icon }
declare module "lenz:icons/currency_fra" { export=icon }
declare module "lenz:icons/currency_gbp" { export=icon }
declare module "lenz:icons/currency_ils" { export=icon }
declare module "lenz:icons/currency_inr" { export=icon }
declare module "lenz:icons/currency_jpy" { export=icon }
declare module "lenz:icons/currency_krw" { export=icon }
declare module "lenz:icons/currency_kzt" { export=icon }
declare module "lenz:icons/currency_mnt" { export=icon }
declare module "lenz:icons/currency_ngn" { export=icon }
declare module "lenz:icons/currency_php" { export=icon }
declare module "lenz:icons/currency_rial" { export=icon }
declare module "lenz:icons/currency_rub" { export=icon }
declare module "lenz:icons/currency_rupee" { export=icon }
declare module "lenz:icons/currency_sign" { export=icon }
declare module "lenz:icons/currency_thb" { export=icon }
declare module "lenz:icons/currency_try" { export=icon }
declare module "lenz:icons/currency_twd" { export=icon }
declare module "lenz:icons/currency_uah" { export=icon }
declare module "lenz:icons/currency_usd" { export=icon }
declare module "lenz:icons/currency_usd_off" { export=icon }
declare module "lenz:icons/current_ac" { export=icon }
declare module "lenz:icons/current_dc" { export=icon }
declare module "lenz:icons/cursor_default" { export=icon }
declare module "lenz:icons/cursor_default_click" { export=icon }
declare module "lenz:icons/cursor_default_click_outline" { export=icon }
declare module "lenz:icons/cursor_default_gesture" { export=icon }
declare module "lenz:icons/cursor_default_gesture_outline" { export=icon }
declare module "lenz:icons/cursor_default_outline" { export=icon }
declare module "lenz:icons/cursor_move" { export=icon }
declare module "lenz:icons/cursor_pointer" { export=icon }
declare module "lenz:icons/cursor_text" { export=icon }
declare module "lenz:icons/curtains" { export=icon }
declare module "lenz:icons/curtains_closed" { export=icon }
declare module "lenz:icons/cylinder" { export=icon }
declare module "lenz:icons/cylinder_off" { export=icon }
declare module "lenz:icons/dance_ballroom" { export=icon }
declare module "lenz:icons/dance_pole" { export=icon }
declare module "lenz:icons/data_matrix" { export=icon }
declare module "lenz:icons/data_matrix_edit" { export=icon }
declare module "lenz:icons/data_matrix_minus" { export=icon }
declare module "lenz:icons/data_matrix_plus" { export=icon }
declare module "lenz:icons/data_matrix_remove" { export=icon }
declare module "lenz:icons/data_matrix_scan" { export=icon }
declare module "lenz:icons/database" { export=icon }
declare module "lenz:icons/database_alert" { export=icon }
declare module "lenz:icons/database_alert_outline" { export=icon }
declare module "lenz:icons/database_arrow_down" { export=icon }
declare module "lenz:icons/database_arrow_down_outline" { export=icon }
declare module "lenz:icons/database_arrow_left" { export=icon }
declare module "lenz:icons/database_arrow_left_outline" { export=icon }
declare module "lenz:icons/database_arrow_right" { export=icon }
declare module "lenz:icons/database_arrow_right_outline" { export=icon }
declare module "lenz:icons/database_arrow_up" { export=icon }
declare module "lenz:icons/database_arrow_up_outline" { export=icon }
declare module "lenz:icons/database_check" { export=icon }
declare module "lenz:icons/database_check_outline" { export=icon }
declare module "lenz:icons/database_clock" { export=icon }
declare module "lenz:icons/database_clock_outline" { export=icon }
declare module "lenz:icons/database_cog" { export=icon }
declare module "lenz:icons/database_cog_outline" { export=icon }
declare module "lenz:icons/database_edit" { export=icon }
declare module "lenz:icons/database_edit_outline" { export=icon }
declare module "lenz:icons/database_export" { export=icon }
declare module "lenz:icons/database_export_outline" { export=icon }
declare module "lenz:icons/database_eye" { export=icon }
declare module "lenz:icons/database_eye_off" { export=icon }
declare module "lenz:icons/database_eye_off_outline" { export=icon }
declare module "lenz:icons/database_eye_outline" { export=icon }
declare module "lenz:icons/database_import" { export=icon }
declare module "lenz:icons/database_import_outline" { export=icon }
declare module "lenz:icons/database_lock" { export=icon }
declare module "lenz:icons/database_lock_outline" { export=icon }
declare module "lenz:icons/database_marker" { export=icon }
declare module "lenz:icons/database_marker_outline" { export=icon }
declare module "lenz:icons/database_minus" { export=icon }
declare module "lenz:icons/database_minus_outline" { export=icon }
declare module "lenz:icons/database_off" { export=icon }
declare module "lenz:icons/database_off_outline" { export=icon }
declare module "lenz:icons/database_outline" { export=icon }
declare module "lenz:icons/database_plus" { export=icon }
declare module "lenz:icons/database_plus_outline" { export=icon }
declare module "lenz:icons/database_refresh" { export=icon }
declare module "lenz:icons/database_refresh_outline" { export=icon }
declare module "lenz:icons/database_remove" { export=icon }
declare module "lenz:icons/database_remove_outline" { export=icon }
declare module "lenz:icons/database_search" { export=icon }
declare module "lenz:icons/database_search_outline" { export=icon }
declare module "lenz:icons/database_settings" { export=icon }
declare module "lenz:icons/database_settings_outline" { export=icon }
declare module "lenz:icons/database_sync" { export=icon }
declare module "lenz:icons/database_sync_outline" { export=icon }
declare module "lenz:icons/death_star" { export=icon }
declare module "lenz:icons/death_star_variant" { export=icon }
declare module "lenz:icons/deathly_hallows" { export=icon }
declare module "lenz:icons/debian" { export=icon }
declare module "lenz:icons/debug_step_into" { export=icon }
declare module "lenz:icons/debug_step_out" { export=icon }
declare module "lenz:icons/debug_step_over" { export=icon }
declare module "lenz:icons/decagram" { export=icon }
declare module "lenz:icons/decagram_outline" { export=icon }
declare module "lenz:icons/decimal" { export=icon }
declare module "lenz:icons/decimal_comma" { export=icon }
declare module "lenz:icons/decimal_comma_decrease" { export=icon }
declare module "lenz:icons/decimal_comma_increase" { export=icon }
declare module "lenz:icons/decimal_decrease" { export=icon }
declare module "lenz:icons/decimal_increase" { export=icon }
declare module "lenz:icons/delete" { export=icon }
declare module "lenz:icons/delete_alert" { export=icon }
declare module "lenz:icons/delete_alert_outline" { export=icon }
declare module "lenz:icons/delete_circle" { export=icon }
declare module "lenz:icons/delete_circle_outline" { export=icon }
declare module "lenz:icons/delete_clock" { export=icon }
declare module "lenz:icons/delete_clock_outline" { export=icon }
declare module "lenz:icons/delete_empty" { export=icon }
declare module "lenz:icons/delete_empty_outline" { export=icon }
declare module "lenz:icons/delete_forever" { export=icon }
declare module "lenz:icons/delete_forever_outline" { export=icon }
declare module "lenz:icons/delete_off" { export=icon }
declare module "lenz:icons/delete_off_outline" { export=icon }
declare module "lenz:icons/delete_outline" { export=icon }
declare module "lenz:icons/delete_restore" { export=icon }
declare module "lenz:icons/delete_sweep" { export=icon }
declare module "lenz:icons/delete_sweep_outline" { export=icon }
declare module "lenz:icons/delete_variant" { export=icon }
declare module "lenz:icons/delta" { export=icon }
declare module "lenz:icons/desk" { export=icon }
declare module "lenz:icons/desk_lamp" { export=icon }
declare module "lenz:icons/desk_lamp_off" { export=icon }
declare module "lenz:icons/desk_lamp_on" { export=icon }
declare module "lenz:icons/deskphone" { export=icon }
declare module "lenz:icons/desktop_classic" { export=icon }
declare module "lenz:icons/desktop_tower" { export=icon }
declare module "lenz:icons/desktop_tower_monitor" { export=icon }
declare module "lenz:icons/details" { export=icon }
declare module "lenz:icons/dev_to" { export=icon }
declare module "lenz:icons/developer_board" { export=icon }
declare module "lenz:icons/deviantart" { export=icon }
declare module "lenz:icons/devices" { export=icon }
declare module "lenz:icons/dharmachakra" { export=icon }
declare module "lenz:icons/diabetes" { export=icon }
declare module "lenz:icons/dialpad" { export=icon }
declare module "lenz:icons/diameter" { export=icon }
declare module "lenz:icons/diameter_outline" { export=icon }
declare module "lenz:icons/diameter_variant" { export=icon }
declare module "lenz:icons/diamond" { export=icon }
declare module "lenz:icons/diamond_outline" { export=icon }
declare module "lenz:icons/diamond_stone" { export=icon }
declare module "lenz:icons/diaper_outline" { export=icon }
declare module "lenz:icons/dice1" { export=icon }
declare module "lenz:icons/dice1outline" { export=icon }
declare module "lenz:icons/dice2" { export=icon }
declare module "lenz:icons/dice2outline" { export=icon }
declare module "lenz:icons/dice3" { export=icon }
declare module "lenz:icons/dice3outline" { export=icon }
declare module "lenz:icons/dice4" { export=icon }
declare module "lenz:icons/dice4outline" { export=icon }
declare module "lenz:icons/dice5" { export=icon }
declare module "lenz:icons/dice5outline" { export=icon }
declare module "lenz:icons/dice6" { export=icon }
declare module "lenz:icons/dice6outline" { export=icon }
declare module "lenz:icons/dice_d10" { export=icon }
declare module "lenz:icons/dice_d10outline" { export=icon }
declare module "lenz:icons/dice_d12" { export=icon }
declare module "lenz:icons/dice_d12outline" { export=icon }
declare module "lenz:icons/dice_d20" { export=icon }
declare module "lenz:icons/dice_d20outline" { export=icon }
declare module "lenz:icons/dice_d4" { export=icon }
declare module "lenz:icons/dice_d4outline" { export=icon }
declare module "lenz:icons/dice_d6" { export=icon }
declare module "lenz:icons/dice_d6outline" { export=icon }
declare module "lenz:icons/dice_d8" { export=icon }
declare module "lenz:icons/dice_d8outline" { export=icon }
declare module "lenz:icons/dice_multiple" { export=icon }
declare module "lenz:icons/dice_multiple_outline" { export=icon }
declare module "lenz:icons/digital_ocean" { export=icon }
declare module "lenz:icons/dip_switch" { export=icon }
declare module "lenz:icons/directions" { export=icon }
declare module "lenz:icons/directions_fork" { export=icon }
declare module "lenz:icons/disc" { export=icon }
declare module "lenz:icons/disc_alert" { export=icon }
declare module "lenz:icons/disc_player" { export=icon }
declare module "lenz:icons/dishwasher" { export=icon }
declare module "lenz:icons/dishwasher_alert" { export=icon }
declare module "lenz:icons/dishwasher_off" { export=icon }
declare module "lenz:icons/disqus" { export=icon }
declare module "lenz:icons/distribute_horizontal_center" { export=icon }
declare module "lenz:icons/distribute_horizontal_left" { export=icon }
declare module "lenz:icons/distribute_horizontal_right" { export=icon }
declare module "lenz:icons/distribute_vertical_bottom" { export=icon }
declare module "lenz:icons/distribute_vertical_center" { export=icon }
declare module "lenz:icons/distribute_vertical_top" { export=icon }
declare module "lenz:icons/diversify" { export=icon }
declare module "lenz:icons/diving" { export=icon }
declare module "lenz:icons/diving_flippers" { export=icon }
declare module "lenz:icons/diving_helmet" { export=icon }
declare module "lenz:icons/diving_scuba" { export=icon }
declare module "lenz:icons/diving_scuba_flag" { export=icon }
declare module "lenz:icons/diving_scuba_mask" { export=icon }
declare module "lenz:icons/diving_scuba_tank" { export=icon }
declare module "lenz:icons/diving_scuba_tank_multiple" { export=icon }
declare module "lenz:icons/diving_snorkel" { export=icon }
declare module "lenz:icons/division" { export=icon }
declare module "lenz:icons/division_box" { export=icon }
declare module "lenz:icons/dlna" { export=icon }
declare module "lenz:icons/dna" { export=icon }
declare module "lenz:icons/dns" { export=icon }
declare module "lenz:icons/dns_outline" { export=icon }
declare module "lenz:icons/dock_bottom" { export=icon }
declare module "lenz:icons/dock_left" { export=icon }
declare module "lenz:icons/dock_right" { export=icon }
declare module "lenz:icons/dock_top" { export=icon }
declare module "lenz:icons/dock_window" { export=icon }
declare module "lenz:icons/docker" { export=icon }
declare module "lenz:icons/doctor" { export=icon }
declare module "lenz:icons/dog" { export=icon }
declare module "lenz:icons/dog_service" { export=icon }
declare module "lenz:icons/dog_side" { export=icon }
declare module "lenz:icons/dog_side_off" { export=icon }
declare module "lenz:icons/dolby" { export=icon }
declare module "lenz:icons/dolly" { export=icon }
declare module "lenz:icons/dolphin" { export=icon }
declare module "lenz:icons/domain" { export=icon }
declare module "lenz:icons/domain_off" { export=icon }
declare module "lenz:icons/domain_plus" { export=icon }
declare module "lenz:icons/domain_remove" { export=icon }
declare module "lenz:icons/domain_switch" { export=icon }
declare module "lenz:icons/dome_light" { export=icon }
declare module "lenz:icons/domino_mask" { export=icon }
declare module "lenz:icons/donkey" { export=icon }
declare module "lenz:icons/door" { export=icon }
declare module "lenz:icons/door_closed" { export=icon }
declare module "lenz:icons/door_closed_cancel" { export=icon }
declare module "lenz:icons/door_closed_lock" { export=icon }
declare module "lenz:icons/door_open" { export=icon }
declare module "lenz:icons/door_sliding" { export=icon }
declare module "lenz:icons/door_sliding_lock" { export=icon }
declare module "lenz:icons/door_sliding_open" { export=icon }
declare module "lenz:icons/doorbell" { export=icon }
declare module "lenz:icons/doorbell_video" { export=icon }
declare module "lenz:icons/dot_net" { export=icon }
declare module "lenz:icons/dots_circle" { export=icon }
declare module "lenz:icons/dots_grid" { export=icon }
declare module "lenz:icons/dots_hexagon" { export=icon }
declare module "lenz:icons/dots_horizontal" { export=icon }
declare module "lenz:icons/dots_horizontal_circle" { export=icon }
declare module "lenz:icons/dots_horizontal_circle_outline" { export=icon }
declare module "lenz:icons/dots_square" { export=icon }
declare module "lenz:icons/dots_triangle" { export=icon }
declare module "lenz:icons/dots_vertical" { export=icon }
declare module "lenz:icons/dots_vertical_circle" { export=icon }
declare module "lenz:icons/dots_vertical_circle_outline" { export=icon }
declare module "lenz:icons/download" { export=icon }
declare module "lenz:icons/download_box" { export=icon }
declare module "lenz:icons/download_box_outline" { export=icon }
declare module "lenz:icons/download_circle" { export=icon }
declare module "lenz:icons/download_circle_outline" { export=icon }
declare module "lenz:icons/download_lock" { export=icon }
declare module "lenz:icons/download_lock_outline" { export=icon }
declare module "lenz:icons/download_multiple" { export=icon }
declare module "lenz:icons/download_multiple_outline" { export=icon }
declare module "lenz:icons/download_network" { export=icon }
declare module "lenz:icons/download_network_outline" { export=icon }
declare module "lenz:icons/download_off" { export=icon }
declare module "lenz:icons/download_off_outline" { export=icon }
declare module "lenz:icons/download_outline" { export=icon }
declare module "lenz:icons/drag" { export=icon }
declare module "lenz:icons/drag_horizontal" { export=icon }
declare module "lenz:icons/drag_horizontal_variant" { export=icon }
declare module "lenz:icons/drag_variant" { export=icon }
declare module "lenz:icons/drag_vertical" { export=icon }
declare module "lenz:icons/drag_vertical_variant" { export=icon }
declare module "lenz:icons/drama_masks" { export=icon }
declare module "lenz:icons/draw" { export=icon }
declare module "lenz:icons/draw_pen" { export=icon }
declare module "lenz:icons/drawing" { export=icon }
declare module "lenz:icons/drawing_box" { export=icon }
declare module "lenz:icons/dresser" { export=icon }
declare module "lenz:icons/dresser_outline" { export=icon }
declare module "lenz:icons/drone" { export=icon }
declare module "lenz:icons/dropbox" { export=icon }
declare module "lenz:icons/drupal" { export=icon }
declare module "lenz:icons/duck" { export=icon }
declare module "lenz:icons/dumbbell" { export=icon }
declare module "lenz:icons/dump_truck" { export=icon }
declare module "lenz:icons/ear_hearing" { export=icon }
declare module "lenz:icons/ear_hearing_loop" { export=icon }
declare module "lenz:icons/ear_hearing_off" { export=icon }
declare module "lenz:icons/earbuds" { export=icon }
declare module "lenz:icons/earbuds_off" { export=icon }
declare module "lenz:icons/earbuds_off_outline" { export=icon }
declare module "lenz:icons/earbuds_outline" { export=icon }
declare module "lenz:icons/earth" { export=icon }
declare module "lenz:icons/earth_arrow_down" { export=icon }
declare module "lenz:icons/earth_arrow_left" { export=icon }
declare module "lenz:icons/earth_arrow_right" { export=icon }
declare module "lenz:icons/earth_arrow_up" { export=icon }
declare module "lenz:icons/earth_box" { export=icon }
declare module "lenz:icons/earth_box_minus" { export=icon }
declare module "lenz:icons/earth_box_off" { export=icon }
declare module "lenz:icons/earth_box_plus" { export=icon }
declare module "lenz:icons/earth_box_remove" { export=icon }
declare module "lenz:icons/earth_minus" { export=icon }
declare module "lenz:icons/earth_off" { export=icon }
declare module "lenz:icons/earth_plus" { export=icon }
declare module "lenz:icons/earth_remove" { export=icon }
declare module "lenz:icons/egg" { export=icon }
declare module "lenz:icons/egg_easter" { export=icon }
declare module "lenz:icons/egg_fried" { export=icon }
declare module "lenz:icons/egg_off" { export=icon }
declare module "lenz:icons/egg_off_outline" { export=icon }
declare module "lenz:icons/egg_outline" { export=icon }
declare module "lenz:icons/eiffel_tower" { export=icon }
declare module "lenz:icons/eight_track" { export=icon }
declare module "lenz:icons/eject" { export=icon }
declare module "lenz:icons/eject_circle" { export=icon }
declare module "lenz:icons/eject_circle_outline" { export=icon }
declare module "lenz:icons/eject_outline" { export=icon }
declare module "lenz:icons/electric_switch" { export=icon }
declare module "lenz:icons/electric_switch_closed" { export=icon }
declare module "lenz:icons/electron_framework" { export=icon }
declare module "lenz:icons/elephant" { export=icon }
declare module "lenz:icons/elevation_decline" { export=icon }
declare module "lenz:icons/elevation_rise" { export=icon }
declare module "lenz:icons/elevator" { export=icon }
declare module "lenz:icons/elevator_down" { export=icon }
declare module "lenz:icons/elevator_passenger" { export=icon }
declare module "lenz:icons/elevator_passenger_off" { export=icon }
declare module "lenz:icons/elevator_passenger_off_outline" { export=icon }
declare module "lenz:icons/elevator_passenger_outline" { export=icon }
declare module "lenz:icons/elevator_up" { export=icon }
declare module "lenz:icons/ellipse" { export=icon }
declare module "lenz:icons/ellipse_outline" { export=icon }
declare module "lenz:icons/email" { export=icon }
declare module "lenz:icons/email_alert" { export=icon }
declare module "lenz:icons/email_alert_outline" { export=icon }
declare module "lenz:icons/email_arrow_left" { export=icon }
declare module "lenz:icons/email_arrow_left_outline" { export=icon }
declare module "lenz:icons/email_arrow_right" { export=icon }
declare module "lenz:icons/email_arrow_right_outline" { export=icon }
declare module "lenz:icons/email_box" { export=icon }
declare module "lenz:icons/email_check" { export=icon }
declare module "lenz:icons/email_check_outline" { export=icon }
declare module "lenz:icons/email_edit" { export=icon }
declare module "lenz:icons/email_edit_outline" { export=icon }
declare module "lenz:icons/email_fast" { export=icon }
declare module "lenz:icons/email_fast_outline" { export=icon }
declare module "lenz:icons/email_heart_outline" { export=icon }
declare module "lenz:icons/email_lock" { export=icon }
declare module "lenz:icons/email_lock_outline" { export=icon }
declare module "lenz:icons/email_mark_as_unread" { export=icon }
declare module "lenz:icons/email_minus" { export=icon }
declare module "lenz:icons/email_minus_outline" { export=icon }
declare module "lenz:icons/email_multiple" { export=icon }
declare module "lenz:icons/email_multiple_outline" { export=icon }
declare module "lenz:icons/email_newsletter" { export=icon }
declare module "lenz:icons/email_off" { export=icon }
declare module "lenz:icons/email_off_outline" { export=icon }
declare module "lenz:icons/email_open" { export=icon }
declare module "lenz:icons/email_open_heart_outline" { export=icon }
declare module "lenz:icons/email_open_multiple" { export=icon }
declare module "lenz:icons/email_open_multiple_outline" { export=icon }
declare module "lenz:icons/email_open_outline" { export=icon }
declare module "lenz:icons/email_outline" { export=icon }
declare module "lenz:icons/email_plus" { export=icon }
declare module "lenz:icons/email_plus_outline" { export=icon }
declare module "lenz:icons/email_remove" { export=icon }
declare module "lenz:icons/email_remove_outline" { export=icon }
declare module "lenz:icons/email_seal" { export=icon }
declare module "lenz:icons/email_seal_outline" { export=icon }
declare module "lenz:icons/email_search" { export=icon }
declare module "lenz:icons/email_search_outline" { export=icon }
declare module "lenz:icons/email_sync" { export=icon }
declare module "lenz:icons/email_sync_outline" { export=icon }
declare module "lenz:icons/email_variant" { export=icon }
declare module "lenz:icons/ember" { export=icon }
declare module "lenz:icons/emby" { export=icon }
declare module "lenz:icons/emoticon" { export=icon }
declare module "lenz:icons/emoticon_angry" { export=icon }
declare module "lenz:icons/emoticon_angry_outline" { export=icon }
declare module "lenz:icons/emoticon_confused" { export=icon }
declare module "lenz:icons/emoticon_confused_outline" { export=icon }
declare module "lenz:icons/emoticon_cool" { export=icon }
declare module "lenz:icons/emoticon_cool_outline" { export=icon }
declare module "lenz:icons/emoticon_cry" { export=icon }
declare module "lenz:icons/emoticon_cry_outline" { export=icon }
declare module "lenz:icons/emoticon_dead" { export=icon }
declare module "lenz:icons/emoticon_dead_outline" { export=icon }
declare module "lenz:icons/emoticon_devil" { export=icon }
declare module "lenz:icons/emoticon_devil_outline" { export=icon }
declare module "lenz:icons/emoticon_excited" { export=icon }
declare module "lenz:icons/emoticon_excited_outline" { export=icon }
declare module "lenz:icons/emoticon_frown" { export=icon }
declare module "lenz:icons/emoticon_frown_outline" { export=icon }
declare module "lenz:icons/emoticon_happy" { export=icon }
declare module "lenz:icons/emoticon_happy_outline" { export=icon }
declare module "lenz:icons/emoticon_kiss" { export=icon }
declare module "lenz:icons/emoticon_kiss_outline" { export=icon }
declare module "lenz:icons/emoticon_lol" { export=icon }
declare module "lenz:icons/emoticon_lol_outline" { export=icon }
declare module "lenz:icons/emoticon_minus" { export=icon }
declare module "lenz:icons/emoticon_minus_outline" { export=icon }
declare module "lenz:icons/emoticon_neutral" { export=icon }
declare module "lenz:icons/emoticon_neutral_outline" { export=icon }
declare module "lenz:icons/emoticon_outline" { export=icon }
declare module "lenz:icons/emoticon_plus" { export=icon }
declare module "lenz:icons/emoticon_plus_outline" { export=icon }
declare module "lenz:icons/emoticon_poop" { export=icon }
declare module "lenz:icons/emoticon_poop_outline" { export=icon }
declare module "lenz:icons/emoticon_remove" { export=icon }
declare module "lenz:icons/emoticon_remove_outline" { export=icon }
declare module "lenz:icons/emoticon_sad" { export=icon }
declare module "lenz:icons/emoticon_sad_outline" { export=icon }
declare module "lenz:icons/emoticon_sick" { export=icon }
declare module "lenz:icons/emoticon_sick_outline" { export=icon }
declare module "lenz:icons/emoticon_tongue" { export=icon }
declare module "lenz:icons/emoticon_tongue_outline" { export=icon }
declare module "lenz:icons/emoticon_wink" { export=icon }
declare module "lenz:icons/emoticon_wink_outline" { export=icon }
declare module "lenz:icons/engine" { export=icon }
declare module "lenz:icons/engine_off" { export=icon }
declare module "lenz:icons/engine_off_outline" { export=icon }
declare module "lenz:icons/engine_outline" { export=icon }
declare module "lenz:icons/epsilon" { export=icon }
declare module "lenz:icons/equal" { export=icon }
declare module "lenz:icons/equal_box" { export=icon }
declare module "lenz:icons/equalizer" { export=icon }
declare module "lenz:icons/equalizer_outline" { export=icon }
declare module "lenz:icons/eraser" { export=icon }
declare module "lenz:icons/eraser_variant" { export=icon }
declare module "lenz:icons/escalator" { export=icon }
declare module "lenz:icons/escalator_box" { export=icon }
declare module "lenz:icons/escalator_down" { export=icon }
declare module "lenz:icons/escalator_up" { export=icon }
declare module "lenz:icons/eslint" { export=icon }
declare module "lenz:icons/et" { export=icon }
declare module "lenz:icons/ethereum" { export=icon }
declare module "lenz:icons/ethernet" { export=icon }
declare module "lenz:icons/ethernet_cable" { export=icon }
declare module "lenz:icons/ethernet_cable_off" { export=icon }
declare module "lenz:icons/ethernet_off" { export=icon }
declare module "lenz:icons/ev_plug_ccs1" { export=icon }
declare module "lenz:icons/ev_plug_ccs2" { export=icon }
declare module "lenz:icons/ev_plug_chademo" { export=icon }
declare module "lenz:icons/ev_plug_tesla" { export=icon }
declare module "lenz:icons/ev_plug_type1" { export=icon }
declare module "lenz:icons/ev_plug_type2" { export=icon }
declare module "lenz:icons/ev_station" { export=icon }
declare module "lenz:icons/evernote" { export=icon }
declare module "lenz:icons/excavator" { export=icon }
declare module "lenz:icons/exclamation" { export=icon }
declare module "lenz:icons/exclamation_thick" { export=icon }
declare module "lenz:icons/exit_run" { export=icon }
declare module "lenz:icons/exit_to_app" { export=icon }
declare module "lenz:icons/expand_all" { export=icon }
declare module "lenz:icons/expand_all_outline" { export=icon }
declare module "lenz:icons/expansion_card" { export=icon }
declare module "lenz:icons/expansion_card_variant" { export=icon }
declare module "lenz:icons/exponent" { export=icon }
declare module "lenz:icons/exponent_box" { export=icon }
declare module "lenz:icons/export" { export=icon }
declare module "lenz:icons/export_variant" { export=icon }
declare module "lenz:icons/eye" { export=icon }
declare module "lenz:icons/eye_arrow_left" { export=icon }
declare module "lenz:icons/eye_arrow_left_outline" { export=icon }
declare module "lenz:icons/eye_arrow_right" { export=icon }
declare module "lenz:icons/eye_arrow_right_outline" { export=icon }
declare module "lenz:icons/eye_check" { export=icon }
declare module "lenz:icons/eye_check_outline" { export=icon }
declare module "lenz:icons/eye_circle" { export=icon }
declare module "lenz:icons/eye_circle_outline" { export=icon }
declare module "lenz:icons/eye_closed" { export=icon }
declare module "lenz:icons/eye_lock" { export=icon }
declare module "lenz:icons/eye_lock_open" { export=icon }
declare module "lenz:icons/eye_lock_open_outline" { export=icon }
declare module "lenz:icons/eye_lock_outline" { export=icon }
declare module "lenz:icons/eye_minus" { export=icon }
declare module "lenz:icons/eye_minus_outline" { export=icon }
declare module "lenz:icons/eye_off" { export=icon }
declare module "lenz:icons/eye_off_outline" { export=icon }
declare module "lenz:icons/eye_outline" { export=icon }
declare module "lenz:icons/eye_plus" { export=icon }
declare module "lenz:icons/eye_plus_outline" { export=icon }
declare module "lenz:icons/eye_refresh" { export=icon }
declare module "lenz:icons/eye_refresh_outline" { export=icon }
declare module "lenz:icons/eye_remove" { export=icon }
declare module "lenz:icons/eye_remove_outline" { export=icon }
declare module "lenz:icons/eye_settings" { export=icon }
declare module "lenz:icons/eye_settings_outline" { export=icon }
declare module "lenz:icons/eyedropper" { export=icon }
declare module "lenz:icons/eyedropper_minus" { export=icon }
declare module "lenz:icons/eyedropper_off" { export=icon }
declare module "lenz:icons/eyedropper_plus" { export=icon }
declare module "lenz:icons/eyedropper_remove" { export=icon }
declare module "lenz:icons/eyedropper_variant" { export=icon }
declare module "lenz:icons/face_agent" { export=icon }
declare module "lenz:icons/face_man" { export=icon }
declare module "lenz:icons/face_man_outline" { export=icon }
declare module "lenz:icons/face_man_profile" { export=icon }
declare module "lenz:icons/face_man_shimmer" { export=icon }
declare module "lenz:icons/face_man_shimmer_outline" { export=icon }
declare module "lenz:icons/face_mask" { export=icon }
declare module "lenz:icons/face_mask_outline" { export=icon }
declare module "lenz:icons/face_recognition" { export=icon }
declare module "lenz:icons/face_woman" { export=icon }
declare module "lenz:icons/face_woman_outline" { export=icon }
declare module "lenz:icons/face_woman_profile" { export=icon }
declare module "lenz:icons/face_woman_shimmer" { export=icon }
declare module "lenz:icons/face_woman_shimmer_outline" { export=icon }
declare module "lenz:icons/facebook" { export=icon }
declare module "lenz:icons/facebook_gaming" { export=icon }
declare module "lenz:icons/facebook_messenger" { export=icon }
declare module "lenz:icons/facebook_workplace" { export=icon }
declare module "lenz:icons/factory" { export=icon }
declare module "lenz:icons/family_tree" { export=icon }
declare module "lenz:icons/fan" { export=icon }
declare module "lenz:icons/fan_alert" { export=icon }
declare module "lenz:icons/fan_auto" { export=icon }
declare module "lenz:icons/fan_chevron_down" { export=icon }
declare module "lenz:icons/fan_chevron_up" { export=icon }
declare module "lenz:icons/fan_clock" { export=icon }
declare module "lenz:icons/fan_minus" { export=icon }
declare module "lenz:icons/fan_off" { export=icon }
declare module "lenz:icons/fan_plus" { export=icon }
declare module "lenz:icons/fan_remove" { export=icon }
declare module "lenz:icons/fan_speed1" { export=icon }
declare module "lenz:icons/fan_speed2" { export=icon }
declare module "lenz:icons/fan_speed3" { export=icon }
declare module "lenz:icons/fast_forward" { export=icon }
declare module "lenz:icons/fast_forward10" { export=icon }
declare module "lenz:icons/fast_forward15" { export=icon }
declare module "lenz:icons/fast_forward30" { export=icon }
declare module "lenz:icons/fast_forward45" { export=icon }
declare module "lenz:icons/fast_forward5" { export=icon }
declare module "lenz:icons/fast_forward60" { export=icon }
declare module "lenz:icons/fast_forward_outline" { export=icon }
declare module "lenz:icons/faucet" { export=icon }
declare module "lenz:icons/faucet_variant" { export=icon }
declare module "lenz:icons/fax" { export=icon }
declare module "lenz:icons/feather" { export=icon }
declare module "lenz:icons/feature_search" { export=icon }
declare module "lenz:icons/feature_search_outline" { export=icon }
declare module "lenz:icons/fedora" { export=icon }
declare module "lenz:icons/fence" { export=icon }
declare module "lenz:icons/fence_electric" { export=icon }
declare module "lenz:icons/fencing" { export=icon }
declare module "lenz:icons/ferris_wheel" { export=icon }
declare module "lenz:icons/ferry" { export=icon }
declare module "lenz:icons/file" { export=icon }
declare module "lenz:icons/file_account" { export=icon }
declare module "lenz:icons/file_account_outline" { export=icon }
declare module "lenz:icons/file_alert" { export=icon }
declare module "lenz:icons/file_alert_outline" { export=icon }
declare module "lenz:icons/file_arrow_left_right" { export=icon }
declare module "lenz:icons/file_arrow_left_right_outline" { export=icon }
declare module "lenz:icons/file_arrow_up_down" { export=icon }
declare module "lenz:icons/file_arrow_up_down_outline" { export=icon }
declare module "lenz:icons/file_cabinet" { export=icon }
declare module "lenz:icons/file_cad" { export=icon }
declare module "lenz:icons/file_cad_box" { export=icon }
declare module "lenz:icons/file_cancel" { export=icon }
declare module "lenz:icons/file_cancel_outline" { export=icon }
declare module "lenz:icons/file_certificate" { export=icon }
declare module "lenz:icons/file_certificate_outline" { export=icon }
declare module "lenz:icons/file_chart" { export=icon }
declare module "lenz:icons/file_chart_check" { export=icon }
declare module "lenz:icons/file_chart_check_outline" { export=icon }
declare module "lenz:icons/file_chart_outline" { export=icon }
declare module "lenz:icons/file_check" { export=icon }
declare module "lenz:icons/file_check_outline" { export=icon }
declare module "lenz:icons/file_clock" { export=icon }
declare module "lenz:icons/file_clock_outline" { export=icon }
declare module "lenz:icons/file_cloud" { export=icon }
declare module "lenz:icons/file_cloud_outline" { export=icon }
declare module "lenz:icons/file_code" { export=icon }
declare module "lenz:icons/file_code_outline" { export=icon }
declare module "lenz:icons/file_cog" { export=icon }
declare module "lenz:icons/file_cog_outline" { export=icon }
declare module "lenz:icons/file_compare" { export=icon }
declare module "lenz:icons/file_delimited" { export=icon }
declare module "lenz:icons/file_delimited_outline" { export=icon }
declare module "lenz:icons/file_document" { export=icon }
declare module "lenz:icons/file_document_alert" { export=icon }
declare module "lenz:icons/file_document_alert_outline" { export=icon }
declare module "lenz:icons/file_document_arrow_right" { export=icon }
declare module "lenz:icons/file_document_arrow_right_outline" { export=icon }
declare module "lenz:icons/file_document_check" { export=icon }
declare module "lenz:icons/file_document_check_outline" { export=icon }
declare module "lenz:icons/file_document_edit" { export=icon }
declare module "lenz:icons/file_document_edit_outline" { export=icon }
declare module "lenz:icons/file_document_minus" { export=icon }
declare module "lenz:icons/file_document_minus_outline" { export=icon }
declare module "lenz:icons/file_document_multiple" { export=icon }
declare module "lenz:icons/file_document_multiple_outline" { export=icon }
declare module "lenz:icons/file_document_outline" { export=icon }
declare module "lenz:icons/file_document_plus" { export=icon }
declare module "lenz:icons/file_document_plus_outline" { export=icon }
declare module "lenz:icons/file_document_refresh" { export=icon }
declare module "lenz:icons/file_document_refresh_outline" { export=icon }
declare module "lenz:icons/file_document_remove" { export=icon }
declare module "lenz:icons/file_document_remove_outline" { export=icon }
declare module "lenz:icons/file_download" { export=icon }
declare module "lenz:icons/file_download_outline" { export=icon }
declare module "lenz:icons/file_edit" { export=icon }
declare module "lenz:icons/file_edit_outline" { export=icon }
declare module "lenz:icons/file_excel" { export=icon }
declare module "lenz:icons/file_excel_box" { export=icon }
declare module "lenz:icons/file_excel_box_outline" { export=icon }
declare module "lenz:icons/file_excel_outline" { export=icon }
declare module "lenz:icons/file_export" { export=icon }
declare module "lenz:icons/file_export_outline" { export=icon }
declare module "lenz:icons/file_eye" { export=icon }
declare module "lenz:icons/file_eye_outline" { export=icon }
declare module "lenz:icons/file_find" { export=icon }
declare module "lenz:icons/file_find_outline" { export=icon }
declare module "lenz:icons/file_gif_box" { export=icon }
declare module "lenz:icons/file_hidden" { export=icon }
declare module "lenz:icons/file_image" { export=icon }
declare module "lenz:icons/file_image_marker" { export=icon }
declare module "lenz:icons/file_image_marker_outline" { export=icon }
declare module "lenz:icons/file_image_minus" { export=icon }
declare module "lenz:icons/file_image_minus_outline" { export=icon }
declare module "lenz:icons/file_image_outline" { export=icon }
declare module "lenz:icons/file_image_plus" { export=icon }
declare module "lenz:icons/file_image_plus_outline" { export=icon }
declare module "lenz:icons/file_image_remove" { export=icon }
declare module "lenz:icons/file_image_remove_outline" { export=icon }
declare module "lenz:icons/file_import" { export=icon }
declare module "lenz:icons/file_import_outline" { export=icon }
declare module "lenz:icons/file_jpg_box" { export=icon }
declare module "lenz:icons/file_key" { export=icon }
declare module "lenz:icons/file_key_outline" { export=icon }
declare module "lenz:icons/file_link" { export=icon }
declare module "lenz:icons/file_link_outline" { export=icon }
declare module "lenz:icons/file_lock" { export=icon }
declare module "lenz:icons/file_lock_open" { export=icon }
declare module "lenz:icons/file_lock_open_outline" { export=icon }
declare module "lenz:icons/file_lock_outline" { export=icon }
declare module "lenz:icons/file_marker" { export=icon }
declare module "lenz:icons/file_marker_outline" { export=icon }
declare module "lenz:icons/file_minus" { export=icon }
declare module "lenz:icons/file_minus_outline" { export=icon }
declare module "lenz:icons/file_move" { export=icon }
declare module "lenz:icons/file_move_outline" { export=icon }
declare module "lenz:icons/file_multiple" { export=icon }
declare module "lenz:icons/file_multiple_outline" { export=icon }
declare module "lenz:icons/file_music" { export=icon }
declare module "lenz:icons/file_music_outline" { export=icon }
declare module "lenz:icons/file_outline" { export=icon }
declare module "lenz:icons/file_pdf_box" { export=icon }
declare module "lenz:icons/file_percent" { export=icon }
declare module "lenz:icons/file_percent_outline" { export=icon }
declare module "lenz:icons/file_phone" { export=icon }
declare module "lenz:icons/file_phone_outline" { export=icon }
declare module "lenz:icons/file_plus" { export=icon }
declare module "lenz:icons/file_plus_outline" { export=icon }
declare module "lenz:icons/file_png_box" { export=icon }
declare module "lenz:icons/file_powerpoint" { export=icon }
declare module "lenz:icons/file_powerpoint_box" { export=icon }
declare module "lenz:icons/file_powerpoint_box_outline" { export=icon }
declare module "lenz:icons/file_powerpoint_outline" { export=icon }
declare module "lenz:icons/file_presentation_box" { export=icon }
declare module "lenz:icons/file_question" { export=icon }
declare module "lenz:icons/file_question_outline" { export=icon }
declare module "lenz:icons/file_refresh" { export=icon }
declare module "lenz:icons/file_refresh_outline" { export=icon }
declare module "lenz:icons/file_remove" { export=icon }
declare module "lenz:icons/file_remove_outline" { export=icon }
declare module "lenz:icons/file_replace" { export=icon }
declare module "lenz:icons/file_replace_outline" { export=icon }
declare module "lenz:icons/file_restore" { export=icon }
declare module "lenz:icons/file_restore_outline" { export=icon }
declare module "lenz:icons/file_rotate_left" { export=icon }
declare module "lenz:icons/file_rotate_left_outline" { export=icon }
declare module "lenz:icons/file_rotate_right" { export=icon }
declare module "lenz:icons/file_rotate_right_outline" { export=icon }
declare module "lenz:icons/file_search" { export=icon }
declare module "lenz:icons/file_search_outline" { export=icon }
declare module "lenz:icons/file_send" { export=icon }
declare module "lenz:icons/file_send_outline" { export=icon }
declare module "lenz:icons/file_settings" { export=icon }
declare module "lenz:icons/file_settings_outline" { export=icon }
declare module "lenz:icons/file_sign" { export=icon }
declare module "lenz:icons/file_star" { export=icon }
declare module "lenz:icons/file_star_four_points" { export=icon }
declare module "lenz:icons/file_star_four_points_outline" { export=icon }
declare module "lenz:icons/file_star_outline" { export=icon }
declare module "lenz:icons/file_swap" { export=icon }
declare module "lenz:icons/file_swap_outline" { export=icon }
declare module "lenz:icons/file_sync" { export=icon }
declare module "lenz:icons/file_sync_outline" { export=icon }
declare module "lenz:icons/file_table" { export=icon }
declare module "lenz:icons/file_table_box" { export=icon }
declare module "lenz:icons/file_table_box_multiple" { export=icon }
declare module "lenz:icons/file_table_box_multiple_outline" { export=icon }
declare module "lenz:icons/file_table_box_outline" { export=icon }
declare module "lenz:icons/file_table_outline" { export=icon }
declare module "lenz:icons/file_tree" { export=icon }
declare module "lenz:icons/file_tree_outline" { export=icon }
declare module "lenz:icons/file_undo" { export=icon }
declare module "lenz:icons/file_undo_outline" { export=icon }
declare module "lenz:icons/file_upload" { export=icon }
declare module "lenz:icons/file_upload_outline" { export=icon }
declare module "lenz:icons/file_video" { export=icon }
declare module "lenz:icons/file_video_outline" { export=icon }
declare module "lenz:icons/file_word" { export=icon }
declare module "lenz:icons/file_word_box" { export=icon }
declare module "lenz:icons/file_word_box_outline" { export=icon }
declare module "lenz:icons/file_word_outline" { export=icon }
declare module "lenz:icons/file_xml_box" { export=icon }
declare module "lenz:icons/film" { export=icon }
declare module "lenz:icons/filmstrip" { export=icon }
declare module "lenz:icons/filmstrip_box" { export=icon }
declare module "lenz:icons/filmstrip_box_multiple" { export=icon }
declare module "lenz:icons/filmstrip_off" { export=icon }
declare module "lenz:icons/filter" { export=icon }
declare module "lenz:icons/filter_check" { export=icon }
declare module "lenz:icons/filter_check_outline" { export=icon }
declare module "lenz:icons/filter_cog" { export=icon }
declare module "lenz:icons/filter_cog_outline" { export=icon }
declare module "lenz:icons/filter_menu" { export=icon }
declare module "lenz:icons/filter_menu_outline" { export=icon }
declare module "lenz:icons/filter_minus" { export=icon }
declare module "lenz:icons/filter_minus_outline" { export=icon }
declare module "lenz:icons/filter_multiple" { export=icon }
declare module "lenz:icons/filter_multiple_outline" { export=icon }
declare module "lenz:icons/filter_off" { export=icon }
declare module "lenz:icons/filter_off_outline" { export=icon }
declare module "lenz:icons/filter_outline" { export=icon }
declare module "lenz:icons/filter_plus" { export=icon }
declare module "lenz:icons/filter_plus_outline" { export=icon }
declare module "lenz:icons/filter_remove" { export=icon }
declare module "lenz:icons/filter_remove_outline" { export=icon }
declare module "lenz:icons/filter_settings" { export=icon }
declare module "lenz:icons/filter_settings_outline" { export=icon }
declare module "lenz:icons/filter_variant" { export=icon }
declare module "lenz:icons/filter_variant_minus" { export=icon }
declare module "lenz:icons/filter_variant_plus" { export=icon }
declare module "lenz:icons/filter_variant_remove" { export=icon }
declare module "lenz:icons/finance" { export=icon }
declare module "lenz:icons/find_replace" { export=icon }
declare module "lenz:icons/fingerprint" { export=icon }
declare module "lenz:icons/fingerprint_off" { export=icon }
declare module "lenz:icons/fire" { export=icon }
declare module "lenz:icons/fire_alert" { export=icon }
declare module "lenz:icons/fire_circle" { export=icon }
declare module "lenz:icons/fire_extinguisher" { export=icon }
declare module "lenz:icons/fire_hydrant" { export=icon }
declare module "lenz:icons/fire_hydrant_alert" { export=icon }
declare module "lenz:icons/fire_hydrant_off" { export=icon }
declare module "lenz:icons/fire_off" { export=icon }
declare module "lenz:icons/fire_station" { export=icon }
declare module "lenz:icons/fire_truck" { export=icon }
declare module "lenz:icons/firebase" { export=icon }
declare module "lenz:icons/firefox" { export=icon }
declare module "lenz:icons/fireplace" { export=icon }
declare module "lenz:icons/fireplace_off" { export=icon }
declare module "lenz:icons/firewire" { export=icon }
declare module "lenz:icons/firework" { export=icon }
declare module "lenz:icons/firework_off" { export=icon }
declare module "lenz:icons/fish" { export=icon }
declare module "lenz:icons/fish_off" { export=icon }
declare module "lenz:icons/fishbowl" { export=icon }
declare module "lenz:icons/fishbowl_outline" { export=icon }
declare module "lenz:icons/fit_to_page" { export=icon }
declare module "lenz:icons/fit_to_page_outline" { export=icon }
declare module "lenz:icons/fit_to_screen" { export=icon }
declare module "lenz:icons/fit_to_screen_outline" { export=icon }
declare module "lenz:icons/flag" { export=icon }
declare module "lenz:icons/flag_checkered" { export=icon }
declare module "lenz:icons/flag_minus" { export=icon }
declare module "lenz:icons/flag_minus_outline" { export=icon }
declare module "lenz:icons/flag_off" { export=icon }
declare module "lenz:icons/flag_off_outline" { export=icon }
declare module "lenz:icons/flag_outline" { export=icon }
declare module "lenz:icons/flag_plus" { export=icon }
declare module "lenz:icons/flag_plus_outline" { export=icon }
declare module "lenz:icons/flag_remove" { export=icon }
declare module "lenz:icons/flag_remove_outline" { export=icon }
declare module "lenz:icons/flag_triangle" { export=icon }
declare module "lenz:icons/flag_variant" { export=icon }
declare module "lenz:icons/flag_variant_minus" { export=icon }
declare module "lenz:icons/flag_variant_minus_outline" { export=icon }
declare module "lenz:icons/flag_variant_off" { export=icon }
declare module "lenz:icons/flag_variant_off_outline" { export=icon }
declare module "lenz:icons/flag_variant_outline" { export=icon }
declare module "lenz:icons/flag_variant_plus" { export=icon }
declare module "lenz:icons/flag_variant_plus_outline" { export=icon }
declare module "lenz:icons/flag_variant_remove" { export=icon }
declare module "lenz:icons/flag_variant_remove_outline" { export=icon }
declare module "lenz:icons/flare" { export=icon }
declare module "lenz:icons/flash" { export=icon }
declare module "lenz:icons/flash_alert" { export=icon }
declare module "lenz:icons/flash_alert_outline" { export=icon }
declare module "lenz:icons/flash_auto" { export=icon }
declare module "lenz:icons/flash_off" { export=icon }
declare module "lenz:icons/flash_off_outline" { export=icon }
declare module "lenz:icons/flash_outline" { export=icon }
declare module "lenz:icons/flash_red_eye" { export=icon }
declare module "lenz:icons/flash_triangle" { export=icon }
declare module "lenz:icons/flash_triangle_outline" { export=icon }
declare module "lenz:icons/flashlight" { export=icon }
declare module "lenz:icons/flashlight_off" { export=icon }
declare module "lenz:icons/flask" { export=icon }
declare module "lenz:icons/flask_empty" { export=icon }
declare module "lenz:icons/flask_empty_minus" { export=icon }
declare module "lenz:icons/flask_empty_minus_outline" { export=icon }
declare module "lenz:icons/flask_empty_off" { export=icon }
declare module "lenz:icons/flask_empty_off_outline" { export=icon }
declare module "lenz:icons/flask_empty_outline" { export=icon }
declare module "lenz:icons/flask_empty_plus" { export=icon }
declare module "lenz:icons/flask_empty_plus_outline" { export=icon }
declare module "lenz:icons/flask_empty_remove" { export=icon }
declare module "lenz:icons/flask_empty_remove_outline" { export=icon }
declare module "lenz:icons/flask_minus" { export=icon }
declare module "lenz:icons/flask_minus_outline" { export=icon }
declare module "lenz:icons/flask_off" { export=icon }
declare module "lenz:icons/flask_off_outline" { export=icon }
declare module "lenz:icons/flask_outline" { export=icon }
declare module "lenz:icons/flask_plus" { export=icon }
declare module "lenz:icons/flask_plus_outline" { export=icon }
declare module "lenz:icons/flask_remove" { export=icon }
declare module "lenz:icons/flask_remove_outline" { export=icon }
declare module "lenz:icons/flask_round_bottom" { export=icon }
declare module "lenz:icons/flask_round_bottom_empty" { export=icon }
declare module "lenz:icons/flask_round_bottom_empty_outline" { export=icon }
declare module "lenz:icons/flask_round_bottom_outline" { export=icon }
declare module "lenz:icons/fleur_de_lis" { export=icon }
declare module "lenz:icons/flip_horizontal" { export=icon }
declare module "lenz:icons/flip_to_back" { export=icon }
declare module "lenz:icons/flip_to_front" { export=icon }
declare module "lenz:icons/flip_vertical" { export=icon }
declare module "lenz:icons/floor_lamp" { export=icon }
declare module "lenz:icons/floor_lamp_dual" { export=icon }
declare module "lenz:icons/floor_lamp_dual_outline" { export=icon }
declare module "lenz:icons/floor_lamp_outline" { export=icon }
declare module "lenz:icons/floor_lamp_torchiere" { export=icon }
declare module "lenz:icons/floor_lamp_torchiere_outline" { export=icon }
declare module "lenz:icons/floor_lamp_torchiere_variant" { export=icon }
declare module "lenz:icons/floor_lamp_torchiere_variant_outline" { export=icon }
declare module "lenz:icons/floor_plan" { export=icon }
declare module "lenz:icons/floppy" { export=icon }
declare module "lenz:icons/floppy_variant" { export=icon }
declare module "lenz:icons/flower" { export=icon }
declare module "lenz:icons/flower_outline" { export=icon }
declare module "lenz:icons/flower_pollen" { export=icon }
declare module "lenz:icons/flower_pollen_outline" { export=icon }
declare module "lenz:icons/flower_poppy" { export=icon }
declare module "lenz:icons/flower_tulip" { export=icon }
declare module "lenz:icons/flower_tulip_outline" { export=icon }
declare module "lenz:icons/focus_auto" { export=icon }
declare module "lenz:icons/focus_field" { export=icon }
declare module "lenz:icons/focus_field_horizontal" { export=icon }
declare module "lenz:icons/focus_field_vertical" { export=icon }
declare module "lenz:icons/folder" { export=icon }
declare module "lenz:icons/folder_account" { export=icon }
declare module "lenz:icons/folder_account_outline" { export=icon }
declare module "lenz:icons/folder_alert" { export=icon }
declare module "lenz:icons/folder_alert_outline" { export=icon }
declare module "lenz:icons/folder_arrow_down" { export=icon }
declare module "lenz:icons/folder_arrow_down_outline" { export=icon }
declare module "lenz:icons/folder_arrow_left" { export=icon }
declare module "lenz:icons/folder_arrow_left_outline" { export=icon }
declare module "lenz:icons/folder_arrow_left_right" { export=icon }
declare module "lenz:icons/folder_arrow_left_right_outline" { export=icon }
declare module "lenz:icons/folder_arrow_right" { export=icon }
declare module "lenz:icons/folder_arrow_right_outline" { export=icon }
declare module "lenz:icons/folder_arrow_up" { export=icon }
declare module "lenz:icons/folder_arrow_up_down" { export=icon }
declare module "lenz:icons/folder_arrow_up_down_outline" { export=icon }
declare module "lenz:icons/folder_arrow_up_outline" { export=icon }
declare module "lenz:icons/folder_cancel" { export=icon }
declare module "lenz:icons/folder_cancel_outline" { export=icon }
declare module "lenz:icons/folder_check" { export=icon }
declare module "lenz:icons/folder_check_outline" { export=icon }
declare module "lenz:icons/folder_clock" { export=icon }
declare module "lenz:icons/folder_clock_outline" { export=icon }
declare module "lenz:icons/folder_cog" { export=icon }
declare module "lenz:icons/folder_cog_outline" { export=icon }
declare module "lenz:icons/folder_download" { export=icon }
declare module "lenz:icons/folder_download_outline" { export=icon }
declare module "lenz:icons/folder_edit" { export=icon }
declare module "lenz:icons/folder_edit_outline" { export=icon }
declare module "lenz:icons/folder_eye" { export=icon }
declare module "lenz:icons/folder_eye_outline" { export=icon }
declare module "lenz:icons/folder_file" { export=icon }
declare module "lenz:icons/folder_file_outline" { export=icon }
declare module "lenz:icons/folder_google_drive" { export=icon }
declare module "lenz:icons/folder_heart" { export=icon }
declare module "lenz:icons/folder_heart_outline" { export=icon }
declare module "lenz:icons/folder_hidden" { export=icon }
declare module "lenz:icons/folder_home" { export=icon }
declare module "lenz:icons/folder_home_outline" { export=icon }
declare module "lenz:icons/folder_image" { export=icon }
declare module "lenz:icons/folder_information" { export=icon }
declare module "lenz:icons/folder_information_outline" { export=icon }
declare module "lenz:icons/folder_key" { export=icon }
declare module "lenz:icons/folder_key_network" { export=icon }
declare module "lenz:icons/folder_key_network_outline" { export=icon }
declare module "lenz:icons/folder_key_outline" { export=icon }
declare module "lenz:icons/folder_lock" { export=icon }
declare module "lenz:icons/folder_lock_open" { export=icon }
declare module "lenz:icons/folder_lock_open_outline" { export=icon }
declare module "lenz:icons/folder_lock_outline" { export=icon }
declare module "lenz:icons/folder_marker" { export=icon }
declare module "lenz:icons/folder_marker_outline" { export=icon }
declare module "lenz:icons/folder_minus" { export=icon }
declare module "lenz:icons/folder_minus_outline" { export=icon }
declare module "lenz:icons/folder_move" { export=icon }
declare module "lenz:icons/folder_move_outline" { export=icon }
declare module "lenz:icons/folder_multiple" { export=icon }
declare module "lenz:icons/folder_multiple_image" { export=icon }
declare module "lenz:icons/folder_multiple_outline" { export=icon }
declare module "lenz:icons/folder_multiple_plus" { export=icon }
declare module "lenz:icons/folder_multiple_plus_outline" { export=icon }
declare module "lenz:icons/folder_music" { export=icon }
declare module "lenz:icons/folder_music_outline" { export=icon }
declare module "lenz:icons/folder_network" { export=icon }
declare module "lenz:icons/folder_network_outline" { export=icon }
declare module "lenz:icons/folder_off" { export=icon }
declare module "lenz:icons/folder_off_outline" { export=icon }
declare module "lenz:icons/folder_open" { export=icon }
declare module "lenz:icons/folder_open_outline" { export=icon }
declare module "lenz:icons/folder_outline" { export=icon }
declare module "lenz:icons/folder_play" { export=icon }
declare module "lenz:icons/folder_play_outline" { export=icon }
declare module "lenz:icons/folder_plus" { export=icon }
declare module "lenz:icons/folder_plus_outline" { export=icon }
declare module "lenz:icons/folder_pound" { export=icon }
declare module "lenz:icons/folder_pound_outline" { export=icon }
declare module "lenz:icons/folder_question" { export=icon }
declare module "lenz:icons/folder_question_outline" { export=icon }
declare module "lenz:icons/folder_refresh" { export=icon }
declare module "lenz:icons/folder_refresh_outline" { export=icon }
declare module "lenz:icons/folder_remove" { export=icon }
declare module "lenz:icons/folder_remove_outline" { export=icon }
declare module "lenz:icons/folder_search" { export=icon }
declare module "lenz:icons/folder_search_outline" { export=icon }
declare module "lenz:icons/folder_settings" { export=icon }
declare module "lenz:icons/folder_settings_outline" { export=icon }
declare module "lenz:icons/folder_star" { export=icon }
declare module "lenz:icons/folder_star_multiple" { export=icon }
declare module "lenz:icons/folder_star_multiple_outline" { export=icon }
declare module "lenz:icons/folder_star_outline" { export=icon }
declare module "lenz:icons/folder_swap" { export=icon }
declare module "lenz:icons/folder_swap_outline" { export=icon }
declare module "lenz:icons/folder_sync" { export=icon }
declare module "lenz:icons/folder_sync_outline" { export=icon }
declare module "lenz:icons/folder_table" { export=icon }
declare module "lenz:icons/folder_table_outline" { export=icon }
declare module "lenz:icons/folder_text" { export=icon }
declare module "lenz:icons/folder_text_outline" { export=icon }
declare module "lenz:icons/folder_upload" { export=icon }
declare module "lenz:icons/folder_upload_outline" { export=icon }
declare module "lenz:icons/folder_wrench" { export=icon }
declare module "lenz:icons/folder_wrench_outline" { export=icon }
declare module "lenz:icons/folder_zip" { export=icon }
declare module "lenz:icons/folder_zip_outline" { export=icon }
declare module "lenz:icons/font_awesome" { export=icon }
declare module "lenz:icons/food" { export=icon }
declare module "lenz:icons/food_apple" { export=icon }
declare module "lenz:icons/food_apple_outline" { export=icon }
declare module "lenz:icons/food_croissant" { export=icon }
declare module "lenz:icons/food_drumstick" { export=icon }
declare module "lenz:icons/food_drumstick_off" { export=icon }
declare module "lenz:icons/food_drumstick_off_outline" { export=icon }
declare module "lenz:icons/food_drumstick_outline" { export=icon }
declare module "lenz:icons/food_fork_drink" { export=icon }
declare module "lenz:icons/food_halal" { export=icon }
declare module "lenz:icons/food_hot_dog" { export=icon }
declare module "lenz:icons/food_kosher" { export=icon }
declare module "lenz:icons/food_off" { export=icon }
declare module "lenz:icons/food_off_outline" { export=icon }
declare module "lenz:icons/food_outline" { export=icon }
declare module "lenz:icons/food_steak" { export=icon }
declare module "lenz:icons/food_steak_off" { export=icon }
declare module "lenz:icons/food_takeout_box" { export=icon }
declare module "lenz:icons/food_takeout_box_outline" { export=icon }
declare module "lenz:icons/food_turkey" { export=icon }
declare module "lenz:icons/food_variant" { export=icon }
declare module "lenz:icons/food_variant_off" { export=icon }
declare module "lenz:icons/foot_print" { export=icon }
declare module "lenz:icons/football" { export=icon }
declare module "lenz:icons/football_australian" { export=icon }
declare module "lenz:icons/football_helmet" { export=icon }
declare module "lenz:icons/forest" { export=icon }
declare module "lenz:icons/forest_outline" { export=icon }
declare module "lenz:icons/forklift" { export=icon }
declare module "lenz:icons/form_dropdown" { export=icon }
declare module "lenz:icons/form_select" { export=icon }
declare module "lenz:icons/form_textarea" { export=icon }
declare module "lenz:icons/form_textbox" { export=icon }
declare module "lenz:icons/form_textbox_lock" { export=icon }
declare module "lenz:icons/form_textbox_password" { export=icon }
declare module "lenz:icons/format_align_bottom" { export=icon }
declare module "lenz:icons/format_align_center" { export=icon }
declare module "lenz:icons/format_align_justify" { export=icon }
declare module "lenz:icons/format_align_left" { export=icon }
declare module "lenz:icons/format_align_middle" { export=icon }
declare module "lenz:icons/format_align_right" { export=icon }
declare module "lenz:icons/format_align_top" { export=icon }
declare module "lenz:icons/format_annotation_minus" { export=icon }
declare module "lenz:icons/format_annotation_plus" { export=icon }
declare module "lenz:icons/format_bold" { export=icon }
declare module "lenz:icons/format_clear" { export=icon }
declare module "lenz:icons/format_color_fill" { export=icon }
declare module "lenz:icons/format_color_highlight" { export=icon }
declare module "lenz:icons/format_color_marker_cancel" { export=icon }
declare module "lenz:icons/format_color_text" { export=icon }
declare module "lenz:icons/format_columns" { export=icon }
declare module "lenz:icons/format_float_center" { export=icon }
declare module "lenz:icons/format_float_left" { export=icon }
declare module "lenz:icons/format_float_none" { export=icon }
declare module "lenz:icons/format_float_right" { export=icon }
declare module "lenz:icons/format_font" { export=icon }
declare module "lenz:icons/format_font_size_decrease" { export=icon }
declare module "lenz:icons/format_font_size_increase" { export=icon }
declare module "lenz:icons/format_header1" { export=icon }
declare module "lenz:icons/format_header2" { export=icon }
declare module "lenz:icons/format_header3" { export=icon }
declare module "lenz:icons/format_header4" { export=icon }
declare module "lenz:icons/format_header5" { export=icon }
declare module "lenz:icons/format_header6" { export=icon }
declare module "lenz:icons/format_header_decrease" { export=icon }
declare module "lenz:icons/format_header_equal" { export=icon }
declare module "lenz:icons/format_header_increase" { export=icon }
declare module "lenz:icons/format_header_pound" { export=icon }
declare module "lenz:icons/format_horizontal_align_center" { export=icon }
declare module "lenz:icons/format_horizontal_align_left" { export=icon }
declare module "lenz:icons/format_horizontal_align_right" { export=icon }
declare module "lenz:icons/format_indent_decrease" { export=icon }
declare module "lenz:icons/format_indent_increase" { export=icon }
declare module "lenz:icons/format_italic" { export=icon }
declare module "lenz:icons/format_letter_case" { export=icon }
declare module "lenz:icons/format_letter_case_lower" { export=icon }
declare module "lenz:icons/format_letter_case_upper" { export=icon }
declare module "lenz:icons/format_letter_ends_with" { export=icon }
declare module "lenz:icons/format_letter_matches" { export=icon }
declare module "lenz:icons/format_letter_spacing" { export=icon }
declare module "lenz:icons/format_letter_spacing_variant" { export=icon }
declare module "lenz:icons/format_letter_starts_with" { export=icon }
declare module "lenz:icons/format_line_height" { export=icon }
declare module "lenz:icons/format_line_spacing" { export=icon }
declare module "lenz:icons/format_line_style" { export=icon }
declare module "lenz:icons/format_line_weight" { export=icon }
declare module "lenz:icons/format_list_bulleted" { export=icon }
declare module "lenz:icons/format_list_bulleted_square" { export=icon }
declare module "lenz:icons/format_list_bulleted_triangle" { export=icon }
declare module "lenz:icons/format_list_bulleted_type" { export=icon }
declare module "lenz:icons/format_list_checkbox" { export=icon }
declare module "lenz:icons/format_list_checks" { export=icon }
declare module "lenz:icons/format_list_group" { export=icon }
declare module "lenz:icons/format_list_group_plus" { export=icon }
declare module "lenz:icons/format_list_numbered" { export=icon }
declare module "lenz:icons/format_list_numbered_rtl" { export=icon }
declare module "lenz:icons/format_list_text" { export=icon }
declare module "lenz:icons/format_overline" { export=icon }
declare module "lenz:icons/format_page_break" { export=icon }
declare module "lenz:icons/format_page_split" { export=icon }
declare module "lenz:icons/format_paint" { export=icon }
declare module "lenz:icons/format_paragraph" { export=icon }
declare module "lenz:icons/format_paragraph_spacing" { export=icon }
declare module "lenz:icons/format_pilcrow" { export=icon }
declare module "lenz:icons/format_pilcrow_arrow_left" { export=icon }
declare module "lenz:icons/format_pilcrow_arrow_right" { export=icon }
declare module "lenz:icons/format_quote_close" { export=icon }
declare module "lenz:icons/format_quote_close_outline" { export=icon }
declare module "lenz:icons/format_quote_open" { export=icon }
declare module "lenz:icons/format_quote_open_outline" { export=icon }
declare module "lenz:icons/format_rotate90" { export=icon }
declare module "lenz:icons/format_section" { export=icon }
declare module "lenz:icons/format_size" { export=icon }
declare module "lenz:icons/format_strikethrough" { export=icon }
declare module "lenz:icons/format_strikethrough_variant" { export=icon }
declare module "lenz:icons/format_subscript" { export=icon }
declare module "lenz:icons/format_superscript" { export=icon }
declare module "lenz:icons/format_text" { export=icon }
declare module "lenz:icons/format_text_rotation_angle_down" { export=icon }
declare module "lenz:icons/format_text_rotation_angle_up" { export=icon }
declare module "lenz:icons/format_text_rotation_down" { export=icon }
declare module "lenz:icons/format_text_rotation_down_vertical" { export=icon }
declare module "lenz:icons/format_text_rotation_none" { export=icon }
declare module "lenz:icons/format_text_rotation_up" { export=icon }
declare module "lenz:icons/format_text_rotation_vertical" { export=icon }
declare module "lenz:icons/format_text_variant" { export=icon }
declare module "lenz:icons/format_text_variant_outline" { export=icon }
declare module "lenz:icons/format_text_wrapping_clip" { export=icon }
declare module "lenz:icons/format_text_wrapping_overflow" { export=icon }
declare module "lenz:icons/format_text_wrapping_wrap" { export=icon }
declare module "lenz:icons/format_textbox" { export=icon }
declare module "lenz:icons/format_title" { export=icon }
declare module "lenz:icons/format_underline" { export=icon }
declare module "lenz:icons/format_underline_wavy" { export=icon }
declare module "lenz:icons/format_vertical_align_bottom" { export=icon }
declare module "lenz:icons/format_vertical_align_center" { export=icon }
declare module "lenz:icons/format_vertical_align_top" { export=icon }
declare module "lenz:icons/format_wrap_inline" { export=icon }
declare module "lenz:icons/format_wrap_square" { export=icon }
declare module "lenz:icons/format_wrap_tight" { export=icon }
declare module "lenz:icons/format_wrap_top_bottom" { export=icon }
declare module "lenz:icons/forum" { export=icon }
declare module "lenz:icons/forum_minus" { export=icon }
declare module "lenz:icons/forum_minus_outline" { export=icon }
declare module "lenz:icons/forum_outline" { export=icon }
declare module "lenz:icons/forum_plus" { export=icon }
declare module "lenz:icons/forum_plus_outline" { export=icon }
declare module "lenz:icons/forum_remove" { export=icon }
declare module "lenz:icons/forum_remove_outline" { export=icon }
declare module "lenz:icons/forward" { export=icon }
declare module "lenz:icons/forwardburger" { export=icon }
declare module "lenz:icons/fountain" { export=icon }
declare module "lenz:icons/fountain_pen" { export=icon }
declare module "lenz:icons/fountain_pen_tip" { export=icon }
declare module "lenz:icons/fraction_one_half" { export=icon }
declare module "lenz:icons/freebsd" { export=icon }
declare module "lenz:icons/french_fries" { export=icon }
declare module "lenz:icons/frequently_asked_questions" { export=icon }
declare module "lenz:icons/fridge" { export=icon }
declare module "lenz:icons/fridge_alert" { export=icon }
declare module "lenz:icons/fridge_alert_outline" { export=icon }
declare module "lenz:icons/fridge_bottom" { export=icon }
declare module "lenz:icons/fridge_industrial" { export=icon }
declare module "lenz:icons/fridge_industrial_alert" { export=icon }
declare module "lenz:icons/fridge_industrial_alert_outline" { export=icon }
declare module "lenz:icons/fridge_industrial_off" { export=icon }
declare module "lenz:icons/fridge_industrial_off_outline" { export=icon }
declare module "lenz:icons/fridge_industrial_outline" { export=icon }
declare module "lenz:icons/fridge_off" { export=icon }
declare module "lenz:icons/fridge_off_outline" { export=icon }
declare module "lenz:icons/fridge_outline" { export=icon }
declare module "lenz:icons/fridge_top" { export=icon }
declare module "lenz:icons/fridge_variant" { export=icon }
declare module "lenz:icons/fridge_variant_alert" { export=icon }
declare module "lenz:icons/fridge_variant_alert_outline" { export=icon }
declare module "lenz:icons/fridge_variant_off" { export=icon }
declare module "lenz:icons/fridge_variant_off_outline" { export=icon }
declare module "lenz:icons/fridge_variant_outline" { export=icon }
declare module "lenz:icons/fruit_cherries" { export=icon }
declare module "lenz:icons/fruit_cherries_off" { export=icon }
declare module "lenz:icons/fruit_citrus" { export=icon }
declare module "lenz:icons/fruit_citrus_off" { export=icon }
declare module "lenz:icons/fruit_grapes" { export=icon }
declare module "lenz:icons/fruit_grapes_outline" { export=icon }
declare module "lenz:icons/fruit_pear" { export=icon }
declare module "lenz:icons/fruit_pineapple" { export=icon }
declare module "lenz:icons/fruit_watermelon" { export=icon }
declare module "lenz:icons/fuel" { export=icon }
declare module "lenz:icons/fuel_cell" { export=icon }
declare module "lenz:icons/fullscreen" { export=icon }
declare module "lenz:icons/fullscreen_exit" { export=icon }
declare module "lenz:icons/function" { export=icon }
declare module "lenz:icons/function_variant" { export=icon }
declare module "lenz:icons/furigana_horizontal" { export=icon }
declare module "lenz:icons/furigana_vertical" { export=icon }
declare module "lenz:icons/fuse" { export=icon }
declare module "lenz:icons/fuse_alert" { export=icon }
declare module "lenz:icons/fuse_blade" { export=icon }
declare module "lenz:icons/fuse_off" { export=icon }
declare module "lenz:icons/gamepad" { export=icon }
declare module "lenz:icons/gamepad_circle" { export=icon }
declare module "lenz:icons/gamepad_circle_down" { export=icon }
declare module "lenz:icons/gamepad_circle_left" { export=icon }
declare module "lenz:icons/gamepad_circle_outline" { export=icon }
declare module "lenz:icons/gamepad_circle_right" { export=icon }
declare module "lenz:icons/gamepad_circle_up" { export=icon }
declare module "lenz:icons/gamepad_down" { export=icon }
declare module "lenz:icons/gamepad_left" { export=icon }
declare module "lenz:icons/gamepad_outline" { export=icon }
declare module "lenz:icons/gamepad_right" { export=icon }
declare module "lenz:icons/gamepad_round" { export=icon }
declare module "lenz:icons/gamepad_round_down" { export=icon }
declare module "lenz:icons/gamepad_round_left" { export=icon }
declare module "lenz:icons/gamepad_round_outline" { export=icon }
declare module "lenz:icons/gamepad_round_right" { export=icon }
declare module "lenz:icons/gamepad_round_up" { export=icon }
declare module "lenz:icons/gamepad_square" { export=icon }
declare module "lenz:icons/gamepad_square_outline" { export=icon }
declare module "lenz:icons/gamepad_up" { export=icon }
declare module "lenz:icons/gamepad_variant" { export=icon }
declare module "lenz:icons/gamepad_variant_outline" { export=icon }
declare module "lenz:icons/gamma" { export=icon }
declare module "lenz:icons/gantry_crane" { export=icon }
declare module "lenz:icons/garage" { export=icon }
declare module "lenz:icons/garage_alert" { export=icon }
declare module "lenz:icons/garage_alert_variant" { export=icon }
declare module "lenz:icons/garage_lock" { export=icon }
declare module "lenz:icons/garage_open" { export=icon }
declare module "lenz:icons/garage_open_variant" { export=icon }
declare module "lenz:icons/garage_variant" { export=icon }
declare module "lenz:icons/garage_variant_lock" { export=icon }
declare module "lenz:icons/gas_burner" { export=icon }
declare module "lenz:icons/gas_cylinder" { export=icon }
declare module "lenz:icons/gas_station" { export=icon }
declare module "lenz:icons/gas_station_in_use" { export=icon }
declare module "lenz:icons/gas_station_in_use_outline" { export=icon }
declare module "lenz:icons/gas_station_off" { export=icon }
declare module "lenz:icons/gas_station_off_outline" { export=icon }
declare module "lenz:icons/gas_station_outline" { export=icon }
declare module "lenz:icons/gate" { export=icon }
declare module "lenz:icons/gate_alert" { export=icon }
declare module "lenz:icons/gate_and" { export=icon }
declare module "lenz:icons/gate_arrow_left" { export=icon }
declare module "lenz:icons/gate_arrow_right" { export=icon }
declare module "lenz:icons/gate_buffer" { export=icon }
declare module "lenz:icons/gate_nand" { export=icon }
declare module "lenz:icons/gate_nor" { export=icon }
declare module "lenz:icons/gate_not" { export=icon }
declare module "lenz:icons/gate_open" { export=icon }
declare module "lenz:icons/gate_or" { export=icon }
declare module "lenz:icons/gate_xnor" { export=icon }
declare module "lenz:icons/gate_xor" { export=icon }
declare module "lenz:icons/gatsby" { export=icon }
declare module "lenz:icons/gauge" { export=icon }
declare module "lenz:icons/gauge_empty" { export=icon }
declare module "lenz:icons/gauge_full" { export=icon }
declare module "lenz:icons/gauge_low" { export=icon }
declare module "lenz:icons/gavel" { export=icon }
declare module "lenz:icons/gender_female" { export=icon }
declare module "lenz:icons/gender_male" { export=icon }
declare module "lenz:icons/gender_male_female" { export=icon }
declare module "lenz:icons/gender_male_female_variant" { export=icon }
declare module "lenz:icons/gender_non_binary" { export=icon }
declare module "lenz:icons/gender_transgender" { export=icon }
declare module "lenz:icons/generator_mobile" { export=icon }
declare module "lenz:icons/generator_portable" { export=icon }
declare module "lenz:icons/generator_stationary" { export=icon }
declare module "lenz:icons/gentoo" { export=icon }
declare module "lenz:icons/gesture" { export=icon }
declare module "lenz:icons/gesture_double_tap" { export=icon }
declare module "lenz:icons/gesture_pinch" { export=icon }
declare module "lenz:icons/gesture_spread" { export=icon }
declare module "lenz:icons/gesture_swipe" { export=icon }
declare module "lenz:icons/gesture_swipe_down" { export=icon }
declare module "lenz:icons/gesture_swipe_horizontal" { export=icon }
declare module "lenz:icons/gesture_swipe_left" { export=icon }
declare module "lenz:icons/gesture_swipe_right" { export=icon }
declare module "lenz:icons/gesture_swipe_up" { export=icon }
declare module "lenz:icons/gesture_swipe_vertical" { export=icon }
declare module "lenz:icons/gesture_tap" { export=icon }
declare module "lenz:icons/gesture_tap_box" { export=icon }
declare module "lenz:icons/gesture_tap_button" { export=icon }
declare module "lenz:icons/gesture_tap_hold" { export=icon }
declare module "lenz:icons/gesture_two_double_tap" { export=icon }
declare module "lenz:icons/gesture_two_tap" { export=icon }
declare module "lenz:icons/ghost" { export=icon }
declare module "lenz:icons/ghost_off" { export=icon }
declare module "lenz:icons/ghost_off_outline" { export=icon }
declare module "lenz:icons/ghost_outline" { export=icon }
declare module "lenz:icons/gift" { export=icon }
declare module "lenz:icons/gift_off" { export=icon }
declare module "lenz:icons/gift_off_outline" { export=icon }
declare module "lenz:icons/gift_open" { export=icon }
declare module "lenz:icons/gift_open_outline" { export=icon }
declare module "lenz:icons/gift_outline" { export=icon }
declare module "lenz:icons/git" { export=icon }
declare module "lenz:icons/github" { export=icon }
declare module "lenz:icons/gitlab" { export=icon }
declare module "lenz:icons/glass_cocktail" { export=icon }
declare module "lenz:icons/glass_cocktail_off" { export=icon }
declare module "lenz:icons/glass_flute" { export=icon }
declare module "lenz:icons/glass_fragile" { export=icon }
declare module "lenz:icons/glass_mug" { export=icon }
declare module "lenz:icons/glass_mug_off" { export=icon }
declare module "lenz:icons/glass_mug_variant" { export=icon }
declare module "lenz:icons/glass_mug_variant_off" { export=icon }
declare module "lenz:icons/glass_pint_outline" { export=icon }
declare module "lenz:icons/glass_stange" { export=icon }
declare module "lenz:icons/glass_tulip" { export=icon }
declare module "lenz:icons/glass_wine" { export=icon }
declare module "lenz:icons/glasses" { export=icon }
declare module "lenz:icons/globe_light" { export=icon }
declare module "lenz:icons/globe_light_outline" { export=icon }
declare module "lenz:icons/globe_model" { export=icon }
declare module "lenz:icons/gmail" { export=icon }
declare module "lenz:icons/gnome" { export=icon }
declare module "lenz:icons/go_kart" { export=icon }
declare module "lenz:icons/go_kart_track" { export=icon }
declare module "lenz:icons/gog" { export=icon }
declare module "lenz:icons/gold" { export=icon }
declare module "lenz:icons/golf" { export=icon }
declare module "lenz:icons/golf_cart" { export=icon }
declare module "lenz:icons/golf_tee" { export=icon }
declare module "lenz:icons/gondola" { export=icon }
declare module "lenz:icons/goodreads" { export=icon }
declare module "lenz:icons/google" { export=icon }
declare module "lenz:icons/google_ads" { export=icon }
declare module "lenz:icons/google_analytics" { export=icon }
declare module "lenz:icons/google_assistant" { export=icon }
declare module "lenz:icons/google_cardboard" { export=icon }
declare module "lenz:icons/google_chrome" { export=icon }
declare module "lenz:icons/google_circles" { export=icon }
declare module "lenz:icons/google_circles_communities" { export=icon }
declare module "lenz:icons/google_circles_extended" { export=icon }
declare module "lenz:icons/google_circles_group" { export=icon }
declare module "lenz:icons/google_classroom" { export=icon }
declare module "lenz:icons/google_cloud" { export=icon }
declare module "lenz:icons/google_downasaur" { export=icon }
declare module "lenz:icons/google_drive" { export=icon }
declare module "lenz:icons/google_earth" { export=icon }
declare module "lenz:icons/google_fit" { export=icon }
declare module "lenz:icons/google_glass" { export=icon }
declare module "lenz:icons/google_hangouts" { export=icon }
declare module "lenz:icons/google_keep" { export=icon }
declare module "lenz:icons/google_lens" { export=icon }
declare module "lenz:icons/google_maps" { export=icon }
declare module "lenz:icons/google_my_business" { export=icon }
declare module "lenz:icons/google_nearby" { export=icon }
declare module "lenz:icons/google_play" { export=icon }
declare module "lenz:icons/google_plus" { export=icon }
declare module "lenz:icons/google_podcast" { export=icon }
declare module "lenz:icons/google_spreadsheet" { export=icon }
declare module "lenz:icons/google_street_view" { export=icon }
declare module "lenz:icons/google_translate" { export=icon }
declare module "lenz:icons/gradient_horizontal" { export=icon }
declare module "lenz:icons/gradient_vertical" { export=icon }
declare module "lenz:icons/grain" { export=icon }
declare module "lenz:icons/graph" { export=icon }
declare module "lenz:icons/graph_outline" { export=icon }
declare module "lenz:icons/graphql" { export=icon }
declare module "lenz:icons/grass" { export=icon }
declare module "lenz:icons/grave_stone" { export=icon }
declare module "lenz:icons/grease_pencil" { export=icon }
declare module "lenz:icons/greater_than" { export=icon }
declare module "lenz:icons/greater_than_or_equal" { export=icon }
declare module "lenz:icons/greenhouse" { export=icon }
declare module "lenz:icons/grid" { export=icon }
declare module "lenz:icons/grid_large" { export=icon }
declare module "lenz:icons/grid_off" { export=icon }
declare module "lenz:icons/grill" { export=icon }
declare module "lenz:icons/grill_outline" { export=icon }
declare module "lenz:icons/group" { export=icon }
declare module "lenz:icons/guitar_acoustic" { export=icon }
declare module "lenz:icons/guitar_electric" { export=icon }
declare module "lenz:icons/guitar_pick" { export=icon }
declare module "lenz:icons/guitar_pick_outline" { export=icon }
declare module "lenz:icons/guy_fawkes_mask" { export=icon }
declare module "lenz:icons/gymnastics" { export=icon }
declare module "lenz:icons/hail" { export=icon }
declare module "lenz:icons/hair_dryer" { export=icon }
declare module "lenz:icons/hair_dryer_outline" { export=icon }
declare module "lenz:icons/halloween" { export=icon }
declare module "lenz:icons/hamburger" { export=icon }
declare module "lenz:icons/hamburger_check" { export=icon }
declare module "lenz:icons/hamburger_minus" { export=icon }
declare module "lenz:icons/hamburger_off" { export=icon }
declare module "lenz:icons/hamburger_plus" { export=icon }
declare module "lenz:icons/hamburger_remove" { export=icon }
declare module "lenz:icons/hammer" { export=icon }
declare module "lenz:icons/hammer_screwdriver" { export=icon }
declare module "lenz:icons/hammer_sickle" { export=icon }
declare module "lenz:icons/hammer_wrench" { export=icon }
declare module "lenz:icons/hand_back_left" { export=icon }
declare module "lenz:icons/hand_back_left_off" { export=icon }
declare module "lenz:icons/hand_back_left_off_outline" { export=icon }
declare module "lenz:icons/hand_back_left_outline" { export=icon }
declare module "lenz:icons/hand_back_right" { export=icon }
declare module "lenz:icons/hand_back_right_off" { export=icon }
declare module "lenz:icons/hand_back_right_off_outline" { export=icon }
declare module "lenz:icons/hand_back_right_outline" { export=icon }
declare module "lenz:icons/hand_clap" { export=icon }
declare module "lenz:icons/hand_clap_off" { export=icon }
declare module "lenz:icons/hand_coin" { export=icon }
declare module "lenz:icons/hand_coin_outline" { export=icon }
declare module "lenz:icons/hand_cycle" { export=icon }
declare module "lenz:icons/hand_extended" { export=icon }
declare module "lenz:icons/hand_extended_outline" { export=icon }
declare module "lenz:icons/hand_front_left" { export=icon }
declare module "lenz:icons/hand_front_left_outline" { export=icon }
declare module "lenz:icons/hand_front_right" { export=icon }
declare module "lenz:icons/hand_front_right_outline" { export=icon }
declare module "lenz:icons/hand_heart" { export=icon }
declare module "lenz:icons/hand_heart_outline" { export=icon }
declare module "lenz:icons/hand_okay" { export=icon }
declare module "lenz:icons/hand_peace" { export=icon }
declare module "lenz:icons/hand_peace_variant" { export=icon }
declare module "lenz:icons/hand_pointing_down" { export=icon }
declare module "lenz:icons/hand_pointing_left" { export=icon }
declare module "lenz:icons/hand_pointing_right" { export=icon }
declare module "lenz:icons/hand_pointing_up" { export=icon }
declare module "lenz:icons/hand_saw" { export=icon }
declare module "lenz:icons/hand_wash" { export=icon }
declare module "lenz:icons/hand_wash_outline" { export=icon }
declare module "lenz:icons/hand_water" { export=icon }
declare module "lenz:icons/hand_wave" { export=icon }
declare module "lenz:icons/hand_wave_outline" { export=icon }
declare module "lenz:icons/handball" { export=icon }
declare module "lenz:icons/handcuffs" { export=icon }
declare module "lenz:icons/hands_pray" { export=icon }
declare module "lenz:icons/handshake" { export=icon }
declare module "lenz:icons/handshake_outline" { export=icon }
declare module "lenz:icons/hanger" { export=icon }
declare module "lenz:icons/hard_hat" { export=icon }
declare module "lenz:icons/harddisk" { export=icon }
declare module "lenz:icons/harddisk_plus" { export=icon }
declare module "lenz:icons/harddisk_remove" { export=icon }
declare module "lenz:icons/hat_fedora" { export=icon }
declare module "lenz:icons/hazard_lights" { export=icon }
declare module "lenz:icons/hdmi_port" { export=icon }
declare module "lenz:icons/hdr" { export=icon }
declare module "lenz:icons/hdr_off" { export=icon }
declare module "lenz:icons/head" { export=icon }
declare module "lenz:icons/head_alert" { export=icon }
declare module "lenz:icons/head_alert_outline" { export=icon }
declare module "lenz:icons/head_check" { export=icon }
declare module "lenz:icons/head_check_outline" { export=icon }
declare module "lenz:icons/head_cog" { export=icon }
declare module "lenz:icons/head_cog_outline" { export=icon }
declare module "lenz:icons/head_dots_horizontal" { export=icon }
declare module "lenz:icons/head_dots_horizontal_outline" { export=icon }
declare module "lenz:icons/head_flash" { export=icon }
declare module "lenz:icons/head_flash_outline" { export=icon }
declare module "lenz:icons/head_heart" { export=icon }
declare module "lenz:icons/head_heart_outline" { export=icon }
declare module "lenz:icons/head_lightbulb" { export=icon }
declare module "lenz:icons/head_lightbulb_outline" { export=icon }
declare module "lenz:icons/head_minus" { export=icon }
declare module "lenz:icons/head_minus_outline" { export=icon }
declare module "lenz:icons/head_outline" { export=icon }
declare module "lenz:icons/head_plus" { export=icon }
declare module "lenz:icons/head_plus_outline" { export=icon }
declare module "lenz:icons/head_question" { export=icon }
declare module "lenz:icons/head_question_outline" { export=icon }
declare module "lenz:icons/head_remove" { export=icon }
declare module "lenz:icons/head_remove_outline" { export=icon }
declare module "lenz:icons/head_snowflake" { export=icon }
declare module "lenz:icons/head_snowflake_outline" { export=icon }
declare module "lenz:icons/head_sync" { export=icon }
declare module "lenz:icons/head_sync_outline" { export=icon }
declare module "lenz:icons/headphones" { export=icon }
declare module "lenz:icons/headphones_bluetooth" { export=icon }
declare module "lenz:icons/headphones_box" { export=icon }
declare module "lenz:icons/headphones_off" { export=icon }
declare module "lenz:icons/headphones_settings" { export=icon }
declare module "lenz:icons/headset" { export=icon }
declare module "lenz:icons/headset_dock" { export=icon }
declare module "lenz:icons/headset_off" { export=icon }
declare module "lenz:icons/heart" { export=icon }
declare module "lenz:icons/heart_box" { export=icon }
declare module "lenz:icons/heart_box_outline" { export=icon }
declare module "lenz:icons/heart_broken" { export=icon }
declare module "lenz:icons/heart_broken_outline" { export=icon }
declare module "lenz:icons/heart_circle" { export=icon }
declare module "lenz:icons/heart_circle_outline" { export=icon }
declare module "lenz:icons/heart_cog" { export=icon }
declare module "lenz:icons/heart_cog_outline" { export=icon }
declare module "lenz:icons/heart_flash" { export=icon }
declare module "lenz:icons/heart_half" { export=icon }
declare module "lenz:icons/heart_half_full" { export=icon }
declare module "lenz:icons/heart_half_outline" { export=icon }
declare module "lenz:icons/heart_minus" { export=icon }
declare module "lenz:icons/heart_minus_outline" { export=icon }
declare module "lenz:icons/heart_multiple" { export=icon }
declare module "lenz:icons/heart_multiple_outline" { export=icon }
declare module "lenz:icons/heart_off" { export=icon }
declare module "lenz:icons/heart_off_outline" { export=icon }
declare module "lenz:icons/heart_outline" { export=icon }
declare module "lenz:icons/heart_plus" { export=icon }
declare module "lenz:icons/heart_plus_outline" { export=icon }
declare module "lenz:icons/heart_pulse" { export=icon }
declare module "lenz:icons/heart_remove" { export=icon }
declare module "lenz:icons/heart_remove_outline" { export=icon }
declare module "lenz:icons/heart_search" { export=icon }
declare module "lenz:icons/heart_settings" { export=icon }
declare module "lenz:icons/heart_settings_outline" { export=icon }
declare module "lenz:icons/heat_pump" { export=icon }
declare module "lenz:icons/heat_pump_outline" { export=icon }
declare module "lenz:icons/heat_wave" { export=icon }
declare module "lenz:icons/heating_coil" { export=icon }
declare module "lenz:icons/helicopter" { export=icon }
declare module "lenz:icons/help" { export=icon }
declare module "lenz:icons/help_box" { export=icon }
declare module "lenz:icons/help_box_multiple" { export=icon }
declare module "lenz:icons/help_box_multiple_outline" { export=icon }
declare module "lenz:icons/help_box_outline" { export=icon }
declare module "lenz:icons/help_circle" { export=icon }
declare module "lenz:icons/help_circle_outline" { export=icon }
declare module "lenz:icons/help_network" { export=icon }
declare module "lenz:icons/help_network_outline" { export=icon }
declare module "lenz:icons/help_rhombus" { export=icon }
declare module "lenz:icons/help_rhombus_outline" { export=icon }
declare module "lenz:icons/hexadecimal" { export=icon }
declare module "lenz:icons/hexagon" { export=icon }
declare module "lenz:icons/hexagon_multiple" { export=icon }
declare module "lenz:icons/hexagon_multiple_outline" { export=icon }
declare module "lenz:icons/hexagon_outline" { export=icon }
declare module "lenz:icons/hexagon_slice1" { export=icon }
declare module "lenz:icons/hexagon_slice2" { export=icon }
declare module "lenz:icons/hexagon_slice3" { export=icon }
declare module "lenz:icons/hexagon_slice4" { export=icon }
declare module "lenz:icons/hexagon_slice5" { export=icon }
declare module "lenz:icons/hexagon_slice6" { export=icon }
declare module "lenz:icons/hexagram" { export=icon }
declare module "lenz:icons/hexagram_outline" { export=icon }
declare module "lenz:icons/high_definition" { export=icon }
declare module "lenz:icons/high_definition_box" { export=icon }
declare module "lenz:icons/highway" { export=icon }
declare module "lenz:icons/hiking" { export=icon }
declare module "lenz:icons/history" { export=icon }
declare module "lenz:icons/hockey_puck" { export=icon }
declare module "lenz:icons/hockey_sticks" { export=icon }
declare module "lenz:icons/hololens" { export=icon }
declare module "lenz:icons/home" { export=icon }
declare module "lenz:icons/home_account" { export=icon }
declare module "lenz:icons/home_alert" { export=icon }
declare module "lenz:icons/home_alert_outline" { export=icon }
declare module "lenz:icons/home_analytics" { export=icon }
declare module "lenz:icons/home_assistant" { export=icon }
declare module "lenz:icons/home_automation" { export=icon }
declare module "lenz:icons/home_battery" { export=icon }
declare module "lenz:icons/home_battery_outline" { export=icon }
declare module "lenz:icons/home_circle" { export=icon }
declare module "lenz:icons/home_circle_outline" { export=icon }
declare module "lenz:icons/home_city" { export=icon }
declare module "lenz:icons/home_city_outline" { export=icon }
declare module "lenz:icons/home_clock" { export=icon }
declare module "lenz:icons/home_clock_outline" { export=icon }
declare module "lenz:icons/home_edit" { export=icon }
declare module "lenz:icons/home_edit_outline" { export=icon }
declare module "lenz:icons/home_export_outline" { export=icon }
declare module "lenz:icons/home_flood" { export=icon }
declare module "lenz:icons/home_floor0" { export=icon }
declare module "lenz:icons/home_floor1" { export=icon }
declare module "lenz:icons/home_floor2" { export=icon }
declare module "lenz:icons/home_floor3" { export=icon }
declare module "lenz:icons/home_floor_a" { export=icon }
declare module "lenz:icons/home_floor_b" { export=icon }
declare module "lenz:icons/home_floor_g" { export=icon }
declare module "lenz:icons/home_floor_l" { export=icon }
declare module "lenz:icons/home_floor_negative1" { export=icon }
declare module "lenz:icons/home_group" { export=icon }
declare module "lenz:icons/home_group_minus" { export=icon }
declare module "lenz:icons/home_group_plus" { export=icon }
declare module "lenz:icons/home_group_remove" { export=icon }
declare module "lenz:icons/home_heart" { export=icon }
declare module "lenz:icons/home_import_outline" { export=icon }
declare module "lenz:icons/home_lightbulb" { export=icon }
declare module "lenz:icons/home_lightbulb_outline" { export=icon }
declare module "lenz:icons/home_lightning_bolt" { export=icon }
declare module "lenz:icons/home_lightning_bolt_outline" { export=icon }
declare module "lenz:icons/home_lock" { export=icon }
declare module "lenz:icons/home_lock_open" { export=icon }
declare module "lenz:icons/home_map_marker" { export=icon }
declare module "lenz:icons/home_minus" { export=icon }
declare module "lenz:icons/home_minus_outline" { export=icon }
declare module "lenz:icons/home_modern" { export=icon }
declare module "lenz:icons/home_off" { export=icon }
declare module "lenz:icons/home_off_outline" { export=icon }
declare module "lenz:icons/home_outline" { export=icon }
declare module "lenz:icons/home_percent" { export=icon }
declare module "lenz:icons/home_percent_outline" { export=icon }
declare module "lenz:icons/home_plus" { export=icon }
declare module "lenz:icons/home_plus_outline" { export=icon }
declare module "lenz:icons/home_remove" { export=icon }
declare module "lenz:icons/home_remove_outline" { export=icon }
declare module "lenz:icons/home_roof" { export=icon }
declare module "lenz:icons/home_search" { export=icon }
declare module "lenz:icons/home_search_outline" { export=icon }
declare module "lenz:icons/home_silo" { export=icon }
declare module "lenz:icons/home_silo_outline" { export=icon }
declare module "lenz:icons/home_sound_in" { export=icon }
declare module "lenz:icons/home_sound_in_outline" { export=icon }
declare module "lenz:icons/home_sound_out" { export=icon }
declare module "lenz:icons/home_sound_out_outline" { export=icon }
declare module "lenz:icons/home_switch" { export=icon }
declare module "lenz:icons/home_switch_outline" { export=icon }
declare module "lenz:icons/home_thermometer" { export=icon }
declare module "lenz:icons/home_thermometer_outline" { export=icon }
declare module "lenz:icons/home_variant" { export=icon }
declare module "lenz:icons/home_variant_outline" { export=icon }
declare module "lenz:icons/hook" { export=icon }
declare module "lenz:icons/hook_off" { export=icon }
declare module "lenz:icons/hoop_house" { export=icon }
declare module "lenz:icons/hops" { export=icon }
declare module "lenz:icons/horizontal_rotate_clockwise" { export=icon }
declare module "lenz:icons/horizontal_rotate_counterclockwise" { export=icon }
declare module "lenz:icons/horse" { export=icon }
declare module "lenz:icons/horse_human" { export=icon }
declare module "lenz:icons/horse_variant" { export=icon }
declare module "lenz:icons/horse_variant_fast" { export=icon }
declare module "lenz:icons/horseshoe" { export=icon }
declare module "lenz:icons/hospital" { export=icon }
declare module "lenz:icons/hospital_box" { export=icon }
declare module "lenz:icons/hospital_box_outline" { export=icon }
declare module "lenz:icons/hospital_building" { export=icon }
declare module "lenz:icons/hospital_marker" { export=icon }
declare module "lenz:icons/hot_tub" { export=icon }
declare module "lenz:icons/hours12" { export=icon }
declare module "lenz:icons/hours24" { export=icon }
declare module "lenz:icons/hub" { export=icon }
declare module "lenz:icons/hub_outline" { export=icon }
declare module "lenz:icons/hubspot" { export=icon }
declare module "lenz:icons/hulu" { export=icon }
declare module "lenz:icons/human" { export=icon }
declare module "lenz:icons/human_baby_changing_table" { export=icon }
declare module "lenz:icons/human_cane" { export=icon }
declare module "lenz:icons/human_capacity_decrease" { export=icon }
declare module "lenz:icons/human_capacity_increase" { export=icon }
declare module "lenz:icons/human_child" { export=icon }
declare module "lenz:icons/human_dolly" { export=icon }
declare module "lenz:icons/human_edit" { export=icon }
declare module "lenz:icons/human_female" { export=icon }
declare module "lenz:icons/human_female_boy" { export=icon }
declare module "lenz:icons/human_female_dance" { export=icon }
declare module "lenz:icons/human_female_female" { export=icon }
declare module "lenz:icons/human_female_female_child" { export=icon }
declare module "lenz:icons/human_female_girl" { export=icon }
declare module "lenz:icons/human_greeting" { export=icon }
declare module "lenz:icons/human_greeting_proximity" { export=icon }
declare module "lenz:icons/human_greeting_variant" { export=icon }
declare module "lenz:icons/human_handsdown" { export=icon }
declare module "lenz:icons/human_handsup" { export=icon }
declare module "lenz:icons/human_male" { export=icon }
declare module "lenz:icons/human_male_board" { export=icon }
declare module "lenz:icons/human_male_board_poll" { export=icon }
declare module "lenz:icons/human_male_boy" { export=icon }
declare module "lenz:icons/human_male_child" { export=icon }
declare module "lenz:icons/human_male_female" { export=icon }
declare module "lenz:icons/human_male_female_child" { export=icon }
declare module "lenz:icons/human_male_girl" { export=icon }
declare module "lenz:icons/human_male_height" { export=icon }
declare module "lenz:icons/human_male_height_variant" { export=icon }
declare module "lenz:icons/human_male_male" { export=icon }
declare module "lenz:icons/human_male_male_child" { export=icon }
declare module "lenz:icons/human_non_binary" { export=icon }
declare module "lenz:icons/human_pregnant" { export=icon }
declare module "lenz:icons/human_queue" { export=icon }
declare module "lenz:icons/human_scooter" { export=icon }
declare module "lenz:icons/human_walker" { export=icon }
declare module "lenz:icons/human_wheelchair" { export=icon }
declare module "lenz:icons/human_white_cane" { export=icon }
declare module "lenz:icons/humble_bundle" { export=icon }
declare module "lenz:icons/hvac" { export=icon }
declare module "lenz:icons/hvac_off" { export=icon }
declare module "lenz:icons/hydraulic_oil_level" { export=icon }
declare module "lenz:icons/hydraulic_oil_temperature" { export=icon }
declare module "lenz:icons/hydro_power" { export=icon }
declare module "lenz:icons/hydrogen_station" { export=icon }
declare module "lenz:icons/ice_cream" { export=icon }
declare module "lenz:icons/ice_cream_off" { export=icon }
declare module "lenz:icons/ice_pop" { export=icon }
declare module "lenz:icons/id_card" { export=icon }
declare module "lenz:icons/identifier" { export=icon }
declare module "lenz:icons/ideogram_cjk" { export=icon }
declare module "lenz:icons/ideogram_cjk_variant" { export=icon }
declare module "lenz:icons/image" { export=icon }
declare module "lenz:icons/image_album" { export=icon }
declare module "lenz:icons/image_area" { export=icon }
declare module "lenz:icons/image_area_close" { export=icon }
declare module "lenz:icons/image_auto_adjust" { export=icon }
declare module "lenz:icons/image_broken" { export=icon }
declare module "lenz:icons/image_broken_variant" { export=icon }
declare module "lenz:icons/image_check" { export=icon }
declare module "lenz:icons/image_check_outline" { export=icon }
declare module "lenz:icons/image_edit" { export=icon }
declare module "lenz:icons/image_edit_outline" { export=icon }
declare module "lenz:icons/image_filter_black_white" { export=icon }
declare module "lenz:icons/image_filter_center_focus" { export=icon }
declare module "lenz:icons/image_filter_center_focus_strong" { export=icon }
declare module "lenz:icons/image_filter_center_focus_strong_outline" { export=icon }
declare module "lenz:icons/image_filter_center_focus_weak" { export=icon }
declare module "lenz:icons/image_filter_drama" { export=icon }
declare module "lenz:icons/image_filter_drama_outline" { export=icon }
declare module "lenz:icons/image_filter_frames" { export=icon }
declare module "lenz:icons/image_filter_hdr" { export=icon }
declare module "lenz:icons/image_filter_hdr_outline" { export=icon }
declare module "lenz:icons/image_filter_none" { export=icon }
declare module "lenz:icons/image_filter_tilt_shift" { export=icon }
declare module "lenz:icons/image_filter_vintage" { export=icon }
declare module "lenz:icons/image_frame" { export=icon }
declare module "lenz:icons/image_lock" { export=icon }
declare module "lenz:icons/image_lock_outline" { export=icon }
declare module "lenz:icons/image_marker" { export=icon }
declare module "lenz:icons/image_marker_outline" { export=icon }
declare module "lenz:icons/image_minus" { export=icon }
declare module "lenz:icons/image_minus_outline" { export=icon }
declare module "lenz:icons/image_move" { export=icon }
declare module "lenz:icons/image_multiple" { export=icon }
declare module "lenz:icons/image_multiple_outline" { export=icon }
declare module "lenz:icons/image_off" { export=icon }
declare module "lenz:icons/image_off_outline" { export=icon }
declare module "lenz:icons/image_outline" { export=icon }
declare module "lenz:icons/image_plus" { export=icon }
declare module "lenz:icons/image_plus_outline" { export=icon }
declare module "lenz:icons/image_refresh" { export=icon }
declare module "lenz:icons/image_refresh_outline" { export=icon }
declare module "lenz:icons/image_remove" { export=icon }
declare module "lenz:icons/image_remove_outline" { export=icon }
declare module "lenz:icons/image_search" { export=icon }
declare module "lenz:icons/image_search_outline" { export=icon }
declare module "lenz:icons/image_size_select_actual" { export=icon }
declare module "lenz:icons/image_size_select_large" { export=icon }
declare module "lenz:icons/image_size_select_small" { export=icon }
declare module "lenz:icons/image_sync" { export=icon }
declare module "lenz:icons/image_sync_outline" { export=icon }
declare module "lenz:icons/image_text" { export=icon }
declare module "lenz:icons/import" { export=icon }
declare module "lenz:icons/inbox" { export=icon }
declare module "lenz:icons/inbox_arrow_down" { export=icon }
declare module "lenz:icons/inbox_arrow_down_outline" { export=icon }
declare module "lenz:icons/inbox_arrow_up" { export=icon }
declare module "lenz:icons/inbox_arrow_up_outline" { export=icon }
declare module "lenz:icons/inbox_full" { export=icon }
declare module "lenz:icons/inbox_full_outline" { export=icon }
declare module "lenz:icons/inbox_multiple" { export=icon }
declare module "lenz:icons/inbox_multiple_outline" { export=icon }
declare module "lenz:icons/inbox_outline" { export=icon }
declare module "lenz:icons/inbox_remove" { export=icon }
declare module "lenz:icons/inbox_remove_outline" { export=icon }
declare module "lenz:icons/incognito" { export=icon }
declare module "lenz:icons/incognito_circle" { export=icon }
declare module "lenz:icons/incognito_circle_off" { export=icon }
declare module "lenz:icons/incognito_off" { export=icon }
declare module "lenz:icons/induction" { export=icon }
declare module "lenz:icons/infinity" { export=icon }
declare module "lenz:icons/information" { export=icon }
declare module "lenz:icons/information_box" { export=icon }
declare module "lenz:icons/information_box_outline" { export=icon }
declare module "lenz:icons/information_off" { export=icon }
declare module "lenz:icons/information_off_outline" { export=icon }
declare module "lenz:icons/information_outline" { export=icon }
declare module "lenz:icons/information_slab_box" { export=icon }
declare module "lenz:icons/information_slab_box_outline" { export=icon }
declare module "lenz:icons/information_slab_circle" { export=icon }
declare module "lenz:icons/information_slab_circle_outline" { export=icon }
declare module "lenz:icons/information_slab_symbol" { export=icon }
declare module "lenz:icons/information_symbol" { export=icon }
declare module "lenz:icons/information_variant" { export=icon }
declare module "lenz:icons/information_variant_box" { export=icon }
declare module "lenz:icons/information_variant_box_outline" { export=icon }
declare module "lenz:icons/information_variant_circle" { export=icon }
declare module "lenz:icons/information_variant_circle_outline" { export=icon }
declare module "lenz:icons/instagram" { export=icon }
declare module "lenz:icons/instrument_triangle" { export=icon }
declare module "lenz:icons/integrated_circuit_chip" { export=icon }
declare module "lenz:icons/invert_colors" { export=icon }
declare module "lenz:icons/invert_colors_off" { export=icon }
declare module "lenz:icons/invoice" { export=icon }
declare module "lenz:icons/invoice_arrow_left" { export=icon }
declare module "lenz:icons/invoice_arrow_left_outline" { export=icon }
declare module "lenz:icons/invoice_arrow_right" { export=icon }
declare module "lenz:icons/invoice_arrow_right_outline" { export=icon }
declare module "lenz:icons/invoice_check" { export=icon }
declare module "lenz:icons/invoice_check_outline" { export=icon }
declare module "lenz:icons/invoice_clock" { export=icon }
declare module "lenz:icons/invoice_clock_outline" { export=icon }
declare module "lenz:icons/invoice_edit" { export=icon }
declare module "lenz:icons/invoice_edit_outline" { export=icon }
declare module "lenz:icons/invoice_export_outline" { export=icon }
declare module "lenz:icons/invoice_fast" { export=icon }
declare module "lenz:icons/invoice_fast_outline" { export=icon }
declare module "lenz:icons/invoice_import" { export=icon }
declare module "lenz:icons/invoice_import_outline" { export=icon }
declare module "lenz:icons/invoice_list" { export=icon }
declare module "lenz:icons/invoice_list_outline" { export=icon }
declare module "lenz:icons/invoice_minus" { export=icon }
declare module "lenz:icons/invoice_minus_outline" { export=icon }
declare module "lenz:icons/invoice_multiple" { export=icon }
declare module "lenz:icons/invoice_multiple_outline" { export=icon }
declare module "lenz:icons/invoice_outline" { export=icon }
declare module "lenz:icons/invoice_plus" { export=icon }
declare module "lenz:icons/invoice_plus_outline" { export=icon }
declare module "lenz:icons/invoice_remove" { export=icon }
declare module "lenz:icons/invoice_remove_outline" { export=icon }
declare module "lenz:icons/invoice_send" { export=icon }
declare module "lenz:icons/invoice_send_outline" { export=icon }
declare module "lenz:icons/invoice_text" { export=icon }
declare module "lenz:icons/invoice_text_arrow_left" { export=icon }
declare module "lenz:icons/invoice_text_arrow_left_outline" { export=icon }
declare module "lenz:icons/invoice_text_arrow_right" { export=icon }
declare module "lenz:icons/invoice_text_arrow_right_outline" { export=icon }
declare module "lenz:icons/invoice_text_check" { export=icon }
declare module "lenz:icons/invoice_text_check_outline" { export=icon }
declare module "lenz:icons/invoice_text_clock" { export=icon }
declare module "lenz:icons/invoice_text_clock_outline" { export=icon }
declare module "lenz:icons/invoice_text_edit" { export=icon }
declare module "lenz:icons/invoice_text_edit_outline" { export=icon }
declare module "lenz:icons/invoice_text_fast" { export=icon }
declare module "lenz:icons/invoice_text_fast_outline" { export=icon }
declare module "lenz:icons/invoice_text_minus" { export=icon }
declare module "lenz:icons/invoice_text_minus_outline" { export=icon }
declare module "lenz:icons/invoice_text_multiple" { export=icon }
declare module "lenz:icons/invoice_text_multiple_outline" { export=icon }
declare module "lenz:icons/invoice_text_outline" { export=icon }
declare module "lenz:icons/invoice_text_plus" { export=icon }
declare module "lenz:icons/invoice_text_plus_outline" { export=icon }
declare module "lenz:icons/invoice_text_remove" { export=icon }
declare module "lenz:icons/invoice_text_remove_outline" { export=icon }
declare module "lenz:icons/invoice_text_send" { export=icon }
declare module "lenz:icons/invoice_text_send_outline" { export=icon }
declare module "lenz:icons/iobroker" { export=icon }
declare module "lenz:icons/ip" { export=icon }
declare module "lenz:icons/ip_network" { export=icon }
declare module "lenz:icons/ip_network_outline" { export=icon }
declare module "lenz:icons/ip_outline" { export=icon }
declare module "lenz:icons/ipod" { export=icon }
declare module "lenz:icons/iron" { export=icon }
declare module "lenz:icons/iron_board" { export=icon }
declare module "lenz:icons/iron_outline" { export=icon }
declare module "lenz:icons/island" { export=icon }
declare module "lenz:icons/island_variant" { export=icon }
declare module "lenz:icons/iv_bag" { export=icon }
declare module "lenz:icons/jabber" { export=icon }
declare module "lenz:icons/jeepney" { export=icon }
declare module "lenz:icons/jellyfish" { export=icon }
declare module "lenz:icons/jellyfish_outline" { export=icon }
declare module "lenz:icons/jira" { export=icon }
declare module "lenz:icons/jquery" { export=icon }
declare module "lenz:icons/jsfiddle" { export=icon }
declare module "lenz:icons/jump_rope" { export=icon }
declare module "lenz:icons/kabaddi" { export=icon }
declare module "lenz:icons/kangaroo" { export=icon }
declare module "lenz:icons/karate" { export=icon }
declare module "lenz:icons/kayaking" { export=icon }
declare module "lenz:icons/keg" { export=icon }
declare module "lenz:icons/kettle" { export=icon }
declare module "lenz:icons/kettle_alert" { export=icon }
declare module "lenz:icons/kettle_alert_outline" { export=icon }
declare module "lenz:icons/kettle_off" { export=icon }
declare module "lenz:icons/kettle_off_outline" { export=icon }
declare module "lenz:icons/kettle_outline" { export=icon }
declare module "lenz:icons/kettle_pour_over" { export=icon }
declare module "lenz:icons/kettle_steam" { export=icon }
declare module "lenz:icons/kettle_steam_outline" { export=icon }
declare module "lenz:icons/kettlebell" { export=icon }
declare module "lenz:icons/key" { export=icon }
declare module "lenz:icons/key_alert" { export=icon }
declare module "lenz:icons/key_alert_outline" { export=icon }
declare module "lenz:icons/key_arrow_right" { export=icon }
declare module "lenz:icons/key_chain" { export=icon }
declare module "lenz:icons/key_chain_variant" { export=icon }
declare module "lenz:icons/key_change" { export=icon }
declare module "lenz:icons/key_link" { export=icon }
declare module "lenz:icons/key_minus" { export=icon }
declare module "lenz:icons/key_outline" { export=icon }
declare module "lenz:icons/key_plus" { export=icon }
declare module "lenz:icons/key_remove" { export=icon }
declare module "lenz:icons/key_star" { export=icon }
declare module "lenz:icons/key_variant" { export=icon }
declare module "lenz:icons/key_wireless" { export=icon }
declare module "lenz:icons/keyboard" { export=icon }
declare module "lenz:icons/keyboard_backspace" { export=icon }
declare module "lenz:icons/keyboard_caps" { export=icon }
declare module "lenz:icons/keyboard_close" { export=icon }
declare module "lenz:icons/keyboard_close_outline" { export=icon }
declare module "lenz:icons/keyboard_esc" { export=icon }
declare module "lenz:icons/keyboard_f1" { export=icon }
declare module "lenz:icons/keyboard_f10" { export=icon }
declare module "lenz:icons/keyboard_f11" { export=icon }
declare module "lenz:icons/keyboard_f12" { export=icon }
declare module "lenz:icons/keyboard_f2" { export=icon }
declare module "lenz:icons/keyboard_f3" { export=icon }
declare module "lenz:icons/keyboard_f4" { export=icon }
declare module "lenz:icons/keyboard_f5" { export=icon }
declare module "lenz:icons/keyboard_f6" { export=icon }
declare module "lenz:icons/keyboard_f7" { export=icon }
declare module "lenz:icons/keyboard_f8" { export=icon }
declare module "lenz:icons/keyboard_f9" { export=icon }
declare module "lenz:icons/keyboard_off" { export=icon }
declare module "lenz:icons/keyboard_off_outline" { export=icon }
declare module "lenz:icons/keyboard_outline" { export=icon }
declare module "lenz:icons/keyboard_return" { export=icon }
declare module "lenz:icons/keyboard_settings" { export=icon }
declare module "lenz:icons/keyboard_settings_outline" { export=icon }
declare module "lenz:icons/keyboard_space" { export=icon }
declare module "lenz:icons/keyboard_tab" { export=icon }
declare module "lenz:icons/keyboard_tab_reverse" { export=icon }
declare module "lenz:icons/keyboard_variant" { export=icon }
declare module "lenz:icons/khanda" { export=icon }
declare module "lenz:icons/kickstarter" { export=icon }
declare module "lenz:icons/kite" { export=icon }
declare module "lenz:icons/kite_outline" { export=icon }
declare module "lenz:icons/kitesurfing" { export=icon }
declare module "lenz:icons/klingon" { export=icon }
declare module "lenz:icons/knife" { export=icon }
declare module "lenz:icons/knife_military" { export=icon }
declare module "lenz:icons/knob" { export=icon }
declare module "lenz:icons/koala" { export=icon }
declare module "lenz:icons/kodi" { export=icon }
declare module "lenz:icons/kubernetes" { export=icon }
declare module "lenz:icons/label" { export=icon }
declare module "lenz:icons/label_multiple" { export=icon }
declare module "lenz:icons/label_multiple_outline" { export=icon }
declare module "lenz:icons/label_off" { export=icon }
declare module "lenz:icons/label_off_outline" { export=icon }
declare module "lenz:icons/label_outline" { export=icon }
declare module "lenz:icons/label_percent" { export=icon }
declare module "lenz:icons/label_percent_outline" { export=icon }
declare module "lenz:icons/label_variant" { export=icon }
declare module "lenz:icons/label_variant_outline" { export=icon }
declare module "lenz:icons/ladder" { export=icon }
declare module "lenz:icons/ladybug" { export=icon }
declare module "lenz:icons/lambda" { export=icon }
declare module "lenz:icons/lamp" { export=icon }
declare module "lenz:icons/lamp_outline" { export=icon }
declare module "lenz:icons/lamps" { export=icon }
declare module "lenz:icons/lamps_outline" { export=icon }
declare module "lenz:icons/lan" { export=icon }
declare module "lenz:icons/lan_check" { export=icon }
declare module "lenz:icons/lan_connect" { export=icon }
declare module "lenz:icons/lan_disconnect" { export=icon }
declare module "lenz:icons/lan_pending" { export=icon }
declare module "lenz:icons/land_fields" { export=icon }
declare module "lenz:icons/land_plots" { export=icon }
declare module "lenz:icons/land_plots_circle" { export=icon }
declare module "lenz:icons/land_plots_circle_variant" { export=icon }
declare module "lenz:icons/land_plots_marker" { export=icon }
declare module "lenz:icons/land_rows_horizontal" { export=icon }
declare module "lenz:icons/land_rows_vertical" { export=icon }
declare module "lenz:icons/landslide" { export=icon }
declare module "lenz:icons/landslide_outline" { export=icon }
declare module "lenz:icons/language_c" { export=icon }
declare module "lenz:icons/language_cpp" { export=icon }
declare module "lenz:icons/language_csharp" { export=icon }
declare module "lenz:icons/language_css3" { export=icon }
declare module "lenz:icons/language_fortran" { export=icon }
declare module "lenz:icons/language_go" { export=icon }
declare module "lenz:icons/language_haskell" { export=icon }
declare module "lenz:icons/language_html5" { export=icon }
declare module "lenz:icons/language_java" { export=icon }
declare module "lenz:icons/language_javascript" { export=icon }
declare module "lenz:icons/language_kotlin" { export=icon }
declare module "lenz:icons/language_lua" { export=icon }
declare module "lenz:icons/language_markdown" { export=icon }
declare module "lenz:icons/language_markdown_outline" { export=icon }
declare module "lenz:icons/language_php" { export=icon }
declare module "lenz:icons/language_python" { export=icon }
declare module "lenz:icons/language_r" { export=icon }
declare module "lenz:icons/language_ruby" { export=icon }
declare module "lenz:icons/language_ruby_on_rails" { export=icon }
declare module "lenz:icons/language_rust" { export=icon }
declare module "lenz:icons/language_swift" { export=icon }
declare module "lenz:icons/language_typescript" { export=icon }
declare module "lenz:icons/language_xaml" { export=icon }
declare module "lenz:icons/laptop" { export=icon }
declare module "lenz:icons/laptop_account" { export=icon }
declare module "lenz:icons/laptop_off" { export=icon }
declare module "lenz:icons/laravel" { export=icon }
declare module "lenz:icons/laser_pointer" { export=icon }
declare module "lenz:icons/lasso" { export=icon }
declare module "lenz:icons/lastpass" { export=icon }
declare module "lenz:icons/latitude" { export=icon }
declare module "lenz:icons/launch" { export=icon }
declare module "lenz:icons/lava_lamp" { export=icon }
declare module "lenz:icons/layers" { export=icon }
declare module "lenz:icons/layers_edit" { export=icon }
declare module "lenz:icons/layers_minus" { export=icon }
declare module "lenz:icons/layers_off" { export=icon }
declare module "lenz:icons/layers_off_outline" { export=icon }
declare module "lenz:icons/layers_outline" { export=icon }
declare module "lenz:icons/layers_plus" { export=icon }
declare module "lenz:icons/layers_remove" { export=icon }
declare module "lenz:icons/layers_search" { export=icon }
declare module "lenz:icons/layers_search_outline" { export=icon }
declare module "lenz:icons/layers_triple" { export=icon }
declare module "lenz:icons/layers_triple_outline" { export=icon }
declare module "lenz:icons/lead_pencil" { export=icon }
declare module "lenz:icons/leaf" { export=icon }
declare module "lenz:icons/leaf_circle" { export=icon }
declare module "lenz:icons/leaf_circle_outline" { export=icon }
declare module "lenz:icons/leaf_maple" { export=icon }
declare module "lenz:icons/leaf_maple_off" { export=icon }
declare module "lenz:icons/leaf_off" { export=icon }
declare module "lenz:icons/leak" { export=icon }
declare module "lenz:icons/leak_off" { export=icon }
declare module "lenz:icons/lectern" { export=icon }
declare module "lenz:icons/led_off" { export=icon }
declare module "lenz:icons/led_on" { export=icon }
declare module "lenz:icons/led_outline" { export=icon }
declare module "lenz:icons/led_strip" { export=icon }
declare module "lenz:icons/led_strip_variant" { export=icon }
declare module "lenz:icons/led_strip_variant_off" { export=icon }
declare module "lenz:icons/led_variant_off" { export=icon }
declare module "lenz:icons/led_variant_on" { export=icon }
declare module "lenz:icons/led_variant_outline" { export=icon }
declare module "lenz:icons/leek" { export=icon }
declare module "lenz:icons/less_than" { export=icon }
declare module "lenz:icons/less_than_or_equal" { export=icon }
declare module "lenz:icons/library" { export=icon }
declare module "lenz:icons/library_outline" { export=icon }
declare module "lenz:icons/library_shelves" { export=icon }
declare module "lenz:icons/license" { export=icon }
declare module "lenz:icons/lifebuoy" { export=icon }
declare module "lenz:icons/light_flood_down" { export=icon }
declare module "lenz:icons/light_flood_up" { export=icon }
declare module "lenz:icons/light_recessed" { export=icon }
declare module "lenz:icons/light_switch" { export=icon }
declare module "lenz:icons/light_switch_off" { export=icon }
declare module "lenz:icons/lightbulb" { export=icon }
declare module "lenz:icons/lightbulb_alert" { export=icon }
declare module "lenz:icons/lightbulb_alert_outline" { export=icon }
declare module "lenz:icons/lightbulb_auto" { export=icon }
declare module "lenz:icons/lightbulb_auto_outline" { export=icon }
declare module "lenz:icons/lightbulb_cfl" { export=icon }
declare module "lenz:icons/lightbulb_cfl_off" { export=icon }
declare module "lenz:icons/lightbulb_cfl_spiral" { export=icon }
declare module "lenz:icons/lightbulb_cfl_spiral_off" { export=icon }
declare module "lenz:icons/lightbulb_fluorescent_tube" { export=icon }
declare module "lenz:icons/lightbulb_fluorescent_tube_outline" { export=icon }
declare module "lenz:icons/lightbulb_group" { export=icon }
declare module "lenz:icons/lightbulb_group_off" { export=icon }
declare module "lenz:icons/lightbulb_group_off_outline" { export=icon }
declare module "lenz:icons/lightbulb_group_outline" { export=icon }
declare module "lenz:icons/lightbulb_multiple" { export=icon }
declare module "lenz:icons/lightbulb_multiple_off" { export=icon }
declare module "lenz:icons/lightbulb_multiple_off_outline" { export=icon }
declare module "lenz:icons/lightbulb_multiple_outline" { export=icon }
declare module "lenz:icons/lightbulb_night" { export=icon }
declare module "lenz:icons/lightbulb_night_outline" { export=icon }
declare module "lenz:icons/lightbulb_off" { export=icon }
declare module "lenz:icons/lightbulb_off_outline" { export=icon }
declare module "lenz:icons/lightbulb_on" { export=icon }
declare module "lenz:icons/lightbulb_on10" { export=icon }
declare module "lenz:icons/lightbulb_on20" { export=icon }
declare module "lenz:icons/lightbulb_on30" { export=icon }
declare module "lenz:icons/lightbulb_on40" { export=icon }
declare module "lenz:icons/lightbulb_on50" { export=icon }
declare module "lenz:icons/lightbulb_on60" { export=icon }
declare module "lenz:icons/lightbulb_on70" { export=icon }
declare module "lenz:icons/lightbulb_on80" { export=icon }
declare module "lenz:icons/lightbulb_on90" { export=icon }
declare module "lenz:icons/lightbulb_on_outline" { export=icon }
declare module "lenz:icons/lightbulb_outline" { export=icon }
declare module "lenz:icons/lightbulb_question" { export=icon }
declare module "lenz:icons/lightbulb_question_outline" { export=icon }
declare module "lenz:icons/lightbulb_spot" { export=icon }
declare module "lenz:icons/lightbulb_spot_off" { export=icon }
declare module "lenz:icons/lightbulb_variant" { export=icon }
declare module "lenz:icons/lightbulb_variant_outline" { export=icon }
declare module "lenz:icons/lighthouse" { export=icon }
declare module "lenz:icons/lighthouse_on" { export=icon }
declare module "lenz:icons/lightning_bolt" { export=icon }
declare module "lenz:icons/lightning_bolt_circle" { export=icon }
declare module "lenz:icons/lightning_bolt_outline" { export=icon }
declare module "lenz:icons/line_scan" { export=icon }
declare module "lenz:icons/lingerie" { export=icon }
declare module "lenz:icons/link" { export=icon }
declare module "lenz:icons/link_box" { export=icon }
declare module "lenz:icons/link_box_outline" { export=icon }
declare module "lenz:icons/link_box_variant" { export=icon }
declare module "lenz:icons/link_box_variant_outline" { export=icon }
declare module "lenz:icons/link_circle" { export=icon }
declare module "lenz:icons/link_circle_outline" { export=icon }
declare module "lenz:icons/link_edit" { export=icon }
declare module "lenz:icons/link_lock" { export=icon }
declare module "lenz:icons/link_off" { export=icon }
declare module "lenz:icons/link_plus" { export=icon }
declare module "lenz:icons/link_variant" { export=icon }
declare module "lenz:icons/link_variant_minus" { export=icon }
declare module "lenz:icons/link_variant_off" { export=icon }
declare module "lenz:icons/link_variant_plus" { export=icon }
declare module "lenz:icons/link_variant_remove" { export=icon }
declare module "lenz:icons/linkedin" { export=icon }
declare module "lenz:icons/linux" { export=icon }
declare module "lenz:icons/linux_mint" { export=icon }
declare module "lenz:icons/lipstick" { export=icon }
declare module "lenz:icons/liquid_spot" { export=icon }
declare module "lenz:icons/liquor" { export=icon }
declare module "lenz:icons/list_box" { export=icon }
declare module "lenz:icons/list_box_outline" { export=icon }
declare module "lenz:icons/list_status" { export=icon }
declare module "lenz:icons/litecoin" { export=icon }
declare module "lenz:icons/loading" { export=icon }
declare module "lenz:icons/location_enter" { export=icon }
declare module "lenz:icons/location_exit" { export=icon }
declare module "lenz:icons/lock" { export=icon }
declare module "lenz:icons/lock_alert" { export=icon }
declare module "lenz:icons/lock_alert_outline" { export=icon }
declare module "lenz:icons/lock_check" { export=icon }
declare module "lenz:icons/lock_check_outline" { export=icon }
declare module "lenz:icons/lock_clock" { export=icon }
declare module "lenz:icons/lock_minus" { export=icon }
declare module "lenz:icons/lock_minus_outline" { export=icon }
declare module "lenz:icons/lock_off" { export=icon }
declare module "lenz:icons/lock_off_outline" { export=icon }
declare module "lenz:icons/lock_open" { export=icon }
declare module "lenz:icons/lock_open_alert" { export=icon }
declare module "lenz:icons/lock_open_alert_outline" { export=icon }
declare module "lenz:icons/lock_open_check" { export=icon }
declare module "lenz:icons/lock_open_check_outline" { export=icon }
declare module "lenz:icons/lock_open_minus" { export=icon }
declare module "lenz:icons/lock_open_minus_outline" { export=icon }
declare module "lenz:icons/lock_open_outline" { export=icon }
declare module "lenz:icons/lock_open_plus" { export=icon }
declare module "lenz:icons/lock_open_plus_outline" { export=icon }
declare module "lenz:icons/lock_open_remove" { export=icon }
declare module "lenz:icons/lock_open_remove_outline" { export=icon }
declare module "lenz:icons/lock_open_variant" { export=icon }
declare module "lenz:icons/lock_open_variant_outline" { export=icon }
declare module "lenz:icons/lock_outline" { export=icon }
declare module "lenz:icons/lock_pattern" { export=icon }
declare module "lenz:icons/lock_percent" { export=icon }
declare module "lenz:icons/lock_percent_open" { export=icon }
declare module "lenz:icons/lock_percent_open_outline" { export=icon }
declare module "lenz:icons/lock_percent_open_variant" { export=icon }
declare module "lenz:icons/lock_percent_open_variant_outline" { export=icon }
declare module "lenz:icons/lock_percent_outline" { export=icon }
declare module "lenz:icons/lock_plus" { export=icon }
declare module "lenz:icons/lock_plus_outline" { export=icon }
declare module "lenz:icons/lock_question" { export=icon }
declare module "lenz:icons/lock_remove" { export=icon }
declare module "lenz:icons/lock_remove_outline" { export=icon }
declare module "lenz:icons/lock_reset" { export=icon }
declare module "lenz:icons/lock_smart" { export=icon }
declare module "lenz:icons/locker" { export=icon }
declare module "lenz:icons/locker_multiple" { export=icon }
declare module "lenz:icons/login" { export=icon }
declare module "lenz:icons/login_variant" { export=icon }
declare module "lenz:icons/logout" { export=icon }
declare module "lenz:icons/logout_variant" { export=icon }
declare module "lenz:icons/longitude" { export=icon }
declare module "lenz:icons/looks" { export=icon }
declare module "lenz:icons/lotion" { export=icon }
declare module "lenz:icons/lotion_outline" { export=icon }
declare module "lenz:icons/lotion_plus" { export=icon }
declare module "lenz:icons/lotion_plus_outline" { export=icon }
declare module "lenz:icons/loupe" { export=icon }
declare module "lenz:icons/lumx" { export=icon }
declare module "lenz:icons/lungs" { export=icon }
declare module "lenz:icons/mace" { export=icon }
declare module "lenz:icons/magazine_pistol" { export=icon }
declare module "lenz:icons/magazine_rifle" { export=icon }
declare module "lenz:icons/magic_staff" { export=icon }
declare module "lenz:icons/magnet" { export=icon }
declare module "lenz:icons/magnet_on" { export=icon }
declare module "lenz:icons/magnify" { export=icon }
declare module "lenz:icons/magnify_close" { export=icon }
declare module "lenz:icons/magnify_expand" { export=icon }
declare module "lenz:icons/magnify_minus" { export=icon }
declare module "lenz:icons/magnify_minus_cursor" { export=icon }
declare module "lenz:icons/magnify_minus_outline" { export=icon }
declare module "lenz:icons/magnify_plus" { export=icon }
declare module "lenz:icons/magnify_plus_cursor" { export=icon }
declare module "lenz:icons/magnify_plus_outline" { export=icon }
declare module "lenz:icons/magnify_remove_cursor" { export=icon }
declare module "lenz:icons/magnify_remove_outline" { export=icon }
declare module "lenz:icons/magnify_scan" { export=icon }
declare module "lenz:icons/mail" { export=icon }
declare module "lenz:icons/mailbox" { export=icon }
declare module "lenz:icons/mailbox_open" { export=icon }
declare module "lenz:icons/mailbox_open_outline" { export=icon }
declare module "lenz:icons/mailbox_open_up" { export=icon }
declare module "lenz:icons/mailbox_open_up_outline" { export=icon }
declare module "lenz:icons/mailbox_outline" { export=icon }
declare module "lenz:icons/mailbox_up" { export=icon }
declare module "lenz:icons/mailbox_up_outline" { export=icon }
declare module "lenz:icons/manjaro" { export=icon }
declare module "lenz:icons/map" { export=icon }
declare module "lenz:icons/map_check" { export=icon }
declare module "lenz:icons/map_check_outline" { export=icon }
declare module "lenz:icons/map_clock" { export=icon }
declare module "lenz:icons/map_clock_outline" { export=icon }
declare module "lenz:icons/map_legend" { export=icon }
declare module "lenz:icons/map_marker" { export=icon }
declare module "lenz:icons/map_marker_account" { export=icon }
declare module "lenz:icons/map_marker_account_outline" { export=icon }
declare module "lenz:icons/map_marker_alert" { export=icon }
declare module "lenz:icons/map_marker_alert_outline" { export=icon }
declare module "lenz:icons/map_marker_check" { export=icon }
declare module "lenz:icons/map_marker_check_outline" { export=icon }
declare module "lenz:icons/map_marker_circle" { export=icon }
declare module "lenz:icons/map_marker_distance" { export=icon }
declare module "lenz:icons/map_marker_down" { export=icon }
declare module "lenz:icons/map_marker_left" { export=icon }
declare module "lenz:icons/map_marker_left_outline" { export=icon }
declare module "lenz:icons/map_marker_minus" { export=icon }
declare module "lenz:icons/map_marker_minus_outline" { export=icon }
declare module "lenz:icons/map_marker_multiple" { export=icon }
declare module "lenz:icons/map_marker_multiple_outline" { export=icon }
declare module "lenz:icons/map_marker_off" { export=icon }
declare module "lenz:icons/map_marker_off_outline" { export=icon }
declare module "lenz:icons/map_marker_outline" { export=icon }
declare module "lenz:icons/map_marker_path" { export=icon }
declare module "lenz:icons/map_marker_plus" { export=icon }
declare module "lenz:icons/map_marker_plus_outline" { export=icon }
declare module "lenz:icons/map_marker_question" { export=icon }
declare module "lenz:icons/map_marker_question_outline" { export=icon }
declare module "lenz:icons/map_marker_radius" { export=icon }
declare module "lenz:icons/map_marker_radius_outline" { export=icon }
declare module "lenz:icons/map_marker_remove" { export=icon }
declare module "lenz:icons/map_marker_remove_outline" { export=icon }
declare module "lenz:icons/map_marker_remove_variant" { export=icon }
declare module "lenz:icons/map_marker_right" { export=icon }
declare module "lenz:icons/map_marker_right_outline" { export=icon }
declare module "lenz:icons/map_marker_star" { export=icon }
declare module "lenz:icons/map_marker_star_outline" { export=icon }
declare module "lenz:icons/map_marker_up" { export=icon }
declare module "lenz:icons/map_minus" { export=icon }
declare module "lenz:icons/map_outline" { export=icon }
declare module "lenz:icons/map_plus" { export=icon }
declare module "lenz:icons/map_search" { export=icon }
declare module "lenz:icons/map_search_outline" { export=icon }
declare module "lenz:icons/mapbox" { export=icon }
declare module "lenz:icons/margin" { export=icon }
declare module "lenz:icons/marker" { export=icon }
declare module "lenz:icons/marker_cancel" { export=icon }
declare module "lenz:icons/marker_check" { export=icon }
declare module "lenz:icons/mastodon" { export=icon }
declare module "lenz:icons/material_design" { export=icon }
declare module "lenz:icons/material_ui" { export=icon }
declare module "lenz:icons/math_compass" { export=icon }
declare module "lenz:icons/math_cos" { export=icon }
declare module "lenz:icons/math_integral" { export=icon }
declare module "lenz:icons/math_integral_box" { export=icon }
declare module "lenz:icons/math_log" { export=icon }
declare module "lenz:icons/math_norm" { export=icon }
declare module "lenz:icons/math_norm_box" { export=icon }
declare module "lenz:icons/math_sin" { export=icon }
declare module "lenz:icons/math_tan" { export=icon }
declare module "lenz:icons/matrix" { export=icon }
declare module "lenz:icons/medal" { export=icon }
declare module "lenz:icons/medal_outline" { export=icon }
declare module "lenz:icons/medical_bag" { export=icon }
declare module "lenz:icons/medical_cotton_swab" { export=icon }
declare module "lenz:icons/medication" { export=icon }
declare module "lenz:icons/medication_outline" { export=icon }
declare module "lenz:icons/meditation" { export=icon }
declare module "lenz:icons/memory" { export=icon }
declare module "lenz:icons/memory_arrow_down" { export=icon }
declare module "lenz:icons/menorah" { export=icon }
declare module "lenz:icons/menorah_fire" { export=icon }
declare module "lenz:icons/menu" { export=icon }
declare module "lenz:icons/menu_close" { export=icon }
declare module "lenz:icons/menu_down" { export=icon }
declare module "lenz:icons/menu_down_outline" { export=icon }
declare module "lenz:icons/menu_left" { export=icon }
declare module "lenz:icons/menu_left_outline" { export=icon }
declare module "lenz:icons/menu_open" { export=icon }
declare module "lenz:icons/menu_right" { export=icon }
declare module "lenz:icons/menu_right_outline" { export=icon }
declare module "lenz:icons/menu_swap" { export=icon }
declare module "lenz:icons/menu_swap_outline" { export=icon }
declare module "lenz:icons/menu_up" { export=icon }
declare module "lenz:icons/menu_up_outline" { export=icon }
declare module "lenz:icons/merge" { export=icon }
declare module "lenz:icons/message" { export=icon }
declare module "lenz:icons/message_alert" { export=icon }
declare module "lenz:icons/message_alert_outline" { export=icon }
declare module "lenz:icons/message_arrow_left" { export=icon }
declare module "lenz:icons/message_arrow_left_outline" { export=icon }
declare module "lenz:icons/message_arrow_right" { export=icon }
declare module "lenz:icons/message_arrow_right_outline" { export=icon }
declare module "lenz:icons/message_badge" { export=icon }
declare module "lenz:icons/message_badge_outline" { export=icon }
declare module "lenz:icons/message_bookmark" { export=icon }
declare module "lenz:icons/message_bookmark_outline" { export=icon }
declare module "lenz:icons/message_bulleted" { export=icon }
declare module "lenz:icons/message_bulleted_off" { export=icon }
declare module "lenz:icons/message_check" { export=icon }
declare module "lenz:icons/message_check_outline" { export=icon }
declare module "lenz:icons/message_cog" { export=icon }
declare module "lenz:icons/message_cog_outline" { export=icon }
declare module "lenz:icons/message_draw" { export=icon }
declare module "lenz:icons/message_fast" { export=icon }
declare module "lenz:icons/message_fast_outline" { export=icon }
declare module "lenz:icons/message_flash" { export=icon }
declare module "lenz:icons/message_flash_outline" { export=icon }
declare module "lenz:icons/message_image" { export=icon }
declare module "lenz:icons/message_image_outline" { export=icon }
declare module "lenz:icons/message_lock" { export=icon }
declare module "lenz:icons/message_lock_outline" { export=icon }
declare module "lenz:icons/message_minus" { export=icon }
declare module "lenz:icons/message_minus_outline" { export=icon }
declare module "lenz:icons/message_off" { export=icon }
declare module "lenz:icons/message_off_outline" { export=icon }
declare module "lenz:icons/message_outline" { export=icon }
declare module "lenz:icons/message_plus" { export=icon }
declare module "lenz:icons/message_plus_outline" { export=icon }
declare module "lenz:icons/message_processing" { export=icon }
declare module "lenz:icons/message_processing_outline" { export=icon }
declare module "lenz:icons/message_question" { export=icon }
declare module "lenz:icons/message_question_outline" { export=icon }
declare module "lenz:icons/message_reply" { export=icon }
declare module "lenz:icons/message_reply_outline" { export=icon }
declare module "lenz:icons/message_reply_text" { export=icon }
declare module "lenz:icons/message_reply_text_outline" { export=icon }
declare module "lenz:icons/message_settings" { export=icon }
declare module "lenz:icons/message_settings_outline" { export=icon }
declare module "lenz:icons/message_star" { export=icon }
declare module "lenz:icons/message_star_outline" { export=icon }
declare module "lenz:icons/message_text" { export=icon }
declare module "lenz:icons/message_text_clock" { export=icon }
declare module "lenz:icons/message_text_clock_outline" { export=icon }
declare module "lenz:icons/message_text_fast" { export=icon }
declare module "lenz:icons/message_text_fast_outline" { export=icon }
declare module "lenz:icons/message_text_lock" { export=icon }
declare module "lenz:icons/message_text_lock_outline" { export=icon }
declare module "lenz:icons/message_text_outline" { export=icon }
declare module "lenz:icons/message_video" { export=icon }
declare module "lenz:icons/meteor" { export=icon }
declare module "lenz:icons/meter_electric" { export=icon }
declare module "lenz:icons/meter_electric_outline" { export=icon }
declare module "lenz:icons/meter_gas" { export=icon }
declare module "lenz:icons/meter_gas_outline" { export=icon }
declare module "lenz:icons/metronome" { export=icon }
declare module "lenz:icons/metronome_tick" { export=icon }
declare module "lenz:icons/micro_sd" { export=icon }
declare module "lenz:icons/microphone" { export=icon }
declare module "lenz:icons/microphone_message" { export=icon }
declare module "lenz:icons/microphone_message_off" { export=icon }
declare module "lenz:icons/microphone_minus" { export=icon }
declare module "lenz:icons/microphone_off" { export=icon }
declare module "lenz:icons/microphone_outline" { export=icon }
declare module "lenz:icons/microphone_plus" { export=icon }
declare module "lenz:icons/microphone_question" { export=icon }
declare module "lenz:icons/microphone_question_outline" { export=icon }
declare module "lenz:icons/microphone_settings" { export=icon }
declare module "lenz:icons/microphone_variant" { export=icon }
declare module "lenz:icons/microphone_variant_off" { export=icon }
declare module "lenz:icons/microscope" { export=icon }
declare module "lenz:icons/microsoft" { export=icon }
declare module "lenz:icons/microsoft_access" { export=icon }
declare module "lenz:icons/microsoft_azure" { export=icon }
declare module "lenz:icons/microsoft_azure_devops" { export=icon }
declare module "lenz:icons/microsoft_bing" { export=icon }
declare module "lenz:icons/microsoft_dynamics365" { export=icon }
declare module "lenz:icons/microsoft_edge" { export=icon }
declare module "lenz:icons/microsoft_excel" { export=icon }
declare module "lenz:icons/microsoft_internet_explorer" { export=icon }
declare module "lenz:icons/microsoft_office" { export=icon }
declare module "lenz:icons/microsoft_onedrive" { export=icon }
declare module "lenz:icons/microsoft_onenote" { export=icon }
declare module "lenz:icons/microsoft_outlook" { export=icon }
declare module "lenz:icons/microsoft_powerpoint" { export=icon }
declare module "lenz:icons/microsoft_sharepoint" { export=icon }
declare module "lenz:icons/microsoft_teams" { export=icon }
declare module "lenz:icons/microsoft_visual_studio" { export=icon }
declare module "lenz:icons/microsoft_visual_studio_code" { export=icon }
declare module "lenz:icons/microsoft_windows" { export=icon }
declare module "lenz:icons/microsoft_windows_classic" { export=icon }
declare module "lenz:icons/microsoft_word" { export=icon }
declare module "lenz:icons/microsoft_xbox" { export=icon }
declare module "lenz:icons/microsoft_xbox_controller" { export=icon }
declare module "lenz:icons/microsoft_xbox_controller_battery_alert" { export=icon }
declare module "lenz:icons/microsoft_xbox_controller_battery_charging" { export=icon }
declare module "lenz:icons/microsoft_xbox_controller_battery_empty" { export=icon }
declare module "lenz:icons/microsoft_xbox_controller_battery_full" { export=icon }
declare module "lenz:icons/microsoft_xbox_controller_battery_low" { export=icon }
declare module "lenz:icons/microsoft_xbox_controller_battery_medium" { export=icon }
declare module "lenz:icons/microsoft_xbox_controller_battery_unknown" { export=icon }
declare module "lenz:icons/microsoft_xbox_controller_menu" { export=icon }
declare module "lenz:icons/microsoft_xbox_controller_off" { export=icon }
declare module "lenz:icons/microsoft_xbox_controller_view" { export=icon }
declare module "lenz:icons/microwave" { export=icon }
declare module "lenz:icons/microwave_off" { export=icon }
declare module "lenz:icons/middleware" { export=icon }
declare module "lenz:icons/middleware_outline" { export=icon }
declare module "lenz:icons/midi" { export=icon }
declare module "lenz:icons/midi_port" { export=icon }
declare module "lenz:icons/mine" { export=icon }
declare module "lenz:icons/minecraft" { export=icon }
declare module "lenz:icons/mini_sd" { export=icon }
declare module "lenz:icons/minidisc" { export=icon }
declare module "lenz:icons/minus" { export=icon }
declare module "lenz:icons/minus_box" { export=icon }
declare module "lenz:icons/minus_box_multiple" { export=icon }
declare module "lenz:icons/minus_box_multiple_outline" { export=icon }
declare module "lenz:icons/minus_box_outline" { export=icon }
declare module "lenz:icons/minus_circle" { export=icon }
declare module "lenz:icons/minus_circle_multiple" { export=icon }
declare module "lenz:icons/minus_circle_multiple_outline" { export=icon }
declare module "lenz:icons/minus_circle_off" { export=icon }
declare module "lenz:icons/minus_circle_off_outline" { export=icon }
declare module "lenz:icons/minus_circle_outline" { export=icon }
declare module "lenz:icons/minus_network" { export=icon }
declare module "lenz:icons/minus_network_outline" { export=icon }
declare module "lenz:icons/minus_thick" { export=icon }
declare module "lenz:icons/mirror" { export=icon }
declare module "lenz:icons/mirror_rectangle" { export=icon }
declare module "lenz:icons/mirror_variant" { export=icon }
declare module "lenz:icons/mixed_martial_arts" { export=icon }
declare module "lenz:icons/mixed_reality" { export=icon }
declare module "lenz:icons/molecule" { export=icon }
declare module "lenz:icons/molecule_co" { export=icon }
declare module "lenz:icons/molecule_co2" { export=icon }
declare module "lenz:icons/monitor" { export=icon }
declare module "lenz:icons/monitor_account" { export=icon }
declare module "lenz:icons/monitor_arrow_down" { export=icon }
declare module "lenz:icons/monitor_arrow_down_variant" { export=icon }
declare module "lenz:icons/monitor_cellphone" { export=icon }
declare module "lenz:icons/monitor_cellphone_star" { export=icon }
declare module "lenz:icons/monitor_dashboard" { export=icon }
declare module "lenz:icons/monitor_edit" { export=icon }
declare module "lenz:icons/monitor_eye" { export=icon }
declare module "lenz:icons/monitor_lock" { export=icon }
declare module "lenz:icons/monitor_multiple" { export=icon }
declare module "lenz:icons/monitor_off" { export=icon }
declare module "lenz:icons/monitor_screenshot" { export=icon }
declare module "lenz:icons/monitor_share" { export=icon }
declare module "lenz:icons/monitor_shimmer" { export=icon }
declare module "lenz:icons/monitor_small" { export=icon }
declare module "lenz:icons/monitor_speaker" { export=icon }
declare module "lenz:icons/monitor_speaker_off" { export=icon }
declare module "lenz:icons/monitor_star" { export=icon }
declare module "lenz:icons/monitor_vertical" { export=icon }
declare module "lenz:icons/moon_first_quarter" { export=icon }
declare module "lenz:icons/moon_full" { export=icon }
declare module "lenz:icons/moon_last_quarter" { export=icon }
declare module "lenz:icons/moon_new" { export=icon }
declare module "lenz:icons/moon_waning_crescent" { export=icon }
declare module "lenz:icons/moon_waning_gibbous" { export=icon }
declare module "lenz:icons/moon_waxing_crescent" { export=icon }
declare module "lenz:icons/moon_waxing_gibbous" { export=icon }
declare module "lenz:icons/moped" { export=icon }
declare module "lenz:icons/moped_electric" { export=icon }
declare module "lenz:icons/moped_electric_outline" { export=icon }
declare module "lenz:icons/moped_outline" { export=icon }
declare module "lenz:icons/more" { export=icon }
declare module "lenz:icons/mortar_pestle" { export=icon }
declare module "lenz:icons/mortar_pestle_plus" { export=icon }
declare module "lenz:icons/mosque" { export=icon }
declare module "lenz:icons/mosque_outline" { export=icon }
declare module "lenz:icons/mother_heart" { export=icon }
declare module "lenz:icons/mother_nurse" { export=icon }
declare module "lenz:icons/motion" { export=icon }
declare module "lenz:icons/motion_outline" { export=icon }
declare module "lenz:icons/motion_pause" { export=icon }
declare module "lenz:icons/motion_pause_outline" { export=icon }
declare module "lenz:icons/motion_play" { export=icon }
declare module "lenz:icons/motion_play_outline" { export=icon }
declare module "lenz:icons/motion_sensor" { export=icon }
declare module "lenz:icons/motion_sensor_off" { export=icon }
declare module "lenz:icons/motorbike" { export=icon }
declare module "lenz:icons/motorbike_electric" { export=icon }
declare module "lenz:icons/motorbike_off" { export=icon }
declare module "lenz:icons/mouse" { export=icon }
declare module "lenz:icons/mouse_bluetooth" { export=icon }
declare module "lenz:icons/mouse_left_click" { export=icon }
declare module "lenz:icons/mouse_left_click_outline" { export=icon }
declare module "lenz:icons/mouse_move_down" { export=icon }
declare module "lenz:icons/mouse_move_up" { export=icon }
declare module "lenz:icons/mouse_move_vertical" { export=icon }
declare module "lenz:icons/mouse_off" { export=icon }
declare module "lenz:icons/mouse_outline" { export=icon }
declare module "lenz:icons/mouse_right_click" { export=icon }
declare module "lenz:icons/mouse_right_click_outline" { export=icon }
declare module "lenz:icons/mouse_scroll_wheel" { export=icon }
declare module "lenz:icons/mouse_variant" { export=icon }
declare module "lenz:icons/mouse_variant_off" { export=icon }
declare module "lenz:icons/move_resize" { export=icon }
declare module "lenz:icons/move_resize_variant" { export=icon }
declare module "lenz:icons/movie" { export=icon }
declare module "lenz:icons/movie_check" { export=icon }
declare module "lenz:icons/movie_check_outline" { export=icon }
declare module "lenz:icons/movie_cog" { export=icon }
declare module "lenz:icons/movie_cog_outline" { export=icon }
declare module "lenz:icons/movie_edit" { export=icon }
declare module "lenz:icons/movie_edit_outline" { export=icon }
declare module "lenz:icons/movie_filter" { export=icon }
declare module "lenz:icons/movie_filter_outline" { export=icon }
declare module "lenz:icons/movie_minus" { export=icon }
declare module "lenz:icons/movie_minus_outline" { export=icon }
declare module "lenz:icons/movie_off" { export=icon }
declare module "lenz:icons/movie_off_outline" { export=icon }
declare module "lenz:icons/movie_open" { export=icon }
declare module "lenz:icons/movie_open_check" { export=icon }
declare module "lenz:icons/movie_open_check_outline" { export=icon }
declare module "lenz:icons/movie_open_cog" { export=icon }
declare module "lenz:icons/movie_open_cog_outline" { export=icon }
declare module "lenz:icons/movie_open_edit" { export=icon }
declare module "lenz:icons/movie_open_edit_outline" { export=icon }
declare module "lenz:icons/movie_open_minus" { export=icon }
declare module "lenz:icons/movie_open_minus_outline" { export=icon }
declare module "lenz:icons/movie_open_off" { export=icon }
declare module "lenz:icons/movie_open_off_outline" { export=icon }
declare module "lenz:icons/movie_open_outline" { export=icon }
declare module "lenz:icons/movie_open_play" { export=icon }
declare module "lenz:icons/movie_open_play_outline" { export=icon }
declare module "lenz:icons/movie_open_plus" { export=icon }
declare module "lenz:icons/movie_open_plus_outline" { export=icon }
declare module "lenz:icons/movie_open_remove" { export=icon }
declare module "lenz:icons/movie_open_remove_outline" { export=icon }
declare module "lenz:icons/movie_open_settings" { export=icon }
declare module "lenz:icons/movie_open_settings_outline" { export=icon }
declare module "lenz:icons/movie_open_star" { export=icon }
declare module "lenz:icons/movie_open_star_outline" { export=icon }
declare module "lenz:icons/movie_outline" { export=icon }
declare module "lenz:icons/movie_play" { export=icon }
declare module "lenz:icons/movie_play_outline" { export=icon }
declare module "lenz:icons/movie_plus" { export=icon }
declare module "lenz:icons/movie_plus_outline" { export=icon }
declare module "lenz:icons/movie_remove" { export=icon }
declare module "lenz:icons/movie_remove_outline" { export=icon }
declare module "lenz:icons/movie_roll" { export=icon }
declare module "lenz:icons/movie_search" { export=icon }
declare module "lenz:icons/movie_search_outline" { export=icon }
declare module "lenz:icons/movie_settings" { export=icon }
declare module "lenz:icons/movie_settings_outline" { export=icon }
declare module "lenz:icons/movie_star" { export=icon }
declare module "lenz:icons/movie_star_outline" { export=icon }
declare module "lenz:icons/mower" { export=icon }
declare module "lenz:icons/mower_bag" { export=icon }
declare module "lenz:icons/mower_bag_on" { export=icon }
declare module "lenz:icons/mower_on" { export=icon }
declare module "lenz:icons/muffin" { export=icon }
declare module "lenz:icons/multicast" { export=icon }
declare module "lenz:icons/multimedia" { export=icon }
declare module "lenz:icons/multiplication" { export=icon }
declare module "lenz:icons/multiplication_box" { export=icon }
declare module "lenz:icons/mushroom" { export=icon }
declare module "lenz:icons/mushroom_off" { export=icon }
declare module "lenz:icons/mushroom_off_outline" { export=icon }
declare module "lenz:icons/mushroom_outline" { export=icon }
declare module "lenz:icons/music" { export=icon }
declare module "lenz:icons/music_accidental_double_flat" { export=icon }
declare module "lenz:icons/music_accidental_double_sharp" { export=icon }
declare module "lenz:icons/music_accidental_flat" { export=icon }
declare module "lenz:icons/music_accidental_natural" { export=icon }
declare module "lenz:icons/music_accidental_sharp" { export=icon }
declare module "lenz:icons/music_box" { export=icon }
declare module "lenz:icons/music_box_multiple" { export=icon }
declare module "lenz:icons/music_box_multiple_outline" { export=icon }
declare module "lenz:icons/music_box_outline" { export=icon }
declare module "lenz:icons/music_circle" { export=icon }
declare module "lenz:icons/music_circle_outline" { export=icon }
declare module "lenz:icons/music_clef_alto" { export=icon }
declare module "lenz:icons/music_clef_bass" { export=icon }
declare module "lenz:icons/music_clef_treble" { export=icon }
declare module "lenz:icons/music_note" { export=icon }
declare module "lenz:icons/music_note_bluetooth" { export=icon }
declare module "lenz:icons/music_note_bluetooth_off" { export=icon }
declare module "lenz:icons/music_note_eighth" { export=icon }
declare module "lenz:icons/music_note_eighth_dotted" { export=icon }
declare module "lenz:icons/music_note_half" { export=icon }
declare module "lenz:icons/music_note_half_dotted" { export=icon }
declare module "lenz:icons/music_note_minus" { export=icon }
declare module "lenz:icons/music_note_off" { export=icon }
declare module "lenz:icons/music_note_off_outline" { export=icon }
declare module "lenz:icons/music_note_outline" { export=icon }
declare module "lenz:icons/music_note_plus" { export=icon }
declare module "lenz:icons/music_note_quarter" { export=icon }
declare module "lenz:icons/music_note_quarter_dotted" { export=icon }
declare module "lenz:icons/music_note_sixteenth" { export=icon }
declare module "lenz:icons/music_note_sixteenth_dotted" { export=icon }
declare module "lenz:icons/music_note_whole" { export=icon }
declare module "lenz:icons/music_note_whole_dotted" { export=icon }
declare module "lenz:icons/music_off" { export=icon }
declare module "lenz:icons/music_rest_eighth" { export=icon }
declare module "lenz:icons/music_rest_half" { export=icon }
declare module "lenz:icons/music_rest_quarter" { export=icon }
declare module "lenz:icons/music_rest_sixteenth" { export=icon }
declare module "lenz:icons/music_rest_whole" { export=icon }
declare module "lenz:icons/mustache" { export=icon }
declare module "lenz:icons/nail" { export=icon }
declare module "lenz:icons/nas" { export=icon }
declare module "lenz:icons/nativescript" { export=icon }
declare module "lenz:icons/nature" { export=icon }
declare module "lenz:icons/nature_outline" { export=icon }
declare module "lenz:icons/nature_people" { export=icon }
declare module "lenz:icons/nature_people_outline" { export=icon }
declare module "lenz:icons/navigation" { export=icon }
declare module "lenz:icons/navigation_outline" { export=icon }
declare module "lenz:icons/navigation_variant" { export=icon }
declare module "lenz:icons/navigation_variant_outline" { export=icon }
declare module "lenz:icons/near_me" { export=icon }
declare module "lenz:icons/necklace" { export=icon }
declare module "lenz:icons/needle" { export=icon }
declare module "lenz:icons/needle_off" { export=icon }
declare module "lenz:icons/netflix" { export=icon }
declare module "lenz:icons/network" { export=icon }
declare module "lenz:icons/network_off" { export=icon }
declare module "lenz:icons/network_off_outline" { export=icon }
declare module "lenz:icons/network_outline" { export=icon }
declare module "lenz:icons/network_pos" { export=icon }
declare module "lenz:icons/network_strength1" { export=icon }
declare module "lenz:icons/network_strength1alert" { export=icon }
declare module "lenz:icons/network_strength2" { export=icon }
declare module "lenz:icons/network_strength2alert" { export=icon }
declare module "lenz:icons/network_strength3" { export=icon }
declare module "lenz:icons/network_strength3alert" { export=icon }
declare module "lenz:icons/network_strength4" { export=icon }
declare module "lenz:icons/network_strength4alert" { export=icon }
declare module "lenz:icons/network_strength4cog" { export=icon }
declare module "lenz:icons/network_strength_off" { export=icon }
declare module "lenz:icons/network_strength_off_outline" { export=icon }
declare module "lenz:icons/network_strength_outline" { export=icon }
declare module "lenz:icons/new_box" { export=icon }
declare module "lenz:icons/newspaper" { export=icon }
declare module "lenz:icons/newspaper_check" { export=icon }
declare module "lenz:icons/newspaper_minus" { export=icon }
declare module "lenz:icons/newspaper_plus" { export=icon }
declare module "lenz:icons/newspaper_remove" { export=icon }
declare module "lenz:icons/newspaper_variant" { export=icon }
declare module "lenz:icons/newspaper_variant_multiple" { export=icon }
declare module "lenz:icons/newspaper_variant_multiple_outline" { export=icon }
declare module "lenz:icons/newspaper_variant_outline" { export=icon }
declare module "lenz:icons/nfc" { export=icon }
declare module "lenz:icons/nfc_search_variant" { export=icon }
declare module "lenz:icons/nfc_tap" { export=icon }
declare module "lenz:icons/nfc_variant" { export=icon }
declare module "lenz:icons/nfc_variant_off" { export=icon }
declare module "lenz:icons/ninja" { export=icon }
declare module "lenz:icons/nintendo_game_boy" { export=icon }
declare module "lenz:icons/nintendo_switch" { export=icon }
declare module "lenz:icons/nintendo_wii" { export=icon }
declare module "lenz:icons/nintendo_wiiu" { export=icon }
declare module "lenz:icons/nix" { export=icon }
declare module "lenz:icons/nodejs" { export=icon }
declare module "lenz:icons/noodles" { export=icon }
declare module "lenz:icons/not_equal" { export=icon }
declare module "lenz:icons/not_equal_variant" { export=icon }
declare module "lenz:icons/note" { export=icon }
declare module "lenz:icons/note_alert" { export=icon }
declare module "lenz:icons/note_alert_outline" { export=icon }
declare module "lenz:icons/note_check" { export=icon }
declare module "lenz:icons/note_check_outline" { export=icon }
declare module "lenz:icons/note_edit" { export=icon }
declare module "lenz:icons/note_edit_outline" { export=icon }
declare module "lenz:icons/note_minus" { export=icon }
declare module "lenz:icons/note_minus_outline" { export=icon }
declare module "lenz:icons/note_multiple" { export=icon }
declare module "lenz:icons/note_multiple_outline" { export=icon }
declare module "lenz:icons/note_off" { export=icon }
declare module "lenz:icons/note_off_outline" { export=icon }
declare module "lenz:icons/note_outline" { export=icon }
declare module "lenz:icons/note_plus" { export=icon }
declare module "lenz:icons/note_plus_outline" { export=icon }
declare module "lenz:icons/note_remove" { export=icon }
declare module "lenz:icons/note_remove_outline" { export=icon }
declare module "lenz:icons/note_search" { export=icon }
declare module "lenz:icons/note_search_outline" { export=icon }
declare module "lenz:icons/note_text" { export=icon }
declare module "lenz:icons/note_text_outline" { export=icon }
declare module "lenz:icons/notebook" { export=icon }
declare module "lenz:icons/notebook_check" { export=icon }
declare module "lenz:icons/notebook_check_outline" { export=icon }
declare module "lenz:icons/notebook_edit" { export=icon }
declare module "lenz:icons/notebook_edit_outline" { export=icon }
declare module "lenz:icons/notebook_heart" { export=icon }
declare module "lenz:icons/notebook_heart_outline" { export=icon }
declare module "lenz:icons/notebook_minus" { export=icon }
declare module "lenz:icons/notebook_minus_outline" { export=icon }
declare module "lenz:icons/notebook_multiple" { export=icon }
declare module "lenz:icons/notebook_outline" { export=icon }
declare module "lenz:icons/notebook_plus" { export=icon }
declare module "lenz:icons/notebook_plus_outline" { export=icon }
declare module "lenz:icons/notebook_remove" { export=icon }
declare module "lenz:icons/notebook_remove_outline" { export=icon }
declare module "lenz:icons/notification_clear_all" { export=icon }
declare module "lenz:icons/npm" { export=icon }
declare module "lenz:icons/nuke" { export=icon }
declare module "lenz:icons/null" { export=icon }
declare module "lenz:icons/numeric" { export=icon }
declare module "lenz:icons/numeric0" { export=icon }
declare module "lenz:icons/numeric0box" { export=icon }
declare module "lenz:icons/numeric0box_multiple" { export=icon }
declare module "lenz:icons/numeric0box_multiple_outline" { export=icon }
declare module "lenz:icons/numeric0box_outline" { export=icon }
declare module "lenz:icons/numeric0circle" { export=icon }
declare module "lenz:icons/numeric0circle_outline" { export=icon }
declare module "lenz:icons/numeric1" { export=icon }
declare module "lenz:icons/numeric10" { export=icon }
declare module "lenz:icons/numeric10box" { export=icon }
declare module "lenz:icons/numeric10box_multiple" { export=icon }
declare module "lenz:icons/numeric10box_multiple_outline" { export=icon }
declare module "lenz:icons/numeric10box_outline" { export=icon }
declare module "lenz:icons/numeric10circle" { export=icon }
declare module "lenz:icons/numeric10circle_outline" { export=icon }
declare module "lenz:icons/numeric1box" { export=icon }
declare module "lenz:icons/numeric1box_multiple" { export=icon }
declare module "lenz:icons/numeric1box_multiple_outline" { export=icon }
declare module "lenz:icons/numeric1box_outline" { export=icon }
declare module "lenz:icons/numeric1circle" { export=icon }
declare module "lenz:icons/numeric1circle_outline" { export=icon }
declare module "lenz:icons/numeric2" { export=icon }
declare module "lenz:icons/numeric2box" { export=icon }
declare module "lenz:icons/numeric2box_multiple" { export=icon }
declare module "lenz:icons/numeric2box_multiple_outline" { export=icon }
declare module "lenz:icons/numeric2box_outline" { export=icon }
declare module "lenz:icons/numeric2circle" { export=icon }
declare module "lenz:icons/numeric2circle_outline" { export=icon }
declare module "lenz:icons/numeric3" { export=icon }
declare module "lenz:icons/numeric3box" { export=icon }
declare module "lenz:icons/numeric3box_multiple" { export=icon }
declare module "lenz:icons/numeric3box_multiple_outline" { export=icon }
declare module "lenz:icons/numeric3box_outline" { export=icon }
declare module "lenz:icons/numeric3circle" { export=icon }
declare module "lenz:icons/numeric3circle_outline" { export=icon }
declare module "lenz:icons/numeric4" { export=icon }
declare module "lenz:icons/numeric4box" { export=icon }
declare module "lenz:icons/numeric4box_multiple" { export=icon }
declare module "lenz:icons/numeric4box_multiple_outline" { export=icon }
declare module "lenz:icons/numeric4box_outline" { export=icon }
declare module "lenz:icons/numeric4circle" { export=icon }
declare module "lenz:icons/numeric4circle_outline" { export=icon }
declare module "lenz:icons/numeric5" { export=icon }
declare module "lenz:icons/numeric5box" { export=icon }
declare module "lenz:icons/numeric5box_multiple" { export=icon }
declare module "lenz:icons/numeric5box_multiple_outline" { export=icon }
declare module "lenz:icons/numeric5box_outline" { export=icon }
declare module "lenz:icons/numeric5circle" { export=icon }
declare module "lenz:icons/numeric5circle_outline" { export=icon }
declare module "lenz:icons/numeric6" { export=icon }
declare module "lenz:icons/numeric6box" { export=icon }
declare module "lenz:icons/numeric6box_multiple" { export=icon }
declare module "lenz:icons/numeric6box_multiple_outline" { export=icon }
declare module "lenz:icons/numeric6box_outline" { export=icon }
declare module "lenz:icons/numeric6circle" { export=icon }
declare module "lenz:icons/numeric6circle_outline" { export=icon }
declare module "lenz:icons/numeric7" { export=icon }
declare module "lenz:icons/numeric7box" { export=icon }
declare module "lenz:icons/numeric7box_multiple" { export=icon }
declare module "lenz:icons/numeric7box_multiple_outline" { export=icon }
declare module "lenz:icons/numeric7box_outline" { export=icon }
declare module "lenz:icons/numeric7circle" { export=icon }
declare module "lenz:icons/numeric7circle_outline" { export=icon }
declare module "lenz:icons/numeric8" { export=icon }
declare module "lenz:icons/numeric8box" { export=icon }
declare module "lenz:icons/numeric8box_multiple" { export=icon }
declare module "lenz:icons/numeric8box_multiple_outline" { export=icon }
declare module "lenz:icons/numeric8box_outline" { export=icon }
declare module "lenz:icons/numeric8circle" { export=icon }
declare module "lenz:icons/numeric8circle_outline" { export=icon }
declare module "lenz:icons/numeric9" { export=icon }
declare module "lenz:icons/numeric9box" { export=icon }
declare module "lenz:icons/numeric9box_multiple" { export=icon }
declare module "lenz:icons/numeric9box_multiple_outline" { export=icon }
declare module "lenz:icons/numeric9box_outline" { export=icon }
declare module "lenz:icons/numeric9circle" { export=icon }
declare module "lenz:icons/numeric9circle_outline" { export=icon }
declare module "lenz:icons/numeric9plus" { export=icon }
declare module "lenz:icons/numeric9plus_box" { export=icon }
declare module "lenz:icons/numeric9plus_box_multiple" { export=icon }
declare module "lenz:icons/numeric9plus_box_multiple_outline" { export=icon }
declare module "lenz:icons/numeric9plus_box_outline" { export=icon }
declare module "lenz:icons/numeric9plus_circle" { export=icon }
declare module "lenz:icons/numeric9plus_circle_outline" { export=icon }
declare module "lenz:icons/numeric_negative1" { export=icon }
declare module "lenz:icons/numeric_off" { export=icon }
declare module "lenz:icons/numeric_positive1" { export=icon }
declare module "lenz:icons/nut" { export=icon }
declare module "lenz:icons/nutrition" { export=icon }
declare module "lenz:icons/nuxt" { export=icon }
declare module "lenz:icons/oar" { export=icon }
declare module "lenz:icons/ocarina" { export=icon }
declare module "lenz:icons/oci" { export=icon }
declare module "lenz:icons/ocr" { export=icon }
declare module "lenz:icons/octagon" { export=icon }
declare module "lenz:icons/octagon_outline" { export=icon }
declare module "lenz:icons/octagram" { export=icon }
declare module "lenz:icons/octagram_edit" { export=icon }
declare module "lenz:icons/octagram_edit_outline" { export=icon }
declare module "lenz:icons/octagram_minus" { export=icon }
declare module "lenz:icons/octagram_minus_outline" { export=icon }
declare module "lenz:icons/octagram_outline" { export=icon }
declare module "lenz:icons/octagram_plus" { export=icon }
declare module "lenz:icons/octagram_plus_outline" { export=icon }
declare module "lenz:icons/octahedron" { export=icon }
declare module "lenz:icons/octahedron_off" { export=icon }
declare module "lenz:icons/odnoklassniki" { export=icon }
declare module "lenz:icons/offer" { export=icon }
declare module "lenz:icons/office_building" { export=icon }
declare module "lenz:icons/office_building_cog" { export=icon }
declare module "lenz:icons/office_building_cog_outline" { export=icon }
declare module "lenz:icons/office_building_marker" { export=icon }
declare module "lenz:icons/office_building_marker_outline" { export=icon }
declare module "lenz:icons/office_building_minus" { export=icon }
declare module "lenz:icons/office_building_minus_outline" { export=icon }
declare module "lenz:icons/office_building_outline" { export=icon }
declare module "lenz:icons/office_building_plus" { export=icon }
declare module "lenz:icons/office_building_plus_outline" { export=icon }
declare module "lenz:icons/office_building_remove" { export=icon }
declare module "lenz:icons/office_building_remove_outline" { export=icon }
declare module "lenz:icons/oil" { export=icon }
declare module "lenz:icons/oil_lamp" { export=icon }
declare module "lenz:icons/oil_level" { export=icon }
declare module "lenz:icons/oil_temperature" { export=icon }
declare module "lenz:icons/om" { export=icon }
declare module "lenz:icons/omega" { export=icon }
declare module "lenz:icons/one_up" { export=icon }
declare module "lenz:icons/onepassword" { export=icon }
declare module "lenz:icons/opacity" { export=icon }
declare module "lenz:icons/open_in_app" { export=icon }
declare module "lenz:icons/open_in_new" { export=icon }
declare module "lenz:icons/open_source_initiative" { export=icon }
declare module "lenz:icons/openid" { export=icon }
declare module "lenz:icons/opera" { export=icon }
declare module "lenz:icons/orbit" { export=icon }
declare module "lenz:icons/orbit_variant" { export=icon }
declare module "lenz:icons/order_alphabetical_ascending" { export=icon }
declare module "lenz:icons/order_alphabetical_descending" { export=icon }
declare module "lenz:icons/order_bool_ascending" { export=icon }
declare module "lenz:icons/order_bool_ascending_variant" { export=icon }
declare module "lenz:icons/order_bool_descending" { export=icon }
declare module "lenz:icons/order_bool_descending_variant" { export=icon }
declare module "lenz:icons/order_numeric_ascending" { export=icon }
declare module "lenz:icons/order_numeric_descending" { export=icon }
declare module "lenz:icons/origin" { export=icon }
declare module "lenz:icons/ornament" { export=icon }
declare module "lenz:icons/ornament_variant" { export=icon }
declare module "lenz:icons/outdoor_lamp" { export=icon }
declare module "lenz:icons/overscan" { export=icon }
declare module "lenz:icons/owl" { export=icon }
declare module "lenz:icons/pac_man" { export=icon }
declare module "lenz:icons/package" { export=icon }
declare module "lenz:icons/package_check" { export=icon }
declare module "lenz:icons/package_down" { export=icon }
declare module "lenz:icons/package_up" { export=icon }
declare module "lenz:icons/package_variant" { export=icon }
declare module "lenz:icons/package_variant_closed" { export=icon }
declare module "lenz:icons/package_variant_closed_check" { export=icon }
declare module "lenz:icons/package_variant_closed_minus" { export=icon }
declare module "lenz:icons/package_variant_closed_plus" { export=icon }
declare module "lenz:icons/package_variant_closed_remove" { export=icon }
declare module "lenz:icons/package_variant_minus" { export=icon }
declare module "lenz:icons/package_variant_plus" { export=icon }
declare module "lenz:icons/package_variant_remove" { export=icon }
declare module "lenz:icons/page_first" { export=icon }
declare module "lenz:icons/page_last" { export=icon }
declare module "lenz:icons/page_layout_body" { export=icon }
declare module "lenz:icons/page_layout_footer" { export=icon }
declare module "lenz:icons/page_layout_header" { export=icon }
declare module "lenz:icons/page_layout_header_footer" { export=icon }
declare module "lenz:icons/page_layout_sidebar_left" { export=icon }
declare module "lenz:icons/page_layout_sidebar_right" { export=icon }
declare module "lenz:icons/page_next" { export=icon }
declare module "lenz:icons/page_next_outline" { export=icon }
declare module "lenz:icons/page_previous" { export=icon }
declare module "lenz:icons/page_previous_outline" { export=icon }
declare module "lenz:icons/pail" { export=icon }
declare module "lenz:icons/pail_minus" { export=icon }
declare module "lenz:icons/pail_minus_outline" { export=icon }
declare module "lenz:icons/pail_off" { export=icon }
declare module "lenz:icons/pail_off_outline" { export=icon }
declare module "lenz:icons/pail_outline" { export=icon }
declare module "lenz:icons/pail_plus" { export=icon }
declare module "lenz:icons/pail_plus_outline" { export=icon }
declare module "lenz:icons/pail_remove" { export=icon }
declare module "lenz:icons/pail_remove_outline" { export=icon }
declare module "lenz:icons/palette" { export=icon }
declare module "lenz:icons/palette_advanced" { export=icon }
declare module "lenz:icons/palette_outline" { export=icon }
declare module "lenz:icons/palette_swatch" { export=icon }
declare module "lenz:icons/palette_swatch_outline" { export=icon }
declare module "lenz:icons/palette_swatch_variant" { export=icon }
declare module "lenz:icons/palm_tree" { export=icon }
declare module "lenz:icons/pan" { export=icon }
declare module "lenz:icons/pan_bottom_left" { export=icon }
declare module "lenz:icons/pan_bottom_right" { export=icon }
declare module "lenz:icons/pan_down" { export=icon }
declare module "lenz:icons/pan_horizontal" { export=icon }
declare module "lenz:icons/pan_left" { export=icon }
declare module "lenz:icons/pan_right" { export=icon }
declare module "lenz:icons/pan_top_left" { export=icon }
declare module "lenz:icons/pan_top_right" { export=icon }
declare module "lenz:icons/pan_up" { export=icon }
declare module "lenz:icons/pan_vertical" { export=icon }
declare module "lenz:icons/panda" { export=icon }
declare module "lenz:icons/pandora" { export=icon }
declare module "lenz:icons/panorama" { export=icon }
declare module "lenz:icons/panorama_fisheye" { export=icon }
declare module "lenz:icons/panorama_horizontal" { export=icon }
declare module "lenz:icons/panorama_horizontal_outline" { export=icon }
declare module "lenz:icons/panorama_outline" { export=icon }
declare module "lenz:icons/panorama_sphere" { export=icon }
declare module "lenz:icons/panorama_sphere_outline" { export=icon }
declare module "lenz:icons/panorama_variant" { export=icon }
declare module "lenz:icons/panorama_variant_outline" { export=icon }
declare module "lenz:icons/panorama_vertical" { export=icon }
declare module "lenz:icons/panorama_vertical_outline" { export=icon }
declare module "lenz:icons/panorama_wide_angle" { export=icon }
declare module "lenz:icons/panorama_wide_angle_outline" { export=icon }
declare module "lenz:icons/paper_cut_vertical" { export=icon }
declare module "lenz:icons/paper_roll" { export=icon }
declare module "lenz:icons/paper_roll_outline" { export=icon }
declare module "lenz:icons/paperclip" { export=icon }
declare module "lenz:icons/paperclip_check" { export=icon }
declare module "lenz:icons/paperclip_lock" { export=icon }
declare module "lenz:icons/paperclip_minus" { export=icon }
declare module "lenz:icons/paperclip_off" { export=icon }
declare module "lenz:icons/paperclip_plus" { export=icon }
declare module "lenz:icons/paperclip_remove" { export=icon }
declare module "lenz:icons/parachute" { export=icon }
declare module "lenz:icons/parachute_outline" { export=icon }
declare module "lenz:icons/paragliding" { export=icon }
declare module "lenz:icons/parking" { export=icon }
declare module "lenz:icons/party_popper" { export=icon }
declare module "lenz:icons/passport" { export=icon }
declare module "lenz:icons/passport_alert" { export=icon }
declare module "lenz:icons/passport_biometric" { export=icon }
declare module "lenz:icons/passport_cancel" { export=icon }
declare module "lenz:icons/passport_check" { export=icon }
declare module "lenz:icons/passport_minus" { export=icon }
declare module "lenz:icons/passport_plus" { export=icon }
declare module "lenz:icons/passport_remove" { export=icon }
declare module "lenz:icons/pasta" { export=icon }
declare module "lenz:icons/patio_heater" { export=icon }
declare module "lenz:icons/patreon" { export=icon }
declare module "lenz:icons/pause" { export=icon }
declare module "lenz:icons/pause_box" { export=icon }
declare module "lenz:icons/pause_box_outline" { export=icon }
declare module "lenz:icons/pause_circle" { export=icon }
declare module "lenz:icons/pause_circle_outline" { export=icon }
declare module "lenz:icons/pause_octagon" { export=icon }
declare module "lenz:icons/pause_octagon_outline" { export=icon }
declare module "lenz:icons/paw" { export=icon }
declare module "lenz:icons/paw_off" { export=icon }
declare module "lenz:icons/paw_off_outline" { export=icon }
declare module "lenz:icons/paw_outline" { export=icon }
declare module "lenz:icons/peace" { export=icon }
declare module "lenz:icons/peanut" { export=icon }
declare module "lenz:icons/peanut_off" { export=icon }
declare module "lenz:icons/peanut_off_outline" { export=icon }
declare module "lenz:icons/peanut_outline" { export=icon }
declare module "lenz:icons/pen" { export=icon }
declare module "lenz:icons/pen_lock" { export=icon }
declare module "lenz:icons/pen_minus" { export=icon }
declare module "lenz:icons/pen_off" { export=icon }
declare module "lenz:icons/pen_plus" { export=icon }
declare module "lenz:icons/pen_remove" { export=icon }
declare module "lenz:icons/pencil" { export=icon }
declare module "lenz:icons/pencil_box" { export=icon }
declare module "lenz:icons/pencil_box_multiple" { export=icon }
declare module "lenz:icons/pencil_box_multiple_outline" { export=icon }
declare module "lenz:icons/pencil_box_outline" { export=icon }
declare module "lenz:icons/pencil_circle" { export=icon }
declare module "lenz:icons/pencil_circle_outline" { export=icon }
declare module "lenz:icons/pencil_lock" { export=icon }
declare module "lenz:icons/pencil_lock_outline" { export=icon }
declare module "lenz:icons/pencil_minus" { export=icon }
declare module "lenz:icons/pencil_minus_outline" { export=icon }
declare module "lenz:icons/pencil_off" { export=icon }
declare module "lenz:icons/pencil_off_outline" { export=icon }
declare module "lenz:icons/pencil_outline" { export=icon }
declare module "lenz:icons/pencil_plus" { export=icon }
declare module "lenz:icons/pencil_plus_outline" { export=icon }
declare module "lenz:icons/pencil_remove" { export=icon }
declare module "lenz:icons/pencil_remove_outline" { export=icon }
declare module "lenz:icons/pencil_ruler" { export=icon }
declare module "lenz:icons/pencil_ruler_outline" { export=icon }
declare module "lenz:icons/penguin" { export=icon }
declare module "lenz:icons/pentagon" { export=icon }
declare module "lenz:icons/pentagon_outline" { export=icon }
declare module "lenz:icons/pentagram" { export=icon }
declare module "lenz:icons/percent" { export=icon }
declare module "lenz:icons/percent_box" { export=icon }
declare module "lenz:icons/percent_box_outline" { export=icon }
declare module "lenz:icons/percent_circle" { export=icon }
declare module "lenz:icons/percent_circle_outline" { export=icon }
declare module "lenz:icons/percent_outline" { export=icon }
declare module "lenz:icons/periodic_table" { export=icon }
declare module "lenz:icons/perspective_less" { export=icon }
declare module "lenz:icons/perspective_more" { export=icon }
declare module "lenz:icons/ph" { export=icon }
declare module "lenz:icons/phone" { export=icon }
declare module "lenz:icons/phone_alert" { export=icon }
declare module "lenz:icons/phone_alert_outline" { export=icon }
declare module "lenz:icons/phone_bluetooth" { export=icon }
declare module "lenz:icons/phone_bluetooth_outline" { export=icon }
declare module "lenz:icons/phone_cancel" { export=icon }
declare module "lenz:icons/phone_cancel_outline" { export=icon }
declare module "lenz:icons/phone_check" { export=icon }
declare module "lenz:icons/phone_check_outline" { export=icon }
declare module "lenz:icons/phone_classic" { export=icon }
declare module "lenz:icons/phone_classic_off" { export=icon }
declare module "lenz:icons/phone_clock" { export=icon }
declare module "lenz:icons/phone_dial" { export=icon }
declare module "lenz:icons/phone_dial_outline" { export=icon }
declare module "lenz:icons/phone_forward" { export=icon }
declare module "lenz:icons/phone_forward_outline" { export=icon }
declare module "lenz:icons/phone_hangup" { export=icon }
declare module "lenz:icons/phone_hangup_outline" { export=icon }
declare module "lenz:icons/phone_in_talk" { export=icon }
declare module "lenz:icons/phone_in_talk_outline" { export=icon }
declare module "lenz:icons/phone_incoming" { export=icon }
declare module "lenz:icons/phone_incoming_outgoing" { export=icon }
declare module "lenz:icons/phone_incoming_outgoing_outline" { export=icon }
declare module "lenz:icons/phone_incoming_outline" { export=icon }
declare module "lenz:icons/phone_lock" { export=icon }
declare module "lenz:icons/phone_lock_outline" { export=icon }
declare module "lenz:icons/phone_log" { export=icon }
declare module "lenz:icons/phone_log_outline" { export=icon }
declare module "lenz:icons/phone_message" { export=icon }
declare module "lenz:icons/phone_message_outline" { export=icon }
declare module "lenz:icons/phone_minus" { export=icon }
declare module "lenz:icons/phone_minus_outline" { export=icon }
declare module "lenz:icons/phone_missed" { export=icon }
declare module "lenz:icons/phone_missed_outline" { export=icon }
declare module "lenz:icons/phone_off" { export=icon }
declare module "lenz:icons/phone_off_outline" { export=icon }
declare module "lenz:icons/phone_outgoing" { export=icon }
declare module "lenz:icons/phone_outgoing_outline" { export=icon }
declare module "lenz:icons/phone_outline" { export=icon }
declare module "lenz:icons/phone_paused" { export=icon }
declare module "lenz:icons/phone_paused_outline" { export=icon }
declare module "lenz:icons/phone_plus" { export=icon }
declare module "lenz:icons/phone_plus_outline" { export=icon }
declare module "lenz:icons/phone_refresh" { export=icon }
declare module "lenz:icons/phone_refresh_outline" { export=icon }
declare module "lenz:icons/phone_remove" { export=icon }
declare module "lenz:icons/phone_remove_outline" { export=icon }
declare module "lenz:icons/phone_return" { export=icon }
declare module "lenz:icons/phone_return_outline" { export=icon }
declare module "lenz:icons/phone_ring" { export=icon }
declare module "lenz:icons/phone_ring_outline" { export=icon }
declare module "lenz:icons/phone_rotate_landscape" { export=icon }
declare module "lenz:icons/phone_rotate_portrait" { export=icon }
declare module "lenz:icons/phone_settings" { export=icon }
declare module "lenz:icons/phone_settings_outline" { export=icon }
declare module "lenz:icons/phone_sync" { export=icon }
declare module "lenz:icons/phone_sync_outline" { export=icon }
declare module "lenz:icons/phone_voip" { export=icon }
declare module "lenz:icons/pi" { export=icon }
declare module "lenz:icons/pi_box" { export=icon }
declare module "lenz:icons/pi_hole" { export=icon }
declare module "lenz:icons/piano" { export=icon }
declare module "lenz:icons/piano_off" { export=icon }
declare module "lenz:icons/pickaxe" { export=icon }
declare module "lenz:icons/picture_in_picture_bottom_right" { export=icon }
declare module "lenz:icons/picture_in_picture_bottom_right_outline" { export=icon }
declare module "lenz:icons/picture_in_picture_top_right" { export=icon }
declare module "lenz:icons/picture_in_picture_top_right_outline" { export=icon }
declare module "lenz:icons/pier" { export=icon }
declare module "lenz:icons/pier_crane" { export=icon }
declare module "lenz:icons/pig" { export=icon }
declare module "lenz:icons/pig_variant" { export=icon }
declare module "lenz:icons/pig_variant_outline" { export=icon }
declare module "lenz:icons/piggy_bank" { export=icon }
declare module "lenz:icons/piggy_bank_outline" { export=icon }
declare module "lenz:icons/pill" { export=icon }
declare module "lenz:icons/pill_multiple" { export=icon }
declare module "lenz:icons/pill_off" { export=icon }
declare module "lenz:icons/pillar" { export=icon }
declare module "lenz:icons/pin" { export=icon }
declare module "lenz:icons/pin_off" { export=icon }
declare module "lenz:icons/pin_off_outline" { export=icon }
declare module "lenz:icons/pin_outline" { export=icon }
declare module "lenz:icons/pine_tree" { export=icon }
declare module "lenz:icons/pine_tree_box" { export=icon }
declare module "lenz:icons/pine_tree_fire" { export=icon }
declare module "lenz:icons/pine_tree_variant" { export=icon }
declare module "lenz:icons/pine_tree_variant_outline" { export=icon }
declare module "lenz:icons/pinterest" { export=icon }
declare module "lenz:icons/pinwheel" { export=icon }
declare module "lenz:icons/pinwheel_outline" { export=icon }
declare module "lenz:icons/pipe" { export=icon }
declare module "lenz:icons/pipe_disconnected" { export=icon }
declare module "lenz:icons/pipe_leak" { export=icon }
declare module "lenz:icons/pipe_valve" { export=icon }
declare module "lenz:icons/pipe_wrench" { export=icon }
declare module "lenz:icons/pirate" { export=icon }
declare module "lenz:icons/pistol" { export=icon }
declare module "lenz:icons/piston" { export=icon }
declare module "lenz:icons/pitchfork" { export=icon }
declare module "lenz:icons/pizza" { export=icon }
declare module "lenz:icons/plane_car" { export=icon }
declare module "lenz:icons/plane_train" { export=icon }
declare module "lenz:icons/play" { export=icon }
declare module "lenz:icons/play_box" { export=icon }
declare module "lenz:icons/play_box_edit_outline" { export=icon }
declare module "lenz:icons/play_box_lock" { export=icon }
declare module "lenz:icons/play_box_lock_open" { export=icon }
declare module "lenz:icons/play_box_lock_open_outline" { export=icon }
declare module "lenz:icons/play_box_lock_outline" { export=icon }
declare module "lenz:icons/play_box_multiple" { export=icon }
declare module "lenz:icons/play_box_multiple_outline" { export=icon }
declare module "lenz:icons/play_box_outline" { export=icon }
declare module "lenz:icons/play_circle" { export=icon }
declare module "lenz:icons/play_circle_outline" { export=icon }
declare module "lenz:icons/play_network" { export=icon }
declare module "lenz:icons/play_network_outline" { export=icon }
declare module "lenz:icons/play_outline" { export=icon }
declare module "lenz:icons/play_pause" { export=icon }
declare module "lenz:icons/play_protected_content" { export=icon }
declare module "lenz:icons/play_speed" { export=icon }
declare module "lenz:icons/playlist_check" { export=icon }
declare module "lenz:icons/playlist_edit" { export=icon }
declare module "lenz:icons/playlist_minus" { export=icon }
declare module "lenz:icons/playlist_music" { export=icon }
declare module "lenz:icons/playlist_music_outline" { export=icon }
declare module "lenz:icons/playlist_play" { export=icon }
declare module "lenz:icons/playlist_plus" { export=icon }
declare module "lenz:icons/playlist_remove" { export=icon }
declare module "lenz:icons/playlist_star" { export=icon }
declare module "lenz:icons/plex" { export=icon }
declare module "lenz:icons/pliers" { export=icon }
declare module "lenz:icons/plus" { export=icon }
declare module "lenz:icons/plus_box" { export=icon }
declare module "lenz:icons/plus_box_multiple" { export=icon }
declare module "lenz:icons/plus_box_multiple_outline" { export=icon }
declare module "lenz:icons/plus_box_outline" { export=icon }
declare module "lenz:icons/plus_circle" { export=icon }
declare module "lenz:icons/plus_circle_multiple" { export=icon }
declare module "lenz:icons/plus_circle_multiple_outline" { export=icon }
declare module "lenz:icons/plus_circle_outline" { export=icon }
declare module "lenz:icons/plus_lock" { export=icon }
declare module "lenz:icons/plus_lock_open" { export=icon }
declare module "lenz:icons/plus_minus" { export=icon }
declare module "lenz:icons/plus_minus_box" { export=icon }
declare module "lenz:icons/plus_minus_variant" { export=icon }
declare module "lenz:icons/plus_network" { export=icon }
declare module "lenz:icons/plus_network_outline" { export=icon }
declare module "lenz:icons/plus_outline" { export=icon }
declare module "lenz:icons/plus_thick" { export=icon }
declare module "lenz:icons/pocket" { export=icon }
declare module "lenz:icons/podcast" { export=icon }
declare module "lenz:icons/podium" { export=icon }
declare module "lenz:icons/podium_bronze" { export=icon }
declare module "lenz:icons/podium_gold" { export=icon }
declare module "lenz:icons/podium_silver" { export=icon }
declare module "lenz:icons/point_of_sale" { export=icon }
declare module "lenz:icons/pokeball" { export=icon }
declare module "lenz:icons/pokemon_go" { export=icon }
declare module "lenz:icons/poker_chip" { export=icon }
declare module "lenz:icons/polaroid" { export=icon }
declare module "lenz:icons/police_badge" { export=icon }
declare module "lenz:icons/police_badge_outline" { export=icon }
declare module "lenz:icons/police_station" { export=icon }
declare module "lenz:icons/poll" { export=icon }
declare module "lenz:icons/polo" { export=icon }
declare module "lenz:icons/polymer" { export=icon }
declare module "lenz:icons/pool" { export=icon }
declare module "lenz:icons/pool_thermometer" { export=icon }
declare module "lenz:icons/popcorn" { export=icon }
declare module "lenz:icons/post" { export=icon }
declare module "lenz:icons/post_lamp" { export=icon }
declare module "lenz:icons/post_outline" { export=icon }
declare module "lenz:icons/postage_stamp" { export=icon }
declare module "lenz:icons/pot" { export=icon }
declare module "lenz:icons/pot_mix" { export=icon }
declare module "lenz:icons/pot_mix_outline" { export=icon }
declare module "lenz:icons/pot_outline" { export=icon }
declare module "lenz:icons/pot_steam" { export=icon }
declare module "lenz:icons/pot_steam_outline" { export=icon }
declare module "lenz:icons/pound" { export=icon }
declare module "lenz:icons/pound_box" { export=icon }
declare module "lenz:icons/pound_box_outline" { export=icon }
declare module "lenz:icons/power" { export=icon }
declare module "lenz:icons/power_cycle" { export=icon }
declare module "lenz:icons/power_off" { export=icon }
declare module "lenz:icons/power_on" { export=icon }
declare module "lenz:icons/power_plug" { export=icon }
declare module "lenz:icons/power_plug_battery" { export=icon }
declare module "lenz:icons/power_plug_battery_outline" { export=icon }
declare module "lenz:icons/power_plug_off" { export=icon }
declare module "lenz:icons/power_plug_off_outline" { export=icon }
declare module "lenz:icons/power_plug_outline" { export=icon }
declare module "lenz:icons/power_settings" { export=icon }
declare module "lenz:icons/power_sleep" { export=icon }
declare module "lenz:icons/power_socket" { export=icon }
declare module "lenz:icons/power_socket_au" { export=icon }
declare module "lenz:icons/power_socket_ch" { export=icon }
declare module "lenz:icons/power_socket_de" { export=icon }
declare module "lenz:icons/power_socket_eu" { export=icon }
declare module "lenz:icons/power_socket_fr" { export=icon }
declare module "lenz:icons/power_socket_it" { export=icon }
declare module "lenz:icons/power_socket_jp" { export=icon }
declare module "lenz:icons/power_socket_uk" { export=icon }
declare module "lenz:icons/power_socket_us" { export=icon }
declare module "lenz:icons/power_standby" { export=icon }
declare module "lenz:icons/powershell" { export=icon }
declare module "lenz:icons/prescription" { export=icon }
declare module "lenz:icons/presentation" { export=icon }
declare module "lenz:icons/presentation_play" { export=icon }
declare module "lenz:icons/pretzel" { export=icon }
declare module "lenz:icons/printer" { export=icon }
declare module "lenz:icons/printer3d" { export=icon }
declare module "lenz:icons/printer3d_nozzle" { export=icon }
declare module "lenz:icons/printer3d_nozzle_alert" { export=icon }
declare module "lenz:icons/printer3d_nozzle_alert_outline" { export=icon }
declare module "lenz:icons/printer3d_nozzle_heat" { export=icon }
declare module "lenz:icons/printer3d_nozzle_heat_outline" { export=icon }
declare module "lenz:icons/printer3d_nozzle_off" { export=icon }
declare module "lenz:icons/printer3d_nozzle_off_outline" { export=icon }
declare module "lenz:icons/printer3d_nozzle_outline" { export=icon }
declare module "lenz:icons/printer3d_off" { export=icon }
declare module "lenz:icons/printer_alert" { export=icon }
declare module "lenz:icons/printer_check" { export=icon }
declare module "lenz:icons/printer_eye" { export=icon }
declare module "lenz:icons/printer_off" { export=icon }
declare module "lenz:icons/printer_off_outline" { export=icon }
declare module "lenz:icons/printer_outline" { export=icon }
declare module "lenz:icons/printer_pos" { export=icon }
declare module "lenz:icons/printer_pos_alert" { export=icon }
declare module "lenz:icons/printer_pos_alert_outline" { export=icon }
declare module "lenz:icons/printer_pos_cancel" { export=icon }
declare module "lenz:icons/printer_pos_cancel_outline" { export=icon }
declare module "lenz:icons/printer_pos_check" { export=icon }
declare module "lenz:icons/printer_pos_check_outline" { export=icon }
declare module "lenz:icons/printer_pos_cog" { export=icon }
declare module "lenz:icons/printer_pos_cog_outline" { export=icon }
declare module "lenz:icons/printer_pos_edit" { export=icon }
declare module "lenz:icons/printer_pos_edit_outline" { export=icon }
declare module "lenz:icons/printer_pos_minus" { export=icon }
declare module "lenz:icons/printer_pos_minus_outline" { export=icon }
declare module "lenz:icons/printer_pos_network" { export=icon }
declare module "lenz:icons/printer_pos_network_outline" { export=icon }
declare module "lenz:icons/printer_pos_off" { export=icon }
declare module "lenz:icons/printer_pos_off_outline" { export=icon }
declare module "lenz:icons/printer_pos_outline" { export=icon }
declare module "lenz:icons/printer_pos_pause" { export=icon }
declare module "lenz:icons/printer_pos_pause_outline" { export=icon }
declare module "lenz:icons/printer_pos_play" { export=icon }
declare module "lenz:icons/printer_pos_play_outline" { export=icon }
declare module "lenz:icons/printer_pos_plus" { export=icon }
declare module "lenz:icons/printer_pos_plus_outline" { export=icon }
declare module "lenz:icons/printer_pos_refresh" { export=icon }
declare module "lenz:icons/printer_pos_refresh_outline" { export=icon }
declare module "lenz:icons/printer_pos_remove" { export=icon }
declare module "lenz:icons/printer_pos_remove_outline" { export=icon }
declare module "lenz:icons/printer_pos_star" { export=icon }
declare module "lenz:icons/printer_pos_star_outline" { export=icon }
declare module "lenz:icons/printer_pos_stop" { export=icon }
declare module "lenz:icons/printer_pos_stop_outline" { export=icon }
declare module "lenz:icons/printer_pos_sync" { export=icon }
declare module "lenz:icons/printer_pos_sync_outline" { export=icon }
declare module "lenz:icons/printer_pos_wrench" { export=icon }
declare module "lenz:icons/printer_pos_wrench_outline" { export=icon }
declare module "lenz:icons/printer_search" { export=icon }
declare module "lenz:icons/printer_settings" { export=icon }
declare module "lenz:icons/printer_wireless" { export=icon }
declare module "lenz:icons/priority_high" { export=icon }
declare module "lenz:icons/priority_low" { export=icon }
declare module "lenz:icons/professional_hexagon" { export=icon }
declare module "lenz:icons/progress_alert" { export=icon }
declare module "lenz:icons/progress_check" { export=icon }
declare module "lenz:icons/progress_clock" { export=icon }
declare module "lenz:icons/progress_close" { export=icon }
declare module "lenz:icons/progress_download" { export=icon }
declare module "lenz:icons/progress_helper" { export=icon }
declare module "lenz:icons/progress_pencil" { export=icon }
declare module "lenz:icons/progress_question" { export=icon }
declare module "lenz:icons/progress_star" { export=icon }
declare module "lenz:icons/progress_star_four_points" { export=icon }
declare module "lenz:icons/progress_tag" { export=icon }
declare module "lenz:icons/progress_upload" { export=icon }
declare module "lenz:icons/progress_wrench" { export=icon }
declare module "lenz:icons/projector" { export=icon }
declare module "lenz:icons/projector_off" { export=icon }
declare module "lenz:icons/projector_screen" { export=icon }
declare module "lenz:icons/projector_screen_off" { export=icon }
declare module "lenz:icons/projector_screen_off_outline" { export=icon }
declare module "lenz:icons/projector_screen_outline" { export=icon }
declare module "lenz:icons/projector_screen_variant" { export=icon }
declare module "lenz:icons/projector_screen_variant_off" { export=icon }
declare module "lenz:icons/projector_screen_variant_off_outline" { export=icon }
declare module "lenz:icons/projector_screen_variant_outline" { export=icon }
declare module "lenz:icons/propane_tank" { export=icon }
declare module "lenz:icons/propane_tank_outline" { export=icon }
declare module "lenz:icons/protocol" { export=icon }
declare module "lenz:icons/publish" { export=icon }
declare module "lenz:icons/publish_off" { export=icon }
declare module "lenz:icons/pulse" { export=icon }
declare module "lenz:icons/pump" { export=icon }
declare module "lenz:icons/pump_off" { export=icon }
declare module "lenz:icons/pumpkin" { export=icon }
declare module "lenz:icons/purse" { export=icon }
declare module "lenz:icons/purse_outline" { export=icon }
declare module "lenz:icons/puzzle" { export=icon }
declare module "lenz:icons/puzzle_check" { export=icon }
declare module "lenz:icons/puzzle_check_outline" { export=icon }
declare module "lenz:icons/puzzle_edit" { export=icon }
declare module "lenz:icons/puzzle_edit_outline" { export=icon }
declare module "lenz:icons/puzzle_heart" { export=icon }
declare module "lenz:icons/puzzle_heart_outline" { export=icon }
declare module "lenz:icons/puzzle_minus" { export=icon }
declare module "lenz:icons/puzzle_minus_outline" { export=icon }
declare module "lenz:icons/puzzle_outline" { export=icon }
declare module "lenz:icons/puzzle_plus" { export=icon }
declare module "lenz:icons/puzzle_plus_outline" { export=icon }
declare module "lenz:icons/puzzle_remove" { export=icon }
declare module "lenz:icons/puzzle_remove_outline" { export=icon }
declare module "lenz:icons/puzzle_star" { export=icon }
declare module "lenz:icons/puzzle_star_outline" { export=icon }
declare module "lenz:icons/pyramid" { export=icon }
declare module "lenz:icons/pyramid_off" { export=icon }
declare module "lenz:icons/qi" { export=icon }
declare module "lenz:icons/qqchat" { export=icon }
declare module "lenz:icons/qrcode" { export=icon }
declare module "lenz:icons/qrcode_edit" { export=icon }
declare module "lenz:icons/qrcode_minus" { export=icon }
declare module "lenz:icons/qrcode_plus" { export=icon }
declare module "lenz:icons/qrcode_remove" { export=icon }
declare module "lenz:icons/qrcode_scan" { export=icon }
declare module "lenz:icons/quadcopter" { export=icon }
declare module "lenz:icons/quality_high" { export=icon }
declare module "lenz:icons/quality_low" { export=icon }
declare module "lenz:icons/quality_medium" { export=icon }
declare module "lenz:icons/queue_first_in_last_out" { export=icon }
declare module "lenz:icons/quora" { export=icon }
declare module "lenz:icons/rabbit" { export=icon }
declare module "lenz:icons/rabbit_variant" { export=icon }
declare module "lenz:icons/rabbit_variant_outline" { export=icon }
declare module "lenz:icons/racing_helmet" { export=icon }
declare module "lenz:icons/racquetball" { export=icon }
declare module "lenz:icons/radar" { export=icon }
declare module "lenz:icons/radiator" { export=icon }
declare module "lenz:icons/radiator_disabled" { export=icon }
declare module "lenz:icons/radiator_off" { export=icon }
declare module "lenz:icons/radio" { export=icon }
declare module "lenz:icons/radio_am" { export=icon }
declare module "lenz:icons/radio_fm" { export=icon }
declare module "lenz:icons/radio_handheld" { export=icon }
declare module "lenz:icons/radio_off" { export=icon }
declare module "lenz:icons/radio_tower" { export=icon }
declare module "lenz:icons/radioactive" { export=icon }
declare module "lenz:icons/radioactive_circle" { export=icon }
declare module "lenz:icons/radioactive_circle_outline" { export=icon }
declare module "lenz:icons/radioactive_off" { export=icon }
declare module "lenz:icons/radiobox_blank" { export=icon }
declare module "lenz:icons/radiobox_indeterminate_variant" { export=icon }
declare module "lenz:icons/radiobox_marked" { export=icon }
declare module "lenz:icons/radiology_box" { export=icon }
declare module "lenz:icons/radiology_box_outline" { export=icon }
declare module "lenz:icons/radius" { export=icon }
declare module "lenz:icons/radius_outline" { export=icon }
declare module "lenz:icons/railroad_light" { export=icon }
declare module "lenz:icons/rake" { export=icon }
declare module "lenz:icons/raspberry_pi" { export=icon }
declare module "lenz:icons/raw" { export=icon }
declare module "lenz:icons/raw_off" { export=icon }
declare module "lenz:icons/ray_end" { export=icon }
declare module "lenz:icons/ray_end_arrow" { export=icon }
declare module "lenz:icons/ray_start" { export=icon }
declare module "lenz:icons/ray_start_arrow" { export=icon }
declare module "lenz:icons/ray_start_end" { export=icon }
declare module "lenz:icons/ray_start_vertex_end" { export=icon }
declare module "lenz:icons/ray_vertex" { export=icon }
declare module "lenz:icons/razor_double_edge" { export=icon }
declare module "lenz:icons/razor_single_edge" { export=icon }
declare module "lenz:icons/react" { export=icon }
declare module "lenz:icons/read" { export=icon }
declare module "lenz:icons/receipt" { export=icon }
declare module "lenz:icons/receipt_clock" { export=icon }
declare module "lenz:icons/receipt_clock_outline" { export=icon }
declare module "lenz:icons/receipt_outline" { export=icon }
declare module "lenz:icons/receipt_send" { export=icon }
declare module "lenz:icons/receipt_send_outline" { export=icon }
declare module "lenz:icons/receipt_text" { export=icon }
declare module "lenz:icons/receipt_text_arrow_left" { export=icon }
declare module "lenz:icons/receipt_text_arrow_left_outline" { export=icon }
declare module "lenz:icons/receipt_text_arrow_right" { export=icon }
declare module "lenz:icons/receipt_text_arrow_right_outline" { export=icon }
declare module "lenz:icons/receipt_text_check" { export=icon }
declare module "lenz:icons/receipt_text_check_outline" { export=icon }
declare module "lenz:icons/receipt_text_clock" { export=icon }
declare module "lenz:icons/receipt_text_clock_outline" { export=icon }
declare module "lenz:icons/receipt_text_edit" { export=icon }
declare module "lenz:icons/receipt_text_edit_outline" { export=icon }
declare module "lenz:icons/receipt_text_minus" { export=icon }
declare module "lenz:icons/receipt_text_minus_outline" { export=icon }
declare module "lenz:icons/receipt_text_outline" { export=icon }
declare module "lenz:icons/receipt_text_plus" { export=icon }
declare module "lenz:icons/receipt_text_plus_outline" { export=icon }
declare module "lenz:icons/receipt_text_remove" { export=icon }
declare module "lenz:icons/receipt_text_remove_outline" { export=icon }
declare module "lenz:icons/receipt_text_send" { export=icon }
declare module "lenz:icons/receipt_text_send_outline" { export=icon }
declare module "lenz:icons/record" { export=icon }
declare module "lenz:icons/record_circle" { export=icon }
declare module "lenz:icons/record_circle_outline" { export=icon }
declare module "lenz:icons/record_player" { export=icon }
declare module "lenz:icons/record_rec" { export=icon }
declare module "lenz:icons/rectangle" { export=icon }
declare module "lenz:icons/rectangle_outline" { export=icon }
declare module "lenz:icons/recycle" { export=icon }
declare module "lenz:icons/recycle_variant" { export=icon }
declare module "lenz:icons/reddit" { export=icon }
declare module "lenz:icons/redhat" { export=icon }
declare module "lenz:icons/redo" { export=icon }
declare module "lenz:icons/redo_variant" { export=icon }
declare module "lenz:icons/reflect_horizontal" { export=icon }
declare module "lenz:icons/reflect_vertical" { export=icon }
declare module "lenz:icons/refresh" { export=icon }
declare module "lenz:icons/refresh_auto" { export=icon }
declare module "lenz:icons/refresh_circle" { export=icon }
declare module "lenz:icons/regex" { export=icon }
declare module "lenz:icons/registered_trademark" { export=icon }
declare module "lenz:icons/reiterate" { export=icon }
declare module "lenz:icons/relation_many_to_many" { export=icon }
declare module "lenz:icons/relation_many_to_one" { export=icon }
declare module "lenz:icons/relation_many_to_one_or_many" { export=icon }
declare module "lenz:icons/relation_many_to_only_one" { export=icon }
declare module "lenz:icons/relation_many_to_zero_or_many" { export=icon }
declare module "lenz:icons/relation_many_to_zero_or_one" { export=icon }
declare module "lenz:icons/relation_one_or_many_to_many" { export=icon }
declare module "lenz:icons/relation_one_or_many_to_one" { export=icon }
declare module "lenz:icons/relation_one_or_many_to_one_or_many" { export=icon }
declare module "lenz:icons/relation_one_or_many_to_only_one" { export=icon }
declare module "lenz:icons/relation_one_or_many_to_zero_or_many" { export=icon }
declare module "lenz:icons/relation_one_or_many_to_zero_or_one" { export=icon }
declare module "lenz:icons/relation_one_to_many" { export=icon }
declare module "lenz:icons/relation_one_to_one" { export=icon }
declare module "lenz:icons/relation_one_to_one_or_many" { export=icon }
declare module "lenz:icons/relation_one_to_only_one" { export=icon }
declare module "lenz:icons/relation_one_to_zero_or_many" { export=icon }
declare module "lenz:icons/relation_one_to_zero_or_one" { export=icon }
declare module "lenz:icons/relation_only_one_to_many" { export=icon }
declare module "lenz:icons/relation_only_one_to_one" { export=icon }
declare module "lenz:icons/relation_only_one_to_one_or_many" { export=icon }
declare module "lenz:icons/relation_only_one_to_only_one" { export=icon }
declare module "lenz:icons/relation_only_one_to_zero_or_many" { export=icon }
declare module "lenz:icons/relation_only_one_to_zero_or_one" { export=icon }
declare module "lenz:icons/relation_zero_or_many_to_many" { export=icon }
declare module "lenz:icons/relation_zero_or_many_to_one" { export=icon }
declare module "lenz:icons/relation_zero_or_many_to_one_or_many" { export=icon }
declare module "lenz:icons/relation_zero_or_many_to_only_one" { export=icon }
declare module "lenz:icons/relation_zero_or_many_to_zero_or_many" { export=icon }
declare module "lenz:icons/relation_zero_or_many_to_zero_or_one" { export=icon }
declare module "lenz:icons/relation_zero_or_one_to_many" { export=icon }
declare module "lenz:icons/relation_zero_or_one_to_one" { export=icon }
declare module "lenz:icons/relation_zero_or_one_to_one_or_many" { export=icon }
declare module "lenz:icons/relation_zero_or_one_to_only_one" { export=icon }
declare module "lenz:icons/relation_zero_or_one_to_zero_or_many" { export=icon }
declare module "lenz:icons/relation_zero_or_one_to_zero_or_one" { export=icon }
declare module "lenz:icons/relative_scale" { export=icon }
declare module "lenz:icons/reload" { export=icon }
declare module "lenz:icons/reload_alert" { export=icon }
declare module "lenz:icons/reminder" { export=icon }
declare module "lenz:icons/remote" { export=icon }
declare module "lenz:icons/remote_desktop" { export=icon }
declare module "lenz:icons/remote_off" { export=icon }
declare module "lenz:icons/remote_tv" { export=icon }
declare module "lenz:icons/remote_tv_off" { export=icon }
declare module "lenz:icons/rename" { export=icon }
declare module "lenz:icons/rename_box" { export=icon }
declare module "lenz:icons/rename_box_outline" { export=icon }
declare module "lenz:icons/rename_outline" { export=icon }
declare module "lenz:icons/reorder_horizontal" { export=icon }
declare module "lenz:icons/reorder_vertical" { export=icon }
declare module "lenz:icons/repeat" { export=icon }
declare module "lenz:icons/repeat_off" { export=icon }
declare module "lenz:icons/repeat_once" { export=icon }
declare module "lenz:icons/repeat_variant" { export=icon }
declare module "lenz:icons/replay" { export=icon }
declare module "lenz:icons/reply" { export=icon }
declare module "lenz:icons/reply_all" { export=icon }
declare module "lenz:icons/reply_all_outline" { export=icon }
declare module "lenz:icons/reply_circle" { export=icon }
declare module "lenz:icons/reply_outline" { export=icon }
declare module "lenz:icons/reproduction" { export=icon }
declare module "lenz:icons/resistor" { export=icon }
declare module "lenz:icons/resistor_nodes" { export=icon }
declare module "lenz:icons/resize" { export=icon }
declare module "lenz:icons/resize_bottom_right" { export=icon }
declare module "lenz:icons/responsive" { export=icon }
declare module "lenz:icons/restart" { export=icon }
declare module "lenz:icons/restart_alert" { export=icon }
declare module "lenz:icons/restart_off" { export=icon }
declare module "lenz:icons/restore" { export=icon }
declare module "lenz:icons/restore_alert" { export=icon }
declare module "lenz:icons/rewind" { export=icon }
declare module "lenz:icons/rewind10" { export=icon }
declare module "lenz:icons/rewind15" { export=icon }
declare module "lenz:icons/rewind30" { export=icon }
declare module "lenz:icons/rewind45" { export=icon }
declare module "lenz:icons/rewind5" { export=icon }
declare module "lenz:icons/rewind60" { export=icon }
declare module "lenz:icons/rewind_outline" { export=icon }
declare module "lenz:icons/rhombus" { export=icon }
declare module "lenz:icons/rhombus_medium" { export=icon }
declare module "lenz:icons/rhombus_medium_outline" { export=icon }
declare module "lenz:icons/rhombus_outline" { export=icon }
declare module "lenz:icons/rhombus_split" { export=icon }
declare module "lenz:icons/rhombus_split_outline" { export=icon }
declare module "lenz:icons/ribbon" { export=icon }
declare module "lenz:icons/rice" { export=icon }
declare module "lenz:icons/rickshaw" { export=icon }
declare module "lenz:icons/rickshaw_electric" { export=icon }
declare module "lenz:icons/ring" { export=icon }
declare module "lenz:icons/rivet" { export=icon }
declare module "lenz:icons/road" { export=icon }
declare module "lenz:icons/road_variant" { export=icon }
declare module "lenz:icons/robber" { export=icon }
declare module "lenz:icons/robot" { export=icon }
declare module "lenz:icons/robot_angry" { export=icon }
declare module "lenz:icons/robot_angry_outline" { export=icon }
declare module "lenz:icons/robot_confused" { export=icon }
declare module "lenz:icons/robot_confused_outline" { export=icon }
declare module "lenz:icons/robot_dead" { export=icon }
declare module "lenz:icons/robot_dead_outline" { export=icon }
declare module "lenz:icons/robot_excited" { export=icon }
declare module "lenz:icons/robot_excited_outline" { export=icon }
declare module "lenz:icons/robot_happy" { export=icon }
declare module "lenz:icons/robot_happy_outline" { export=icon }
declare module "lenz:icons/robot_industrial" { export=icon }
declare module "lenz:icons/robot_industrial_outline" { export=icon }
declare module "lenz:icons/robot_love" { export=icon }
declare module "lenz:icons/robot_love_outline" { export=icon }
declare module "lenz:icons/robot_mower" { export=icon }
declare module "lenz:icons/robot_mower_outline" { export=icon }
declare module "lenz:icons/robot_off" { export=icon }
declare module "lenz:icons/robot_off_outline" { export=icon }
declare module "lenz:icons/robot_outline" { export=icon }
declare module "lenz:icons/robot_vacuum" { export=icon }
declare module "lenz:icons/robot_vacuum_alert" { export=icon }
declare module "lenz:icons/robot_vacuum_off" { export=icon }
declare module "lenz:icons/robot_vacuum_variant" { export=icon }
declare module "lenz:icons/robot_vacuum_variant_alert" { export=icon }
declare module "lenz:icons/robot_vacuum_variant_off" { export=icon }
declare module "lenz:icons/rocket" { export=icon }
declare module "lenz:icons/rocket_launch" { export=icon }
declare module "lenz:icons/rocket_launch_outline" { export=icon }
declare module "lenz:icons/rocket_outline" { export=icon }
declare module "lenz:icons/rodent" { export=icon }
declare module "lenz:icons/roller_shade" { export=icon }
declare module "lenz:icons/roller_shade_closed" { export=icon }
declare module "lenz:icons/roller_skate" { export=icon }
declare module "lenz:icons/roller_skate_off" { export=icon }
declare module "lenz:icons/rollerblade" { export=icon }
declare module "lenz:icons/rollerblade_off" { export=icon }
declare module "lenz:icons/rollupjs" { export=icon }
declare module "lenz:icons/rolodex" { export=icon }
declare module "lenz:icons/rolodex_outline" { export=icon }
declare module "lenz:icons/roman_numeral1" { export=icon }
declare module "lenz:icons/roman_numeral10" { export=icon }
declare module "lenz:icons/roman_numeral2" { export=icon }
declare module "lenz:icons/roman_numeral3" { export=icon }
declare module "lenz:icons/roman_numeral4" { export=icon }
declare module "lenz:icons/roman_numeral5" { export=icon }
declare module "lenz:icons/roman_numeral6" { export=icon }
declare module "lenz:icons/roman_numeral7" { export=icon }
declare module "lenz:icons/roman_numeral8" { export=icon }
declare module "lenz:icons/roman_numeral9" { export=icon }
declare module "lenz:icons/room_service" { export=icon }
declare module "lenz:icons/room_service_outline" { export=icon }
declare module "lenz:icons/rotate360" { export=icon }
declare module "lenz:icons/rotate3d" { export=icon }
declare module "lenz:icons/rotate3d_variant" { export=icon }
declare module "lenz:icons/rotate_left" { export=icon }
declare module "lenz:icons/rotate_left_variant" { export=icon }
declare module "lenz:icons/rotate_orbit" { export=icon }
declare module "lenz:icons/rotate_right" { export=icon }
declare module "lenz:icons/rotate_right_variant" { export=icon }
declare module "lenz:icons/rounded_corner" { export=icon }
declare module "lenz:icons/router" { export=icon }
declare module "lenz:icons/router_network" { export=icon }
declare module "lenz:icons/router_network_wireless" { export=icon }
declare module "lenz:icons/router_wireless" { export=icon }
declare module "lenz:icons/router_wireless_off" { export=icon }
declare module "lenz:icons/router_wireless_settings" { export=icon }
declare module "lenz:icons/routes" { export=icon }
declare module "lenz:icons/routes_clock" { export=icon }
declare module "lenz:icons/rowing" { export=icon }
declare module "lenz:icons/rss" { export=icon }
declare module "lenz:icons/rss_box" { export=icon }
declare module "lenz:icons/rss_off" { export=icon }
declare module "lenz:icons/rug" { export=icon }
declare module "lenz:icons/rugby" { export=icon }
declare module "lenz:icons/ruler" { export=icon }
declare module "lenz:icons/ruler_square" { export=icon }
declare module "lenz:icons/ruler_square_compass" { export=icon }
declare module "lenz:icons/run" { export=icon }
declare module "lenz:icons/run_fast" { export=icon }
declare module "lenz:icons/rv_truck" { export=icon }
declare module "lenz:icons/sack" { export=icon }
declare module "lenz:icons/sack_outline" { export=icon }
declare module "lenz:icons/sack_percent" { export=icon }
declare module "lenz:icons/safe" { export=icon }
declare module "lenz:icons/safe_square" { export=icon }
declare module "lenz:icons/safe_square_outline" { export=icon }
declare module "lenz:icons/safety_goggles" { export=icon }
declare module "lenz:icons/sail_boat" { export=icon }
declare module "lenz:icons/sail_boat_sink" { export=icon }
declare module "lenz:icons/sale" { export=icon }
declare module "lenz:icons/sale_outline" { export=icon }
declare module "lenz:icons/salesforce" { export=icon }
declare module "lenz:icons/sass" { export=icon }
declare module "lenz:icons/satellite" { export=icon }
declare module "lenz:icons/satellite_uplink" { export=icon }
declare module "lenz:icons/satellite_variant" { export=icon }
declare module "lenz:icons/sausage" { export=icon }
declare module "lenz:icons/sausage_off" { export=icon }
declare module "lenz:icons/saw_blade" { export=icon }
declare module "lenz:icons/sawtooth_wave" { export=icon }
declare module "lenz:icons/saxophone" { export=icon }
declare module "lenz:icons/scale" { export=icon }
declare module "lenz:icons/scale_balance" { export=icon }
declare module "lenz:icons/scale_bathroom" { export=icon }
declare module "lenz:icons/scale_off" { export=icon }
declare module "lenz:icons/scale_unbalanced" { export=icon }
declare module "lenz:icons/scan_helper" { export=icon }
declare module "lenz:icons/scanner" { export=icon }
declare module "lenz:icons/scanner_off" { export=icon }
declare module "lenz:icons/scatter_plot" { export=icon }
declare module "lenz:icons/scatter_plot_outline" { export=icon }
declare module "lenz:icons/scent" { export=icon }
declare module "lenz:icons/scent_off" { export=icon }
declare module "lenz:icons/school" { export=icon }
declare module "lenz:icons/school_outline" { export=icon }
declare module "lenz:icons/scissors_cutting" { export=icon }
declare module "lenz:icons/scooter" { export=icon }
declare module "lenz:icons/scooter_electric" { export=icon }
declare module "lenz:icons/scoreboard" { export=icon }
declare module "lenz:icons/scoreboard_outline" { export=icon }
declare module "lenz:icons/screen_rotation" { export=icon }
declare module "lenz:icons/screen_rotation_lock" { export=icon }
declare module "lenz:icons/screw_flat_top" { export=icon }
declare module "lenz:icons/screw_lag" { export=icon }
declare module "lenz:icons/screw_machine_flat_top" { export=icon }
declare module "lenz:icons/screw_machine_round_top" { export=icon }
declare module "lenz:icons/screw_round_top" { export=icon }
declare module "lenz:icons/screwdriver" { export=icon }
declare module "lenz:icons/script" { export=icon }
declare module "lenz:icons/script_outline" { export=icon }
declare module "lenz:icons/script_text" { export=icon }
declare module "lenz:icons/script_text_key" { export=icon }
declare module "lenz:icons/script_text_key_outline" { export=icon }
declare module "lenz:icons/script_text_outline" { export=icon }
declare module "lenz:icons/script_text_play" { export=icon }
declare module "lenz:icons/script_text_play_outline" { export=icon }
declare module "lenz:icons/sd" { export=icon }
declare module "lenz:icons/seal" { export=icon }
declare module "lenz:icons/seal_variant" { export=icon }
declare module "lenz:icons/search_web" { export=icon }
declare module "lenz:icons/seat" { export=icon }
declare module "lenz:icons/seat_flat" { export=icon }
declare module "lenz:icons/seat_flat_angled" { export=icon }
declare module "lenz:icons/seat_individual_suite" { export=icon }
declare module "lenz:icons/seat_legroom_extra" { export=icon }
declare module "lenz:icons/seat_legroom_normal" { export=icon }
declare module "lenz:icons/seat_legroom_reduced" { export=icon }
declare module "lenz:icons/seat_outline" { export=icon }
declare module "lenz:icons/seat_passenger" { export=icon }
declare module "lenz:icons/seat_recline_extra" { export=icon }
declare module "lenz:icons/seat_recline_normal" { export=icon }
declare module "lenz:icons/seatbelt" { export=icon }
declare module "lenz:icons/security" { export=icon }
declare module "lenz:icons/security_network" { export=icon }
declare module "lenz:icons/seed" { export=icon }
declare module "lenz:icons/seed_off" { export=icon }
declare module "lenz:icons/seed_off_outline" { export=icon }
declare module "lenz:icons/seed_outline" { export=icon }
declare module "lenz:icons/seed_plus" { export=icon }
declare module "lenz:icons/seed_plus_outline" { export=icon }
declare module "lenz:icons/seesaw" { export=icon }
declare module "lenz:icons/segment" { export=icon }
declare module "lenz:icons/select" { export=icon }
declare module "lenz:icons/select_all" { export=icon }
declare module "lenz:icons/select_arrow_down" { export=icon }
declare module "lenz:icons/select_arrow_up" { export=icon }
declare module "lenz:icons/select_color" { export=icon }
declare module "lenz:icons/select_compare" { export=icon }
declare module "lenz:icons/select_drag" { export=icon }
declare module "lenz:icons/select_group" { export=icon }
declare module "lenz:icons/select_inverse" { export=icon }
declare module "lenz:icons/select_marker" { export=icon }
declare module "lenz:icons/select_multiple" { export=icon }
declare module "lenz:icons/select_multiple_marker" { export=icon }
declare module "lenz:icons/select_off" { export=icon }
declare module "lenz:icons/select_place" { export=icon }
declare module "lenz:icons/select_remove" { export=icon }
declare module "lenz:icons/select_search" { export=icon }
declare module "lenz:icons/selection" { export=icon }
declare module "lenz:icons/selection_drag" { export=icon }
declare module "lenz:icons/selection_ellipse" { export=icon }
declare module "lenz:icons/selection_ellipse_arrow_inside" { export=icon }
declare module "lenz:icons/selection_ellipse_remove" { export=icon }
declare module "lenz:icons/selection_marker" { export=icon }
declare module "lenz:icons/selection_multiple" { export=icon }
declare module "lenz:icons/selection_multiple_marker" { export=icon }
declare module "lenz:icons/selection_off" { export=icon }
declare module "lenz:icons/selection_remove" { export=icon }
declare module "lenz:icons/selection_search" { export=icon }
declare module "lenz:icons/semantic_web" { export=icon }
declare module "lenz:icons/send" { export=icon }
declare module "lenz:icons/send_check" { export=icon }
declare module "lenz:icons/send_check_outline" { export=icon }
declare module "lenz:icons/send_circle" { export=icon }
declare module "lenz:icons/send_circle_outline" { export=icon }
declare module "lenz:icons/send_clock" { export=icon }
declare module "lenz:icons/send_clock_outline" { export=icon }
declare module "lenz:icons/send_lock" { export=icon }
declare module "lenz:icons/send_lock_outline" { export=icon }
declare module "lenz:icons/send_outline" { export=icon }
declare module "lenz:icons/send_variant" { export=icon }
declare module "lenz:icons/send_variant_clock" { export=icon }
declare module "lenz:icons/send_variant_clock_outline" { export=icon }
declare module "lenz:icons/send_variant_outline" { export=icon }
declare module "lenz:icons/serial_port" { export=icon }
declare module "lenz:icons/server" { export=icon }
declare module "lenz:icons/server_minus" { export=icon }
declare module "lenz:icons/server_minus_outline" { export=icon }
declare module "lenz:icons/server_network" { export=icon }
declare module "lenz:icons/server_network_off" { export=icon }
declare module "lenz:icons/server_network_outline" { export=icon }
declare module "lenz:icons/server_off" { export=icon }
declare module "lenz:icons/server_outline" { export=icon }
declare module "lenz:icons/server_plus" { export=icon }
declare module "lenz:icons/server_plus_outline" { export=icon }
declare module "lenz:icons/server_remove" { export=icon }
declare module "lenz:icons/server_security" { export=icon }
declare module "lenz:icons/set_all" { export=icon }
declare module "lenz:icons/set_center" { export=icon }
declare module "lenz:icons/set_center_right" { export=icon }
declare module "lenz:icons/set_left" { export=icon }
declare module "lenz:icons/set_left_center" { export=icon }
declare module "lenz:icons/set_left_right" { export=icon }
declare module "lenz:icons/set_merge" { export=icon }
declare module "lenz:icons/set_none" { export=icon }
declare module "lenz:icons/set_right" { export=icon }
declare module "lenz:icons/set_split" { export=icon }
declare module "lenz:icons/set_square" { export=icon }
declare module "lenz:icons/set_top_box" { export=icon }
declare module "lenz:icons/settings_helper" { export=icon }
declare module "lenz:icons/shaker" { export=icon }
declare module "lenz:icons/shaker_outline" { export=icon }
declare module "lenz:icons/shape" { export=icon }
declare module "lenz:icons/shape_circle_plus" { export=icon }
declare module "lenz:icons/shape_outline" { export=icon }
declare module "lenz:icons/shape_oval_plus" { export=icon }
declare module "lenz:icons/shape_plus" { export=icon }
declare module "lenz:icons/shape_plus_outline" { export=icon }
declare module "lenz:icons/shape_polygon_plus" { export=icon }
declare module "lenz:icons/shape_rectangle_plus" { export=icon }
declare module "lenz:icons/shape_square_plus" { export=icon }
declare module "lenz:icons/shape_square_rounded_plus" { export=icon }
declare module "lenz:icons/share" { export=icon }
declare module "lenz:icons/share_all" { export=icon }
declare module "lenz:icons/share_all_outline" { export=icon }
declare module "lenz:icons/share_circle" { export=icon }
declare module "lenz:icons/share_off" { export=icon }
declare module "lenz:icons/share_off_outline" { export=icon }
declare module "lenz:icons/share_outline" { export=icon }
declare module "lenz:icons/share_variant" { export=icon }
declare module "lenz:icons/share_variant_outline" { export=icon }
declare module "lenz:icons/shark" { export=icon }
declare module "lenz:icons/shark_fin" { export=icon }
declare module "lenz:icons/shark_fin_outline" { export=icon }
declare module "lenz:icons/shark_off" { export=icon }
declare module "lenz:icons/sheep" { export=icon }
declare module "lenz:icons/shield" { export=icon }
declare module "lenz:icons/shield_account" { export=icon }
declare module "lenz:icons/shield_account_outline" { export=icon }
declare module "lenz:icons/shield_account_variant" { export=icon }
declare module "lenz:icons/shield_account_variant_outline" { export=icon }
declare module "lenz:icons/shield_airplane" { export=icon }
declare module "lenz:icons/shield_airplane_outline" { export=icon }
declare module "lenz:icons/shield_alert" { export=icon }
declare module "lenz:icons/shield_alert_outline" { export=icon }
declare module "lenz:icons/shield_bug" { export=icon }
declare module "lenz:icons/shield_bug_outline" { export=icon }
declare module "lenz:icons/shield_car" { export=icon }
declare module "lenz:icons/shield_check" { export=icon }
declare module "lenz:icons/shield_check_outline" { export=icon }
declare module "lenz:icons/shield_cross" { export=icon }
declare module "lenz:icons/shield_cross_outline" { export=icon }
declare module "lenz:icons/shield_crown" { export=icon }
declare module "lenz:icons/shield_crown_outline" { export=icon }
declare module "lenz:icons/shield_edit" { export=icon }
declare module "lenz:icons/shield_edit_outline" { export=icon }
declare module "lenz:icons/shield_half" { export=icon }
declare module "lenz:icons/shield_half_full" { export=icon }
declare module "lenz:icons/shield_home" { export=icon }
declare module "lenz:icons/shield_home_outline" { export=icon }
declare module "lenz:icons/shield_key" { export=icon }
declare module "lenz:icons/shield_key_outline" { export=icon }
declare module "lenz:icons/shield_link_variant" { export=icon }
declare module "lenz:icons/shield_link_variant_outline" { export=icon }
declare module "lenz:icons/shield_lock" { export=icon }
declare module "lenz:icons/shield_lock_open" { export=icon }
declare module "lenz:icons/shield_lock_open_outline" { export=icon }
declare module "lenz:icons/shield_lock_outline" { export=icon }
declare module "lenz:icons/shield_moon" { export=icon }
declare module "lenz:icons/shield_moon_outline" { export=icon }
declare module "lenz:icons/shield_off" { export=icon }
declare module "lenz:icons/shield_off_outline" { export=icon }
declare module "lenz:icons/shield_outline" { export=icon }
declare module "lenz:icons/shield_plus" { export=icon }
declare module "lenz:icons/shield_plus_outline" { export=icon }
declare module "lenz:icons/shield_refresh" { export=icon }
declare module "lenz:icons/shield_refresh_outline" { export=icon }
declare module "lenz:icons/shield_remove" { export=icon }
declare module "lenz:icons/shield_remove_outline" { export=icon }
declare module "lenz:icons/shield_search" { export=icon }
declare module "lenz:icons/shield_star" { export=icon }
declare module "lenz:icons/shield_star_outline" { export=icon }
declare module "lenz:icons/shield_sun" { export=icon }
declare module "lenz:icons/shield_sun_outline" { export=icon }
declare module "lenz:icons/shield_sword" { export=icon }
declare module "lenz:icons/shield_sword_outline" { export=icon }
declare module "lenz:icons/shield_sync" { export=icon }
declare module "lenz:icons/shield_sync_outline" { export=icon }
declare module "lenz:icons/shimmer" { export=icon }
declare module "lenz:icons/ship_wheel" { export=icon }
declare module "lenz:icons/shipping_pallet" { export=icon }
declare module "lenz:icons/shoe_ballet" { export=icon }
declare module "lenz:icons/shoe_cleat" { export=icon }
declare module "lenz:icons/shoe_formal" { export=icon }
declare module "lenz:icons/shoe_heel" { export=icon }
declare module "lenz:icons/shoe_print" { export=icon }
declare module "lenz:icons/shoe_sneaker" { export=icon }
declare module "lenz:icons/shopping" { export=icon }
declare module "lenz:icons/shopping_music" { export=icon }
declare module "lenz:icons/shopping_outline" { export=icon }
declare module "lenz:icons/shopping_search" { export=icon }
declare module "lenz:icons/shopping_search_outline" { export=icon }
declare module "lenz:icons/shore" { export=icon }
declare module "lenz:icons/shovel" { export=icon }
declare module "lenz:icons/shovel_off" { export=icon }
declare module "lenz:icons/shower" { export=icon }
declare module "lenz:icons/shower_head" { export=icon }
declare module "lenz:icons/shredder" { export=icon }
declare module "lenz:icons/shuffle" { export=icon }
declare module "lenz:icons/shuffle_disabled" { export=icon }
declare module "lenz:icons/shuffle_variant" { export=icon }
declare module "lenz:icons/shuriken" { export=icon }
declare module "lenz:icons/sickle" { export=icon }
declare module "lenz:icons/sigma" { export=icon }
declare module "lenz:icons/sigma_lower" { export=icon }
declare module "lenz:icons/sign_caution" { export=icon }
declare module "lenz:icons/sign_direction" { export=icon }
declare module "lenz:icons/sign_direction_minus" { export=icon }
declare module "lenz:icons/sign_direction_plus" { export=icon }
declare module "lenz:icons/sign_direction_remove" { export=icon }
declare module "lenz:icons/sign_language" { export=icon }
declare module "lenz:icons/sign_language_outline" { export=icon }
declare module "lenz:icons/sign_pole" { export=icon }
declare module "lenz:icons/sign_real_estate" { export=icon }
declare module "lenz:icons/sign_text" { export=icon }
declare module "lenz:icons/sign_yield" { export=icon }
declare module "lenz:icons/signal" { export=icon }
declare module "lenz:icons/signal2g" { export=icon }
declare module "lenz:icons/signal3g" { export=icon }
declare module "lenz:icons/signal4g" { export=icon }
declare module "lenz:icons/signal5g" { export=icon }
declare module "lenz:icons/signal_cellular1" { export=icon }
declare module "lenz:icons/signal_cellular2" { export=icon }
declare module "lenz:icons/signal_cellular3" { export=icon }
declare module "lenz:icons/signal_cellular_outline" { export=icon }
declare module "lenz:icons/signal_distance_variant" { export=icon }
declare module "lenz:icons/signal_hspa" { export=icon }
declare module "lenz:icons/signal_hspa_plus" { export=icon }
declare module "lenz:icons/signal_off" { export=icon }
declare module "lenz:icons/signal_variant" { export=icon }
declare module "lenz:icons/signature" { export=icon }
declare module "lenz:icons/signature_freehand" { export=icon }
declare module "lenz:icons/signature_image" { export=icon }
declare module "lenz:icons/signature_text" { export=icon }
declare module "lenz:icons/silo" { export=icon }
declare module "lenz:icons/silo_outline" { export=icon }
declare module "lenz:icons/silverware" { export=icon }
declare module "lenz:icons/silverware_clean" { export=icon }
declare module "lenz:icons/silverware_fork" { export=icon }
declare module "lenz:icons/silverware_fork_knife" { export=icon }
declare module "lenz:icons/silverware_spoon" { export=icon }
declare module "lenz:icons/silverware_variant" { export=icon }
declare module "lenz:icons/sim" { export=icon }
declare module "lenz:icons/sim_alert" { export=icon }
declare module "lenz:icons/sim_alert_outline" { export=icon }
declare module "lenz:icons/sim_off" { export=icon }
declare module "lenz:icons/sim_off_outline" { export=icon }
declare module "lenz:icons/sim_outline" { export=icon }
declare module "lenz:icons/simple_icons" { export=icon }
declare module "lenz:icons/sina_weibo" { export=icon }
declare module "lenz:icons/sine_wave" { export=icon }
declare module "lenz:icons/sitemap" { export=icon }
declare module "lenz:icons/sitemap_outline" { export=icon }
declare module "lenz:icons/size_l" { export=icon }
declare module "lenz:icons/size_m" { export=icon }
declare module "lenz:icons/size_s" { export=icon }
declare module "lenz:icons/size_xl" { export=icon }
declare module "lenz:icons/size_xs" { export=icon }
declare module "lenz:icons/size_xxl" { export=icon }
declare module "lenz:icons/size_xxs" { export=icon }
declare module "lenz:icons/size_xxxl" { export=icon }
declare module "lenz:icons/skate" { export=icon }
declare module "lenz:icons/skate_off" { export=icon }
declare module "lenz:icons/skateboard" { export=icon }
declare module "lenz:icons/skateboarding" { export=icon }
declare module "lenz:icons/skew_less" { export=icon }
declare module "lenz:icons/skew_more" { export=icon }
declare module "lenz:icons/ski" { export=icon }
declare module "lenz:icons/ski_cross_country" { export=icon }
declare module "lenz:icons/ski_water" { export=icon }
declare module "lenz:icons/skip_backward" { export=icon }
declare module "lenz:icons/skip_backward_outline" { export=icon }
declare module "lenz:icons/skip_forward" { export=icon }
declare module "lenz:icons/skip_forward_outline" { export=icon }
declare module "lenz:icons/skip_next" { export=icon }
declare module "lenz:icons/skip_next_circle" { export=icon }
declare module "lenz:icons/skip_next_circle_outline" { export=icon }
declare module "lenz:icons/skip_next_outline" { export=icon }
declare module "lenz:icons/skip_previous" { export=icon }
declare module "lenz:icons/skip_previous_circle" { export=icon }
declare module "lenz:icons/skip_previous_circle_outline" { export=icon }
declare module "lenz:icons/skip_previous_outline" { export=icon }
declare module "lenz:icons/skull" { export=icon }
declare module "lenz:icons/skull_crossbones" { export=icon }
declare module "lenz:icons/skull_crossbones_outline" { export=icon }
declare module "lenz:icons/skull_outline" { export=icon }
declare module "lenz:icons/skull_scan" { export=icon }
declare module "lenz:icons/skull_scan_outline" { export=icon }
declare module "lenz:icons/skype" { export=icon }
declare module "lenz:icons/skype_business" { export=icon }
declare module "lenz:icons/slack" { export=icon }
declare module "lenz:icons/slash_forward" { export=icon }
declare module "lenz:icons/slash_forward_box" { export=icon }
declare module "lenz:icons/sledding" { export=icon }
declare module "lenz:icons/sleep" { export=icon }
declare module "lenz:icons/sleep_off" { export=icon }
declare module "lenz:icons/slide" { export=icon }
declare module "lenz:icons/slope_downhill" { export=icon }
declare module "lenz:icons/slope_uphill" { export=icon }
declare module "lenz:icons/slot_machine" { export=icon }
declare module "lenz:icons/slot_machine_outline" { export=icon }
declare module "lenz:icons/smart_card" { export=icon }
declare module "lenz:icons/smart_card_off" { export=icon }
declare module "lenz:icons/smart_card_off_outline" { export=icon }
declare module "lenz:icons/smart_card_outline" { export=icon }
declare module "lenz:icons/smart_card_reader" { export=icon }
declare module "lenz:icons/smart_card_reader_outline" { export=icon }
declare module "lenz:icons/smog" { export=icon }
declare module "lenz:icons/smoke" { export=icon }
declare module "lenz:icons/smoke_detector" { export=icon }
declare module "lenz:icons/smoke_detector_alert" { export=icon }
declare module "lenz:icons/smoke_detector_alert_outline" { export=icon }
declare module "lenz:icons/smoke_detector_off" { export=icon }
declare module "lenz:icons/smoke_detector_off_outline" { export=icon }
declare module "lenz:icons/smoke_detector_outline" { export=icon }
declare module "lenz:icons/smoke_detector_variant" { export=icon }
declare module "lenz:icons/smoke_detector_variant_alert" { export=icon }
declare module "lenz:icons/smoke_detector_variant_off" { export=icon }
declare module "lenz:icons/smoking" { export=icon }
declare module "lenz:icons/smoking_off" { export=icon }
declare module "lenz:icons/smoking_pipe" { export=icon }
declare module "lenz:icons/smoking_pipe_off" { export=icon }
declare module "lenz:icons/snail" { export=icon }
declare module "lenz:icons/snake" { export=icon }
declare module "lenz:icons/snapchat" { export=icon }
declare module "lenz:icons/snowboard" { export=icon }
declare module "lenz:icons/snowflake" { export=icon }
declare module "lenz:icons/snowflake_alert" { export=icon }
declare module "lenz:icons/snowflake_check" { export=icon }
declare module "lenz:icons/snowflake_melt" { export=icon }
declare module "lenz:icons/snowflake_off" { export=icon }
declare module "lenz:icons/snowflake_thermometer" { export=icon }
declare module "lenz:icons/snowflake_variant" { export=icon }
declare module "lenz:icons/snowman" { export=icon }
declare module "lenz:icons/snowmobile" { export=icon }
declare module "lenz:icons/snowshoeing" { export=icon }
declare module "lenz:icons/soccer" { export=icon }
declare module "lenz:icons/soccer_field" { export=icon }
declare module "lenz:icons/social_distance2meters" { export=icon }
declare module "lenz:icons/social_distance6feet" { export=icon }
declare module "lenz:icons/sofa" { export=icon }
declare module "lenz:icons/sofa_outline" { export=icon }
declare module "lenz:icons/sofa_single" { export=icon }
declare module "lenz:icons/sofa_single_outline" { export=icon }
declare module "lenz:icons/solar_panel" { export=icon }
declare module "lenz:icons/solar_panel_large" { export=icon }
declare module "lenz:icons/solar_power" { export=icon }
declare module "lenz:icons/solar_power_variant" { export=icon }
declare module "lenz:icons/solar_power_variant_outline" { export=icon }
declare module "lenz:icons/soldering_iron" { export=icon }
declare module "lenz:icons/solid" { export=icon }
declare module "lenz:icons/sony_playstation" { export=icon }
declare module "lenz:icons/sort" { export=icon }
declare module "lenz:icons/sort_alphabetical_ascending" { export=icon }
declare module "lenz:icons/sort_alphabetical_ascending_variant" { export=icon }
declare module "lenz:icons/sort_alphabetical_descending" { export=icon }
declare module "lenz:icons/sort_alphabetical_descending_variant" { export=icon }
declare module "lenz:icons/sort_alphabetical_variant" { export=icon }
declare module "lenz:icons/sort_ascending" { export=icon }
declare module "lenz:icons/sort_bool_ascending" { export=icon }
declare module "lenz:icons/sort_bool_ascending_variant" { export=icon }
declare module "lenz:icons/sort_bool_descending" { export=icon }
declare module "lenz:icons/sort_bool_descending_variant" { export=icon }
declare module "lenz:icons/sort_calendar_ascending" { export=icon }
declare module "lenz:icons/sort_calendar_descending" { export=icon }
declare module "lenz:icons/sort_clock_ascending" { export=icon }
declare module "lenz:icons/sort_clock_ascending_outline" { export=icon }
declare module "lenz:icons/sort_clock_descending" { export=icon }
declare module "lenz:icons/sort_clock_descending_outline" { export=icon }
declare module "lenz:icons/sort_descending" { export=icon }
declare module "lenz:icons/sort_numeric_ascending" { export=icon }
declare module "lenz:icons/sort_numeric_ascending_variant" { export=icon }
declare module "lenz:icons/sort_numeric_descending" { export=icon }
declare module "lenz:icons/sort_numeric_descending_variant" { export=icon }
declare module "lenz:icons/sort_numeric_variant" { export=icon }
declare module "lenz:icons/sort_reverse_variant" { export=icon }
declare module "lenz:icons/sort_variant" { export=icon }
declare module "lenz:icons/sort_variant_lock" { export=icon }
declare module "lenz:icons/sort_variant_lock_open" { export=icon }
declare module "lenz:icons/sort_variant_off" { export=icon }
declare module "lenz:icons/sort_variant_remove" { export=icon }
declare module "lenz:icons/soundbar" { export=icon }
declare module "lenz:icons/soundcloud" { export=icon }
declare module "lenz:icons/source_branch" { export=icon }
declare module "lenz:icons/source_branch_check" { export=icon }
declare module "lenz:icons/source_branch_minus" { export=icon }
declare module "lenz:icons/source_branch_plus" { export=icon }
declare module "lenz:icons/source_branch_refresh" { export=icon }
declare module "lenz:icons/source_branch_remove" { export=icon }
declare module "lenz:icons/source_branch_sync" { export=icon }
declare module "lenz:icons/source_commit" { export=icon }
declare module "lenz:icons/source_commit_end" { export=icon }
declare module "lenz:icons/source_commit_end_local" { export=icon }
declare module "lenz:icons/source_commit_local" { export=icon }
declare module "lenz:icons/source_commit_next_local" { export=icon }
declare module "lenz:icons/source_commit_start" { export=icon }
declare module "lenz:icons/source_commit_start_next_local" { export=icon }
declare module "lenz:icons/source_fork" { export=icon }
declare module "lenz:icons/source_merge" { export=icon }
declare module "lenz:icons/source_pull" { export=icon }
declare module "lenz:icons/source_repository" { export=icon }
declare module "lenz:icons/source_repository_multiple" { export=icon }
declare module "lenz:icons/soy_sauce" { export=icon }
declare module "lenz:icons/soy_sauce_off" { export=icon }
declare module "lenz:icons/spa" { export=icon }
declare module "lenz:icons/spa_outline" { export=icon }
declare module "lenz:icons/space_invaders" { export=icon }
declare module "lenz:icons/space_station" { export=icon }
declare module "lenz:icons/spade" { export=icon }
declare module "lenz:icons/speaker" { export=icon }
declare module "lenz:icons/speaker_bluetooth" { export=icon }
declare module "lenz:icons/speaker_message" { export=icon }
declare module "lenz:icons/speaker_multiple" { export=icon }
declare module "lenz:icons/speaker_off" { export=icon }
declare module "lenz:icons/speaker_pause" { export=icon }
declare module "lenz:icons/speaker_play" { export=icon }
declare module "lenz:icons/speaker_stop" { export=icon }
declare module "lenz:icons/speaker_wireless" { export=icon }
declare module "lenz:icons/spear" { export=icon }
declare module "lenz:icons/speedometer" { export=icon }
declare module "lenz:icons/speedometer_medium" { export=icon }
declare module "lenz:icons/speedometer_slow" { export=icon }
declare module "lenz:icons/spellcheck" { export=icon }
declare module "lenz:icons/sphere" { export=icon }
declare module "lenz:icons/sphere_off" { export=icon }
declare module "lenz:icons/spider" { export=icon }
declare module "lenz:icons/spider_outline" { export=icon }
declare module "lenz:icons/spider_thread" { export=icon }
declare module "lenz:icons/spider_web" { export=icon }
declare module "lenz:icons/spirit_level" { export=icon }
declare module "lenz:icons/spoon_sugar" { export=icon }
declare module "lenz:icons/spotify" { export=icon }
declare module "lenz:icons/spotlight" { export=icon }
declare module "lenz:icons/spotlight_beam" { export=icon }
declare module "lenz:icons/spray" { export=icon }
declare module "lenz:icons/spray_bottle" { export=icon }
declare module "lenz:icons/sprinkler" { export=icon }
declare module "lenz:icons/sprinkler_fire" { export=icon }
declare module "lenz:icons/sprinkler_variant" { export=icon }
declare module "lenz:icons/sprout" { export=icon }
declare module "lenz:icons/sprout_outline" { export=icon }
declare module "lenz:icons/square" { export=icon }
declare module "lenz:icons/square_circle" { export=icon }
declare module "lenz:icons/square_circle_outline" { export=icon }
declare module "lenz:icons/square_edit_outline" { export=icon }
declare module "lenz:icons/square_medium" { export=icon }
declare module "lenz:icons/square_medium_outline" { export=icon }
declare module "lenz:icons/square_off" { export=icon }
declare module "lenz:icons/square_off_outline" { export=icon }
declare module "lenz:icons/square_opacity" { export=icon }
declare module "lenz:icons/square_outline" { export=icon }
declare module "lenz:icons/square_root" { export=icon }
declare module "lenz:icons/square_root_box" { export=icon }
declare module "lenz:icons/square_rounded" { export=icon }
declare module "lenz:icons/square_rounded_badge" { export=icon }
declare module "lenz:icons/square_rounded_badge_outline" { export=icon }
declare module "lenz:icons/square_rounded_outline" { export=icon }
declare module "lenz:icons/square_small" { export=icon }
declare module "lenz:icons/square_wave" { export=icon }
declare module "lenz:icons/squeegee" { export=icon }
declare module "lenz:icons/ssh" { export=icon }
declare module "lenz:icons/stack_exchange" { export=icon }
declare module "lenz:icons/stack_overflow" { export=icon }
declare module "lenz:icons/stackpath" { export=icon }
declare module "lenz:icons/stadium" { export=icon }
declare module "lenz:icons/stadium_outline" { export=icon }
declare module "lenz:icons/stadium_variant" { export=icon }
declare module "lenz:icons/stairs" { export=icon }
declare module "lenz:icons/stairs_box" { export=icon }
declare module "lenz:icons/stairs_down" { export=icon }
declare module "lenz:icons/stairs_up" { export=icon }
declare module "lenz:icons/stamper" { export=icon }
declare module "lenz:icons/standard_definition" { export=icon }
declare module "lenz:icons/star" { export=icon }
declare module "lenz:icons/star_box" { export=icon }
declare module "lenz:icons/star_box_multiple" { export=icon }
declare module "lenz:icons/star_box_multiple_outline" { export=icon }
declare module "lenz:icons/star_box_outline" { export=icon }
declare module "lenz:icons/star_check" { export=icon }
declare module "lenz:icons/star_check_outline" { export=icon }
declare module "lenz:icons/star_circle" { export=icon }
declare module "lenz:icons/star_circle_outline" { export=icon }
declare module "lenz:icons/star_cog" { export=icon }
declare module "lenz:icons/star_cog_outline" { export=icon }
declare module "lenz:icons/star_crescent" { export=icon }
declare module "lenz:icons/star_david" { export=icon }
declare module "lenz:icons/star_face" { export=icon }
declare module "lenz:icons/star_four_points" { export=icon }
declare module "lenz:icons/star_four_points_box" { export=icon }
declare module "lenz:icons/star_four_points_box_outline" { export=icon }
declare module "lenz:icons/star_four_points_circle" { export=icon }
declare module "lenz:icons/star_four_points_circle_outline" { export=icon }
declare module "lenz:icons/star_four_points_outline" { export=icon }
declare module "lenz:icons/star_four_points_small" { export=icon }
declare module "lenz:icons/star_half" { export=icon }
declare module "lenz:icons/star_half_full" { export=icon }
declare module "lenz:icons/star_minus" { export=icon }
declare module "lenz:icons/star_minus_outline" { export=icon }
declare module "lenz:icons/star_off" { export=icon }
declare module "lenz:icons/star_off_outline" { export=icon }
declare module "lenz:icons/star_outline" { export=icon }
declare module "lenz:icons/star_plus" { export=icon }
declare module "lenz:icons/star_plus_outline" { export=icon }
declare module "lenz:icons/star_remove" { export=icon }
declare module "lenz:icons/star_remove_outline" { export=icon }
declare module "lenz:icons/star_settings" { export=icon }
declare module "lenz:icons/star_settings_outline" { export=icon }
declare module "lenz:icons/star_shooting" { export=icon }
declare module "lenz:icons/star_shooting_outline" { export=icon }
declare module "lenz:icons/star_three_points" { export=icon }
declare module "lenz:icons/star_three_points_outline" { export=icon }
declare module "lenz:icons/state_machine" { export=icon }
declare module "lenz:icons/steam" { export=icon }
declare module "lenz:icons/steering" { export=icon }
declare module "lenz:icons/steering_off" { export=icon }
declare module "lenz:icons/step_backward" { export=icon }
declare module "lenz:icons/step_backward2" { export=icon }
declare module "lenz:icons/step_forward" { export=icon }
declare module "lenz:icons/step_forward2" { export=icon }
declare module "lenz:icons/stethoscope" { export=icon }
declare module "lenz:icons/sticker" { export=icon }
declare module "lenz:icons/sticker_alert" { export=icon }
declare module "lenz:icons/sticker_alert_outline" { export=icon }
declare module "lenz:icons/sticker_check" { export=icon }
declare module "lenz:icons/sticker_check_outline" { export=icon }
declare module "lenz:icons/sticker_circle_outline" { export=icon }
declare module "lenz:icons/sticker_emoji" { export=icon }
declare module "lenz:icons/sticker_minus" { export=icon }
declare module "lenz:icons/sticker_minus_outline" { export=icon }
declare module "lenz:icons/sticker_outline" { export=icon }
declare module "lenz:icons/sticker_plus" { export=icon }
declare module "lenz:icons/sticker_plus_outline" { export=icon }
declare module "lenz:icons/sticker_remove" { export=icon }
declare module "lenz:icons/sticker_remove_outline" { export=icon }
declare module "lenz:icons/sticker_text" { export=icon }
declare module "lenz:icons/sticker_text_outline" { export=icon }
declare module "lenz:icons/stocking" { export=icon }
declare module "lenz:icons/stomach" { export=icon }
declare module "lenz:icons/stool" { export=icon }
declare module "lenz:icons/stool_outline" { export=icon }
declare module "lenz:icons/stop" { export=icon }
declare module "lenz:icons/stop_circle" { export=icon }
declare module "lenz:icons/stop_circle_outline" { export=icon }
declare module "lenz:icons/storage_tank" { export=icon }
declare module "lenz:icons/storage_tank_outline" { export=icon }
declare module "lenz:icons/store" { export=icon }
declare module "lenz:icons/store24hour" { export=icon }
declare module "lenz:icons/store_alert" { export=icon }
declare module "lenz:icons/store_alert_outline" { export=icon }
declare module "lenz:icons/store_check" { export=icon }
declare module "lenz:icons/store_check_outline" { export=icon }
declare module "lenz:icons/store_clock" { export=icon }
declare module "lenz:icons/store_clock_outline" { export=icon }
declare module "lenz:icons/store_cog" { export=icon }
declare module "lenz:icons/store_cog_outline" { export=icon }
declare module "lenz:icons/store_edit" { export=icon }
declare module "lenz:icons/store_edit_outline" { export=icon }
declare module "lenz:icons/store_marker" { export=icon }
declare module "lenz:icons/store_marker_outline" { export=icon }
declare module "lenz:icons/store_minus" { export=icon }
declare module "lenz:icons/store_minus_outline" { export=icon }
declare module "lenz:icons/store_off" { export=icon }
declare module "lenz:icons/store_off_outline" { export=icon }
declare module "lenz:icons/store_outline" { export=icon }
declare module "lenz:icons/store_plus" { export=icon }
declare module "lenz:icons/store_plus_outline" { export=icon }
declare module "lenz:icons/store_remove" { export=icon }
declare module "lenz:icons/store_remove_outline" { export=icon }
declare module "lenz:icons/store_search" { export=icon }
declare module "lenz:icons/store_search_outline" { export=icon }
declare module "lenz:icons/store_settings" { export=icon }
declare module "lenz:icons/store_settings_outline" { export=icon }
declare module "lenz:icons/storefront" { export=icon }
declare module "lenz:icons/storefront_check" { export=icon }
declare module "lenz:icons/storefront_check_outline" { export=icon }
declare module "lenz:icons/storefront_edit" { export=icon }
declare module "lenz:icons/storefront_edit_outline" { export=icon }
declare module "lenz:icons/storefront_minus" { export=icon }
declare module "lenz:icons/storefront_minus_outline" { export=icon }
declare module "lenz:icons/storefront_outline" { export=icon }
declare module "lenz:icons/storefront_plus" { export=icon }
declare module "lenz:icons/storefront_plus_outline" { export=icon }
declare module "lenz:icons/storefront_remove" { export=icon }
declare module "lenz:icons/storefront_remove_outline" { export=icon }
declare module "lenz:icons/stove" { export=icon }
declare module "lenz:icons/strategy" { export=icon }
declare module "lenz:icons/stretch_to_page" { export=icon }
declare module "lenz:icons/stretch_to_page_outline" { export=icon }
declare module "lenz:icons/string_lights" { export=icon }
declare module "lenz:icons/string_lights_off" { export=icon }
declare module "lenz:icons/subdirectory_arrow_left" { export=icon }
declare module "lenz:icons/subdirectory_arrow_right" { export=icon }
declare module "lenz:icons/submarine" { export=icon }
declare module "lenz:icons/subtitles" { export=icon }
declare module "lenz:icons/subtitles_outline" { export=icon }
declare module "lenz:icons/subway" { export=icon }
declare module "lenz:icons/subway_alert_variant" { export=icon }
declare module "lenz:icons/subway_variant" { export=icon }
declare module "lenz:icons/summit" { export=icon }
declare module "lenz:icons/sun_angle" { export=icon }
declare module "lenz:icons/sun_angle_outline" { export=icon }
declare module "lenz:icons/sun_clock" { export=icon }
declare module "lenz:icons/sun_clock_outline" { export=icon }
declare module "lenz:icons/sun_compass" { export=icon }
declare module "lenz:icons/sun_snowflake" { export=icon }
declare module "lenz:icons/sun_snowflake_variant" { export=icon }
declare module "lenz:icons/sun_thermometer" { export=icon }
declare module "lenz:icons/sun_thermometer_outline" { export=icon }
declare module "lenz:icons/sun_wireless" { export=icon }
declare module "lenz:icons/sun_wireless_outline" { export=icon }
declare module "lenz:icons/sunglasses" { export=icon }
declare module "lenz:icons/surfing" { export=icon }
declare module "lenz:icons/surround_sound" { export=icon }
declare module "lenz:icons/surround_sound20" { export=icon }
declare module "lenz:icons/surround_sound21" { export=icon }
declare module "lenz:icons/surround_sound31" { export=icon }
declare module "lenz:icons/surround_sound51" { export=icon }
declare module "lenz:icons/surround_sound512" { export=icon }
declare module "lenz:icons/surround_sound71" { export=icon }
declare module "lenz:icons/svg" { export=icon }
declare module "lenz:icons/swap_horizontal" { export=icon }
declare module "lenz:icons/swap_horizontal_bold" { export=icon }
declare module "lenz:icons/swap_horizontal_circle" { export=icon }
declare module "lenz:icons/swap_horizontal_circle_outline" { export=icon }
declare module "lenz:icons/swap_horizontal_hidden" { export=icon }
declare module "lenz:icons/swap_horizontal_variant" { export=icon }
declare module "lenz:icons/swap_vertical" { export=icon }
declare module "lenz:icons/swap_vertical_bold" { export=icon }
declare module "lenz:icons/swap_vertical_circle" { export=icon }
declare module "lenz:icons/swap_vertical_circle_outline" { export=icon }
declare module "lenz:icons/swap_vertical_variant" { export=icon }
declare module "lenz:icons/swim" { export=icon }
declare module "lenz:icons/switch" { export=icon }
declare module "lenz:icons/sword" { export=icon }
declare module "lenz:icons/sword_cross" { export=icon }
declare module "lenz:icons/syllabary_hangul" { export=icon }
declare module "lenz:icons/syllabary_hiragana" { export=icon }
declare module "lenz:icons/syllabary_katakana" { export=icon }
declare module "lenz:icons/syllabary_katakana_halfwidth" { export=icon }
declare module "lenz:icons/symbol" { export=icon }
declare module "lenz:icons/symfony" { export=icon }
declare module "lenz:icons/synagogue" { export=icon }
declare module "lenz:icons/synagogue_outline" { export=icon }
declare module "lenz:icons/sync" { export=icon }
declare module "lenz:icons/sync_alert" { export=icon }
declare module "lenz:icons/sync_circle" { export=icon }
declare module "lenz:icons/sync_off" { export=icon }
declare module "lenz:icons/tab" { export=icon }
declare module "lenz:icons/tab_minus" { export=icon }
declare module "lenz:icons/tab_plus" { export=icon }
declare module "lenz:icons/tab_remove" { export=icon }
declare module "lenz:icons/tab_search" { export=icon }
declare module "lenz:icons/tab_unselected" { export=icon }
declare module "lenz:icons/table" { export=icon }
declare module "lenz:icons/table_account" { export=icon }
declare module "lenz:icons/table_alert" { export=icon }
declare module "lenz:icons/table_arrow_down" { export=icon }
declare module "lenz:icons/table_arrow_left" { export=icon }
declare module "lenz:icons/table_arrow_right" { export=icon }
declare module "lenz:icons/table_arrow_up" { export=icon }
declare module "lenz:icons/table_border" { export=icon }
declare module "lenz:icons/table_cancel" { export=icon }
declare module "lenz:icons/table_chair" { export=icon }
declare module "lenz:icons/table_check" { export=icon }
declare module "lenz:icons/table_clock" { export=icon }
declare module "lenz:icons/table_cog" { export=icon }
declare module "lenz:icons/table_column" { export=icon }
declare module "lenz:icons/table_column_plus_after" { export=icon }
declare module "lenz:icons/table_column_plus_before" { export=icon }
declare module "lenz:icons/table_column_remove" { export=icon }
declare module "lenz:icons/table_column_width" { export=icon }
declare module "lenz:icons/table_edit" { export=icon }
declare module "lenz:icons/table_eye" { export=icon }
declare module "lenz:icons/table_eye_off" { export=icon }
declare module "lenz:icons/table_filter" { export=icon }
declare module "lenz:icons/table_furniture" { export=icon }
declare module "lenz:icons/table_headers_eye" { export=icon }
declare module "lenz:icons/table_headers_eye_off" { export=icon }
declare module "lenz:icons/table_heart" { export=icon }
declare module "lenz:icons/table_key" { export=icon }
declare module "lenz:icons/table_large" { export=icon }
declare module "lenz:icons/table_large_plus" { export=icon }
declare module "lenz:icons/table_large_remove" { export=icon }
declare module "lenz:icons/table_lock" { export=icon }
declare module "lenz:icons/table_merge_cells" { export=icon }
declare module "lenz:icons/table_minus" { export=icon }
declare module "lenz:icons/table_multiple" { export=icon }
declare module "lenz:icons/table_network" { export=icon }
declare module "lenz:icons/table_of_contents" { export=icon }
declare module "lenz:icons/table_off" { export=icon }
declare module "lenz:icons/table_picnic" { export=icon }
declare module "lenz:icons/table_pivot" { export=icon }
declare module "lenz:icons/table_plus" { export=icon }
declare module "lenz:icons/table_question" { export=icon }
declare module "lenz:icons/table_refresh" { export=icon }
declare module "lenz:icons/table_remove" { export=icon }
declare module "lenz:icons/table_row" { export=icon }
declare module "lenz:icons/table_row_height" { export=icon }
declare module "lenz:icons/table_row_plus_after" { export=icon }
declare module "lenz:icons/table_row_plus_before" { export=icon }
declare module "lenz:icons/table_row_remove" { export=icon }
declare module "lenz:icons/table_search" { export=icon }
declare module "lenz:icons/table_settings" { export=icon }
declare module "lenz:icons/table_split_cell" { export=icon }
declare module "lenz:icons/table_star" { export=icon }
declare module "lenz:icons/table_sync" { export=icon }
declare module "lenz:icons/table_tennis" { export=icon }
declare module "lenz:icons/tablet" { export=icon }
declare module "lenz:icons/tablet_cellphone" { export=icon }
declare module "lenz:icons/tablet_dashboard" { export=icon }
declare module "lenz:icons/taco" { export=icon }
declare module "lenz:icons/tag" { export=icon }
declare module "lenz:icons/tag_arrow_down" { export=icon }
declare module "lenz:icons/tag_arrow_down_outline" { export=icon }
declare module "lenz:icons/tag_arrow_left" { export=icon }
declare module "lenz:icons/tag_arrow_left_outline" { export=icon }
declare module "lenz:icons/tag_arrow_right" { export=icon }
declare module "lenz:icons/tag_arrow_right_outline" { export=icon }
declare module "lenz:icons/tag_arrow_up" { export=icon }
declare module "lenz:icons/tag_arrow_up_outline" { export=icon }
declare module "lenz:icons/tag_check" { export=icon }
declare module "lenz:icons/tag_check_outline" { export=icon }
declare module "lenz:icons/tag_edit" { export=icon }
declare module "lenz:icons/tag_edit_outline" { export=icon }
declare module "lenz:icons/tag_faces" { export=icon }
declare module "lenz:icons/tag_heart" { export=icon }
declare module "lenz:icons/tag_heart_outline" { export=icon }
declare module "lenz:icons/tag_hidden" { export=icon }
declare module "lenz:icons/tag_minus" { export=icon }
declare module "lenz:icons/tag_minus_outline" { export=icon }
declare module "lenz:icons/tag_multiple" { export=icon }
declare module "lenz:icons/tag_multiple_outline" { export=icon }
declare module "lenz:icons/tag_off" { export=icon }
declare module "lenz:icons/tag_off_outline" { export=icon }
declare module "lenz:icons/tag_outline" { export=icon }
declare module "lenz:icons/tag_plus" { export=icon }
declare module "lenz:icons/tag_plus_outline" { export=icon }
declare module "lenz:icons/tag_remove" { export=icon }
declare module "lenz:icons/tag_remove_outline" { export=icon }
declare module "lenz:icons/tag_search" { export=icon }
declare module "lenz:icons/tag_search_outline" { export=icon }
declare module "lenz:icons/tag_text" { export=icon }
declare module "lenz:icons/tag_text_outline" { export=icon }
declare module "lenz:icons/tailwind" { export=icon }
declare module "lenz:icons/tally_mark1" { export=icon }
declare module "lenz:icons/tally_mark2" { export=icon }
declare module "lenz:icons/tally_mark3" { export=icon }
declare module "lenz:icons/tally_mark4" { export=icon }
declare module "lenz:icons/tally_mark5" { export=icon }
declare module "lenz:icons/tangram" { export=icon }
declare module "lenz:icons/tank" { export=icon }
declare module "lenz:icons/tanker_truck" { export=icon }
declare module "lenz:icons/tape_drive" { export=icon }
declare module "lenz:icons/tape_measure" { export=icon }
declare module "lenz:icons/target" { export=icon }
declare module "lenz:icons/target_account" { export=icon }
declare module "lenz:icons/target_variant" { export=icon }
declare module "lenz:icons/taxi" { export=icon }
declare module "lenz:icons/tea" { export=icon }
declare module "lenz:icons/tea_outline" { export=icon }
declare module "lenz:icons/teamviewer" { export=icon }
declare module "lenz:icons/teddy_bear" { export=icon }
declare module "lenz:icons/telescope" { export=icon }
declare module "lenz:icons/television" { export=icon }
declare module "lenz:icons/television_ambient_light" { export=icon }
declare module "lenz:icons/television_box" { export=icon }
declare module "lenz:icons/television_classic" { export=icon }
declare module "lenz:icons/television_classic_off" { export=icon }
declare module "lenz:icons/television_guide" { export=icon }
declare module "lenz:icons/television_off" { export=icon }
declare module "lenz:icons/television_pause" { export=icon }
declare module "lenz:icons/television_play" { export=icon }
declare module "lenz:icons/television_shimmer" { export=icon }
declare module "lenz:icons/television_speaker" { export=icon }
declare module "lenz:icons/television_speaker_off" { export=icon }
declare module "lenz:icons/television_stop" { export=icon }
declare module "lenz:icons/temperature_celsius" { export=icon }
declare module "lenz:icons/temperature_fahrenheit" { export=icon }
declare module "lenz:icons/temperature_kelvin" { export=icon }
declare module "lenz:icons/temple_buddhist" { export=icon }
declare module "lenz:icons/temple_buddhist_outline" { export=icon }
declare module "lenz:icons/temple_hindu" { export=icon }
declare module "lenz:icons/temple_hindu_outline" { export=icon }
declare module "lenz:icons/tennis" { export=icon }
declare module "lenz:icons/tennis_ball" { export=icon }
declare module "lenz:icons/tennis_ball_outline" { export=icon }
declare module "lenz:icons/tent" { export=icon }
declare module "lenz:icons/terraform" { export=icon }
declare module "lenz:icons/terrain" { export=icon }
declare module "lenz:icons/test_tube" { export=icon }
declare module "lenz:icons/test_tube_empty" { export=icon }
declare module "lenz:icons/test_tube_off" { export=icon }
declare module "lenz:icons/text" { export=icon }
declare module "lenz:icons/text_account" { export=icon }
declare module "lenz:icons/text_box" { export=icon }
declare module "lenz:icons/text_box_check" { export=icon }
declare module "lenz:icons/text_box_check_outline" { export=icon }
declare module "lenz:icons/text_box_edit" { export=icon }
declare module "lenz:icons/text_box_edit_outline" { export=icon }
declare module "lenz:icons/text_box_minus" { export=icon }
declare module "lenz:icons/text_box_minus_outline" { export=icon }
declare module "lenz:icons/text_box_multiple" { export=icon }
declare module "lenz:icons/text_box_multiple_outline" { export=icon }
declare module "lenz:icons/text_box_outline" { export=icon }
declare module "lenz:icons/text_box_plus" { export=icon }
declare module "lenz:icons/text_box_plus_outline" { export=icon }
declare module "lenz:icons/text_box_remove" { export=icon }
declare module "lenz:icons/text_box_remove_outline" { export=icon }
declare module "lenz:icons/text_box_search" { export=icon }
declare module "lenz:icons/text_box_search_outline" { export=icon }
declare module "lenz:icons/text_long" { export=icon }
declare module "lenz:icons/text_recognition" { export=icon }
declare module "lenz:icons/text_search" { export=icon }
declare module "lenz:icons/text_search_variant" { export=icon }
declare module "lenz:icons/text_shadow" { export=icon }
declare module "lenz:icons/text_short" { export=icon }
declare module "lenz:icons/texture" { export=icon }
declare module "lenz:icons/texture_box" { export=icon }
declare module "lenz:icons/theater" { export=icon }
declare module "lenz:icons/theme_light_dark" { export=icon }
declare module "lenz:icons/thermometer" { export=icon }
declare module "lenz:icons/thermometer_alert" { export=icon }
declare module "lenz:icons/thermometer_auto" { export=icon }
declare module "lenz:icons/thermometer_bluetooth" { export=icon }
declare module "lenz:icons/thermometer_check" { export=icon }
declare module "lenz:icons/thermometer_chevron_down" { export=icon }
declare module "lenz:icons/thermometer_chevron_up" { export=icon }
declare module "lenz:icons/thermometer_high" { export=icon }
declare module "lenz:icons/thermometer_lines" { export=icon }
declare module "lenz:icons/thermometer_low" { export=icon }
declare module "lenz:icons/thermometer_minus" { export=icon }
declare module "lenz:icons/thermometer_off" { export=icon }
declare module "lenz:icons/thermometer_plus" { export=icon }
declare module "lenz:icons/thermometer_probe" { export=icon }
declare module "lenz:icons/thermometer_probe_off" { export=icon }
declare module "lenz:icons/thermometer_water" { export=icon }
declare module "lenz:icons/thermostat" { export=icon }
declare module "lenz:icons/thermostat_auto" { export=icon }
declare module "lenz:icons/thermostat_box" { export=icon }
declare module "lenz:icons/thermostat_box_auto" { export=icon }
declare module "lenz:icons/thermostat_cog" { export=icon }
declare module "lenz:icons/thought_bubble" { export=icon }
declare module "lenz:icons/thought_bubble_outline" { export=icon }
declare module "lenz:icons/thumb_down" { export=icon }
declare module "lenz:icons/thumb_down_outline" { export=icon }
declare module "lenz:icons/thumb_up" { export=icon }
declare module "lenz:icons/thumb_up_outline" { export=icon }
declare module "lenz:icons/thumbs_up_down" { export=icon }
declare module "lenz:icons/thumbs_up_down_outline" { export=icon }
declare module "lenz:icons/ticket" { export=icon }
declare module "lenz:icons/ticket_account" { export=icon }
declare module "lenz:icons/ticket_confirmation" { export=icon }
declare module "lenz:icons/ticket_confirmation_outline" { export=icon }
declare module "lenz:icons/ticket_outline" { export=icon }
declare module "lenz:icons/ticket_percent" { export=icon }
declare module "lenz:icons/ticket_percent_outline" { export=icon }
declare module "lenz:icons/tie" { export=icon }
declare module "lenz:icons/tilde" { export=icon }
declare module "lenz:icons/tilde_off" { export=icon }
declare module "lenz:icons/timelapse" { export=icon }
declare module "lenz:icons/timeline" { export=icon }
declare module "lenz:icons/timeline_alert" { export=icon }
declare module "lenz:icons/timeline_alert_outline" { export=icon }
declare module "lenz:icons/timeline_check" { export=icon }
declare module "lenz:icons/timeline_check_outline" { export=icon }
declare module "lenz:icons/timeline_clock" { export=icon }
declare module "lenz:icons/timeline_clock_outline" { export=icon }
declare module "lenz:icons/timeline_minus" { export=icon }
declare module "lenz:icons/timeline_minus_outline" { export=icon }
declare module "lenz:icons/timeline_outline" { export=icon }
declare module "lenz:icons/timeline_plus" { export=icon }
declare module "lenz:icons/timeline_plus_outline" { export=icon }
declare module "lenz:icons/timeline_question" { export=icon }
declare module "lenz:icons/timeline_question_outline" { export=icon }
declare module "lenz:icons/timeline_remove" { export=icon }
declare module "lenz:icons/timeline_remove_outline" { export=icon }
declare module "lenz:icons/timeline_text" { export=icon }
declare module "lenz:icons/timeline_text_outline" { export=icon }
declare module "lenz:icons/timer" { export=icon }
declare module "lenz:icons/timer10" { export=icon }
declare module "lenz:icons/timer3" { export=icon }
declare module "lenz:icons/timer_alert" { export=icon }
declare module "lenz:icons/timer_alert_outline" { export=icon }
declare module "lenz:icons/timer_cancel" { export=icon }
declare module "lenz:icons/timer_cancel_outline" { export=icon }
declare module "lenz:icons/timer_check" { export=icon }
declare module "lenz:icons/timer_check_outline" { export=icon }
declare module "lenz:icons/timer_cog" { export=icon }
declare module "lenz:icons/timer_cog_outline" { export=icon }
declare module "lenz:icons/timer_edit" { export=icon }
declare module "lenz:icons/timer_edit_outline" { export=icon }
declare module "lenz:icons/timer_lock" { export=icon }
declare module "lenz:icons/timer_lock_open" { export=icon }
declare module "lenz:icons/timer_lock_open_outline" { export=icon }
declare module "lenz:icons/timer_lock_outline" { export=icon }
declare module "lenz:icons/timer_marker" { export=icon }
declare module "lenz:icons/timer_marker_outline" { export=icon }
declare module "lenz:icons/timer_minus" { export=icon }
declare module "lenz:icons/timer_minus_outline" { export=icon }
declare module "lenz:icons/timer_music" { export=icon }
declare module "lenz:icons/timer_music_outline" { export=icon }
declare module "lenz:icons/timer_off" { export=icon }
declare module "lenz:icons/timer_off_outline" { export=icon }
declare module "lenz:icons/timer_outline" { export=icon }
declare module "lenz:icons/timer_pause" { export=icon }
declare module "lenz:icons/timer_pause_outline" { export=icon }
declare module "lenz:icons/timer_play" { export=icon }
declare module "lenz:icons/timer_play_outline" { export=icon }
declare module "lenz:icons/timer_plus" { export=icon }
declare module "lenz:icons/timer_plus_outline" { export=icon }
declare module "lenz:icons/timer_refresh" { export=icon }
declare module "lenz:icons/timer_refresh_outline" { export=icon }
declare module "lenz:icons/timer_remove" { export=icon }
declare module "lenz:icons/timer_remove_outline" { export=icon }
declare module "lenz:icons/timer_sand" { export=icon }
declare module "lenz:icons/timer_sand_complete" { export=icon }
declare module "lenz:icons/timer_sand_empty" { export=icon }
declare module "lenz:icons/timer_sand_full" { export=icon }
declare module "lenz:icons/timer_sand_paused" { export=icon }
declare module "lenz:icons/timer_settings" { export=icon }
declare module "lenz:icons/timer_settings_outline" { export=icon }
declare module "lenz:icons/timer_star" { export=icon }
declare module "lenz:icons/timer_star_outline" { export=icon }
declare module "lenz:icons/timer_stop" { export=icon }
declare module "lenz:icons/timer_stop_outline" { export=icon }
declare module "lenz:icons/timer_sync" { export=icon }
declare module "lenz:icons/timer_sync_outline" { export=icon }
declare module "lenz:icons/timetable" { export=icon }
declare module "lenz:icons/tire" { export=icon }
declare module "lenz:icons/toaster" { export=icon }
declare module "lenz:icons/toaster_off" { export=icon }
declare module "lenz:icons/toaster_oven" { export=icon }
declare module "lenz:icons/toggle_switch" { export=icon }
declare module "lenz:icons/toggle_switch_off" { export=icon }
declare module "lenz:icons/toggle_switch_off_outline" { export=icon }
declare module "lenz:icons/toggle_switch_outline" { export=icon }
declare module "lenz:icons/toggle_switch_variant" { export=icon }
declare module "lenz:icons/toggle_switch_variant_off" { export=icon }
declare module "lenz:icons/toilet" { export=icon }
declare module "lenz:icons/toolbox" { export=icon }
declare module "lenz:icons/toolbox_outline" { export=icon }
declare module "lenz:icons/tools" { export=icon }
declare module "lenz:icons/tooltip" { export=icon }
declare module "lenz:icons/tooltip_account" { export=icon }
declare module "lenz:icons/tooltip_cellphone" { export=icon }
declare module "lenz:icons/tooltip_check" { export=icon }
declare module "lenz:icons/tooltip_check_outline" { export=icon }
declare module "lenz:icons/tooltip_edit" { export=icon }
declare module "lenz:icons/tooltip_edit_outline" { export=icon }
declare module "lenz:icons/tooltip_image" { export=icon }
declare module "lenz:icons/tooltip_image_outline" { export=icon }
declare module "lenz:icons/tooltip_minus" { export=icon }
declare module "lenz:icons/tooltip_minus_outline" { export=icon }
declare module "lenz:icons/tooltip_outline" { export=icon }
declare module "lenz:icons/tooltip_plus" { export=icon }
declare module "lenz:icons/tooltip_plus_outline" { export=icon }
declare module "lenz:icons/tooltip_question" { export=icon }
declare module "lenz:icons/tooltip_question_outline" { export=icon }
declare module "lenz:icons/tooltip_remove" { export=icon }
declare module "lenz:icons/tooltip_remove_outline" { export=icon }
declare module "lenz:icons/tooltip_text" { export=icon }
declare module "lenz:icons/tooltip_text_outline" { export=icon }
declare module "lenz:icons/tooth" { export=icon }
declare module "lenz:icons/tooth_outline" { export=icon }
declare module "lenz:icons/toothbrush" { export=icon }
declare module "lenz:icons/toothbrush_electric" { export=icon }
declare module "lenz:icons/toothbrush_paste" { export=icon }
declare module "lenz:icons/torch" { export=icon }
declare module "lenz:icons/tortoise" { export=icon }
declare module "lenz:icons/toslink" { export=icon }
declare module "lenz:icons/touch_text_outline" { export=icon }
declare module "lenz:icons/tournament" { export=icon }
declare module "lenz:icons/tow_truck" { export=icon }
declare module "lenz:icons/tower_beach" { export=icon }
declare module "lenz:icons/tower_fire" { export=icon }
declare module "lenz:icons/town_hall" { export=icon }
declare module "lenz:icons/toy_brick" { export=icon }
declare module "lenz:icons/toy_brick_marker" { export=icon }
declare module "lenz:icons/toy_brick_marker_outline" { export=icon }
declare module "lenz:icons/toy_brick_minus" { export=icon }
declare module "lenz:icons/toy_brick_minus_outline" { export=icon }
declare module "lenz:icons/toy_brick_outline" { export=icon }
declare module "lenz:icons/toy_brick_plus" { export=icon }
declare module "lenz:icons/toy_brick_plus_outline" { export=icon }
declare module "lenz:icons/toy_brick_remove" { export=icon }
declare module "lenz:icons/toy_brick_remove_outline" { export=icon }
declare module "lenz:icons/toy_brick_search" { export=icon }
declare module "lenz:icons/toy_brick_search_outline" { export=icon }
declare module "lenz:icons/track_light" { export=icon }
declare module "lenz:icons/track_light_off" { export=icon }
declare module "lenz:icons/trackpad" { export=icon }
declare module "lenz:icons/trackpad_lock" { export=icon }
declare module "lenz:icons/tractor" { export=icon }
declare module "lenz:icons/tractor_variant" { export=icon }
declare module "lenz:icons/trademark" { export=icon }
declare module "lenz:icons/traffic_cone" { export=icon }
declare module "lenz:icons/traffic_light" { export=icon }
declare module "lenz:icons/traffic_light_outline" { export=icon }
declare module "lenz:icons/train" { export=icon }
declare module "lenz:icons/train_bus" { export=icon }
declare module "lenz:icons/train_car" { export=icon }
declare module "lenz:icons/train_car_autorack" { export=icon }
declare module "lenz:icons/train_car_box" { export=icon }
declare module "lenz:icons/train_car_box_full" { export=icon }
declare module "lenz:icons/train_car_box_open" { export=icon }
declare module "lenz:icons/train_car_caboose" { export=icon }
declare module "lenz:icons/train_car_centerbeam" { export=icon }
declare module "lenz:icons/train_car_centerbeam_full" { export=icon }
declare module "lenz:icons/train_car_container" { export=icon }
declare module "lenz:icons/train_car_flatbed" { export=icon }
declare module "lenz:icons/train_car_flatbed_car" { export=icon }
declare module "lenz:icons/train_car_flatbed_tank" { export=icon }
declare module "lenz:icons/train_car_gondola" { export=icon }
declare module "lenz:icons/train_car_gondola_full" { export=icon }
declare module "lenz:icons/train_car_hopper" { export=icon }
declare module "lenz:icons/train_car_hopper_covered" { export=icon }
declare module "lenz:icons/train_car_hopper_full" { export=icon }
declare module "lenz:icons/train_car_intermodal" { export=icon }
declare module "lenz:icons/train_car_passenger" { export=icon }
declare module "lenz:icons/train_car_passenger_door" { export=icon }
declare module "lenz:icons/train_car_passenger_door_open" { export=icon }
declare module "lenz:icons/train_car_passenger_variant" { export=icon }
declare module "lenz:icons/train_car_tank" { export=icon }
declare module "lenz:icons/train_variant" { export=icon }
declare module "lenz:icons/tram" { export=icon }
declare module "lenz:icons/tram_side" { export=icon }
declare module "lenz:icons/transcribe" { export=icon }
declare module "lenz:icons/transcribe_close" { export=icon }
declare module "lenz:icons/transfer" { export=icon }
declare module "lenz:icons/transfer_down" { export=icon }
declare module "lenz:icons/transfer_left" { export=icon }
declare module "lenz:icons/transfer_right" { export=icon }
declare module "lenz:icons/transfer_up" { export=icon }
declare module "lenz:icons/transit_connection" { export=icon }
declare module "lenz:icons/transit_connection_horizontal" { export=icon }
declare module "lenz:icons/transit_connection_variant" { export=icon }
declare module "lenz:icons/transit_detour" { export=icon }
declare module "lenz:icons/transit_skip" { export=icon }
declare module "lenz:icons/transit_transfer" { export=icon }
declare module "lenz:icons/transition" { export=icon }
declare module "lenz:icons/transition_masked" { export=icon }
declare module "lenz:icons/translate" { export=icon }
declare module "lenz:icons/translate_off" { export=icon }
declare module "lenz:icons/translate_variant" { export=icon }
declare module "lenz:icons/transmission_tower" { export=icon }
declare module "lenz:icons/transmission_tower_export" { export=icon }
declare module "lenz:icons/transmission_tower_import" { export=icon }
declare module "lenz:icons/transmission_tower_off" { export=icon }
declare module "lenz:icons/trash_can" { export=icon }
declare module "lenz:icons/trash_can_outline" { export=icon }
declare module "lenz:icons/tray" { export=icon }
declare module "lenz:icons/tray_alert" { export=icon }
declare module "lenz:icons/tray_arrow_down" { export=icon }
declare module "lenz:icons/tray_arrow_up" { export=icon }
declare module "lenz:icons/tray_full" { export=icon }
declare module "lenz:icons/tray_minus" { export=icon }
declare module "lenz:icons/tray_plus" { export=icon }
declare module "lenz:icons/tray_remove" { export=icon }
declare module "lenz:icons/treasure_chest" { export=icon }
declare module "lenz:icons/treasure_chest_outline" { export=icon }
declare module "lenz:icons/tree" { export=icon }
declare module "lenz:icons/tree_outline" { export=icon }
declare module "lenz:icons/trello" { export=icon }
declare module "lenz:icons/trending_down" { export=icon }
declare module "lenz:icons/trending_neutral" { export=icon }
declare module "lenz:icons/trending_up" { export=icon }
declare module "lenz:icons/triangle" { export=icon }
declare module "lenz:icons/triangle_down" { export=icon }
declare module "lenz:icons/triangle_down_outline" { export=icon }
declare module "lenz:icons/triangle_outline" { export=icon }
declare module "lenz:icons/triangle_small_down" { export=icon }
declare module "lenz:icons/triangle_small_up" { export=icon }
declare module "lenz:icons/triangle_wave" { export=icon }
declare module "lenz:icons/triforce" { export=icon }
declare module "lenz:icons/trophy" { export=icon }
declare module "lenz:icons/trophy_award" { export=icon }
declare module "lenz:icons/trophy_broken" { export=icon }
declare module "lenz:icons/trophy_outline" { export=icon }
declare module "lenz:icons/trophy_variant" { export=icon }
declare module "lenz:icons/trophy_variant_outline" { export=icon }
declare module "lenz:icons/truck" { export=icon }
declare module "lenz:icons/truck_alert" { export=icon }
declare module "lenz:icons/truck_alert_outline" { export=icon }
declare module "lenz:icons/truck_cargo_container" { export=icon }
declare module "lenz:icons/truck_check" { export=icon }
declare module "lenz:icons/truck_check_outline" { export=icon }
declare module "lenz:icons/truck_delivery" { export=icon }
declare module "lenz:icons/truck_delivery_outline" { export=icon }
declare module "lenz:icons/truck_fast" { export=icon }
declare module "lenz:icons/truck_fast_outline" { export=icon }
declare module "lenz:icons/truck_flatbed" { export=icon }
declare module "lenz:icons/truck_minus" { export=icon }
declare module "lenz:icons/truck_minus_outline" { export=icon }
declare module "lenz:icons/truck_off_road" { export=icon }
declare module "lenz:icons/truck_off_road_off" { export=icon }
declare module "lenz:icons/truck_outline" { export=icon }
declare module "lenz:icons/truck_plus" { export=icon }
declare module "lenz:icons/truck_plus_outline" { export=icon }
declare module "lenz:icons/truck_remove" { export=icon }
declare module "lenz:icons/truck_remove_outline" { export=icon }
declare module "lenz:icons/truck_snowflake" { export=icon }
declare module "lenz:icons/truck_trailer" { export=icon }
declare module "lenz:icons/trumpet" { export=icon }
declare module "lenz:icons/tshirt_crew" { export=icon }
declare module "lenz:icons/tshirt_crew_outline" { export=icon }
declare module "lenz:icons/tshirt_v" { export=icon }
declare module "lenz:icons/tshirt_voutline" { export=icon }
declare module "lenz:icons/tsunami" { export=icon }
declare module "lenz:icons/tumble_dryer" { export=icon }
declare module "lenz:icons/tumble_dryer_alert" { export=icon }
declare module "lenz:icons/tumble_dryer_off" { export=icon }
declare module "lenz:icons/tune" { export=icon }
declare module "lenz:icons/tune_variant" { export=icon }
declare module "lenz:icons/tune_vertical" { export=icon }
declare module "lenz:icons/tune_vertical_variant" { export=icon }
declare module "lenz:icons/tunnel" { export=icon }
declare module "lenz:icons/tunnel_outline" { export=icon }
declare module "lenz:icons/turbine" { export=icon }
declare module "lenz:icons/turkey" { export=icon }
declare module "lenz:icons/turnstile" { export=icon }
declare module "lenz:icons/turnstile_outline" { export=icon }
declare module "lenz:icons/turtle" { export=icon }
declare module "lenz:icons/twitch" { export=icon }
declare module "lenz:icons/twitter" { export=icon }
declare module "lenz:icons/two_factor_authentication" { export=icon }
declare module "lenz:icons/typewriter" { export=icon }
declare module "lenz:icons/ubisoft" { export=icon }
declare module "lenz:icons/ubuntu" { export=icon }
declare module "lenz:icons/ufo" { export=icon }
declare module "lenz:icons/ufo_outline" { export=icon }
declare module "lenz:icons/ultra_high_definition" { export=icon }
declare module "lenz:icons/umbraco" { export=icon }
declare module "lenz:icons/umbrella" { export=icon }
declare module "lenz:icons/umbrella_beach" { export=icon }
declare module "lenz:icons/umbrella_beach_outline" { export=icon }
declare module "lenz:icons/umbrella_closed" { export=icon }
declare module "lenz:icons/umbrella_closed_outline" { export=icon }
declare module "lenz:icons/umbrella_closed_variant" { export=icon }
declare module "lenz:icons/umbrella_outline" { export=icon }
declare module "lenz:icons/underwear_outline" { export=icon }
declare module "lenz:icons/undo" { export=icon }
declare module "lenz:icons/undo_variant" { export=icon }
declare module "lenz:icons/unfold_less_horizontal" { export=icon }
declare module "lenz:icons/unfold_less_vertical" { export=icon }
declare module "lenz:icons/unfold_more_horizontal" { export=icon }
declare module "lenz:icons/unfold_more_vertical" { export=icon }
declare module "lenz:icons/ungroup" { export=icon }
declare module "lenz:icons/unicode" { export=icon }
declare module "lenz:icons/unicorn" { export=icon }
declare module "lenz:icons/unicorn_variant" { export=icon }
declare module "lenz:icons/unicycle" { export=icon }
declare module "lenz:icons/unity" { export=icon }
declare module "lenz:icons/unreal" { export=icon }
declare module "lenz:icons/update" { export=icon }
declare module "lenz:icons/upload" { export=icon }
declare module "lenz:icons/upload_box" { export=icon }
declare module "lenz:icons/upload_box_outline" { export=icon }
declare module "lenz:icons/upload_circle" { export=icon }
declare module "lenz:icons/upload_circle_outline" { export=icon }
declare module "lenz:icons/upload_lock" { export=icon }
declare module "lenz:icons/upload_lock_outline" { export=icon }
declare module "lenz:icons/upload_multiple" { export=icon }
declare module "lenz:icons/upload_multiple_outline" { export=icon }
declare module "lenz:icons/upload_network" { export=icon }
declare module "lenz:icons/upload_network_outline" { export=icon }
declare module "lenz:icons/upload_off" { export=icon }
declare module "lenz:icons/upload_off_outline" { export=icon }
declare module "lenz:icons/upload_outline" { export=icon }
declare module "lenz:icons/usb" { export=icon }
declare module "lenz:icons/usb_cport" { export=icon }
declare module "lenz:icons/usb_flash_drive" { export=icon }
declare module "lenz:icons/usb_flash_drive_outline" { export=icon }
declare module "lenz:icons/usb_port" { export=icon }
declare module "lenz:icons/vacuum" { export=icon }
declare module "lenz:icons/vacuum_outline" { export=icon }
declare module "lenz:icons/valve" { export=icon }
declare module "lenz:icons/valve_closed" { export=icon }
declare module "lenz:icons/valve_open" { export=icon }
declare module "lenz:icons/van_passenger" { export=icon }
declare module "lenz:icons/van_utility" { export=icon }
declare module "lenz:icons/vanish" { export=icon }
declare module "lenz:icons/vanish_quarter" { export=icon }
declare module "lenz:icons/vanity_light" { export=icon }
declare module "lenz:icons/variable" { export=icon }
declare module "lenz:icons/variable_box" { export=icon }
declare module "lenz:icons/vector_arrange_above" { export=icon }
declare module "lenz:icons/vector_arrange_below" { export=icon }
declare module "lenz:icons/vector_bezier" { export=icon }
declare module "lenz:icons/vector_circle" { export=icon }
declare module "lenz:icons/vector_circle_variant" { export=icon }
declare module "lenz:icons/vector_combine" { export=icon }
declare module "lenz:icons/vector_curve" { export=icon }
declare module "lenz:icons/vector_difference" { export=icon }
declare module "lenz:icons/vector_difference_ab" { export=icon }
declare module "lenz:icons/vector_difference_ba" { export=icon }
declare module "lenz:icons/vector_ellipse" { export=icon }
declare module "lenz:icons/vector_intersection" { export=icon }
declare module "lenz:icons/vector_line" { export=icon }
declare module "lenz:icons/vector_link" { export=icon }
declare module "lenz:icons/vector_point" { export=icon }
declare module "lenz:icons/vector_point_edit" { export=icon }
declare module "lenz:icons/vector_point_minus" { export=icon }
declare module "lenz:icons/vector_point_plus" { export=icon }
declare module "lenz:icons/vector_point_select" { export=icon }
declare module "lenz:icons/vector_polygon" { export=icon }
declare module "lenz:icons/vector_polygon_variant" { export=icon }
declare module "lenz:icons/vector_polyline" { export=icon }
declare module "lenz:icons/vector_polyline_edit" { export=icon }
declare module "lenz:icons/vector_polyline_minus" { export=icon }
declare module "lenz:icons/vector_polyline_plus" { export=icon }
declare module "lenz:icons/vector_polyline_remove" { export=icon }
declare module "lenz:icons/vector_radius" { export=icon }
declare module "lenz:icons/vector_rectangle" { export=icon }
declare module "lenz:icons/vector_selection" { export=icon }
declare module "lenz:icons/vector_square" { export=icon }
declare module "lenz:icons/vector_square_close" { export=icon }
declare module "lenz:icons/vector_square_edit" { export=icon }
declare module "lenz:icons/vector_square_minus" { export=icon }
declare module "lenz:icons/vector_square_open" { export=icon }
declare module "lenz:icons/vector_square_plus" { export=icon }
declare module "lenz:icons/vector_square_remove" { export=icon }
declare module "lenz:icons/vector_triangle" { export=icon }
declare module "lenz:icons/vector_union" { export=icon }
declare module "lenz:icons/vhs" { export=icon }
declare module "lenz:icons/vibrate" { export=icon }
declare module "lenz:icons/vibrate_off" { export=icon }
declare module "lenz:icons/video" { export=icon }
declare module "lenz:icons/video2d" { export=icon }
declare module "lenz:icons/video3d" { export=icon }
declare module "lenz:icons/video3d_off" { export=icon }
declare module "lenz:icons/video3d_variant" { export=icon }
declare module "lenz:icons/video4k_box" { export=icon }
declare module "lenz:icons/video_account" { export=icon }
declare module "lenz:icons/video_box" { export=icon }
declare module "lenz:icons/video_box_off" { export=icon }
declare module "lenz:icons/video_check" { export=icon }
declare module "lenz:icons/video_check_outline" { export=icon }
declare module "lenz:icons/video_high_definition" { export=icon }
declare module "lenz:icons/video_image" { export=icon }
declare module "lenz:icons/video_input_antenna" { export=icon }
declare module "lenz:icons/video_input_component" { export=icon }
declare module "lenz:icons/video_input_hdmi" { export=icon }
declare module "lenz:icons/video_input_scart" { export=icon }
declare module "lenz:icons/video_input_svideo" { export=icon }
declare module "lenz:icons/video_marker" { export=icon }
declare module "lenz:icons/video_marker_outline" { export=icon }
declare module "lenz:icons/video_minus" { export=icon }
declare module "lenz:icons/video_minus_outline" { export=icon }
declare module "lenz:icons/video_off" { export=icon }
declare module "lenz:icons/video_off_outline" { export=icon }
declare module "lenz:icons/video_outline" { export=icon }
declare module "lenz:icons/video_plus" { export=icon }
declare module "lenz:icons/video_plus_outline" { export=icon }
declare module "lenz:icons/video_stabilization" { export=icon }
declare module "lenz:icons/video_standard_definition" { export=icon }
declare module "lenz:icons/video_switch" { export=icon }
declare module "lenz:icons/video_switch_outline" { export=icon }
declare module "lenz:icons/video_vintage" { export=icon }
declare module "lenz:icons/video_wireless" { export=icon }
declare module "lenz:icons/video_wireless_outline" { export=icon }
declare module "lenz:icons/view_agenda" { export=icon }
declare module "lenz:icons/view_agenda_outline" { export=icon }
declare module "lenz:icons/view_array" { export=icon }
declare module "lenz:icons/view_array_outline" { export=icon }
declare module "lenz:icons/view_carousel" { export=icon }
declare module "lenz:icons/view_carousel_outline" { export=icon }
declare module "lenz:icons/view_column" { export=icon }
declare module "lenz:icons/view_column_outline" { export=icon }
declare module "lenz:icons/view_comfy" { export=icon }
declare module "lenz:icons/view_comfy_outline" { export=icon }
declare module "lenz:icons/view_compact" { export=icon }
declare module "lenz:icons/view_compact_outline" { export=icon }
declare module "lenz:icons/view_dashboard" { export=icon }
declare module "lenz:icons/view_dashboard_edit" { export=icon }
declare module "lenz:icons/view_dashboard_edit_outline" { export=icon }
declare module "lenz:icons/view_dashboard_outline" { export=icon }
declare module "lenz:icons/view_dashboard_variant" { export=icon }
declare module "lenz:icons/view_dashboard_variant_outline" { export=icon }
declare module "lenz:icons/view_day" { export=icon }
declare module "lenz:icons/view_day_outline" { export=icon }
declare module "lenz:icons/view_gallery" { export=icon }
declare module "lenz:icons/view_gallery_outline" { export=icon }
declare module "lenz:icons/view_grid" { export=icon }
declare module "lenz:icons/view_grid_compact" { export=icon }
declare module "lenz:icons/view_grid_outline" { export=icon }
declare module "lenz:icons/view_grid_plus" { export=icon }
declare module "lenz:icons/view_grid_plus_outline" { export=icon }
declare module "lenz:icons/view_headline" { export=icon }
declare module "lenz:icons/view_list" { export=icon }
declare module "lenz:icons/view_list_outline" { export=icon }
declare module "lenz:icons/view_module" { export=icon }
declare module "lenz:icons/view_module_outline" { export=icon }
declare module "lenz:icons/view_parallel" { export=icon }
declare module "lenz:icons/view_parallel_outline" { export=icon }
declare module "lenz:icons/view_quilt" { export=icon }
declare module "lenz:icons/view_quilt_outline" { export=icon }
declare module "lenz:icons/view_sequential" { export=icon }
declare module "lenz:icons/view_sequential_outline" { export=icon }
declare module "lenz:icons/view_split_horizontal" { export=icon }
declare module "lenz:icons/view_split_vertical" { export=icon }
declare module "lenz:icons/view_stream" { export=icon }
declare module "lenz:icons/view_stream_outline" { export=icon }
declare module "lenz:icons/view_week" { export=icon }
declare module "lenz:icons/view_week_outline" { export=icon }
declare module "lenz:icons/vimeo" { export=icon }
declare module "lenz:icons/violin" { export=icon }
declare module "lenz:icons/virtual_reality" { export=icon }
declare module "lenz:icons/virus" { export=icon }
declare module "lenz:icons/virus_off" { export=icon }
declare module "lenz:icons/virus_off_outline" { export=icon }
declare module "lenz:icons/virus_outline" { export=icon }
declare module "lenz:icons/vlc" { export=icon }
declare module "lenz:icons/voicemail" { export=icon }
declare module "lenz:icons/volcano" { export=icon }
declare module "lenz:icons/volcano_outline" { export=icon }
declare module "lenz:icons/volleyball" { export=icon }
declare module "lenz:icons/volume_equal" { export=icon }
declare module "lenz:icons/volume_high" { export=icon }
declare module "lenz:icons/volume_low" { export=icon }
declare module "lenz:icons/volume_medium" { export=icon }
declare module "lenz:icons/volume_minus" { export=icon }
declare module "lenz:icons/volume_mute" { export=icon }
declare module "lenz:icons/volume_off" { export=icon }
declare module "lenz:icons/volume_plus" { export=icon }
declare module "lenz:icons/volume_source" { export=icon }
declare module "lenz:icons/volume_variant_off" { export=icon }
declare module "lenz:icons/volume_vibrate" { export=icon }
declare module "lenz:icons/vote" { export=icon }
declare module "lenz:icons/vote_outline" { export=icon }
declare module "lenz:icons/vpn" { export=icon }
declare module "lenz:icons/vuejs" { export=icon }
declare module "lenz:icons/vuetify" { export=icon }
declare module "lenz:icons/walk" { export=icon }
declare module "lenz:icons/wall" { export=icon }
declare module "lenz:icons/wall_fire" { export=icon }
declare module "lenz:icons/wall_sconce" { export=icon }
declare module "lenz:icons/wall_sconce_flat" { export=icon }
declare module "lenz:icons/wall_sconce_flat_outline" { export=icon }
declare module "lenz:icons/wall_sconce_flat_variant" { export=icon }
declare module "lenz:icons/wall_sconce_flat_variant_outline" { export=icon }
declare module "lenz:icons/wall_sconce_outline" { export=icon }
declare module "lenz:icons/wall_sconce_round" { export=icon }
declare module "lenz:icons/wall_sconce_round_outline" { export=icon }
declare module "lenz:icons/wall_sconce_round_variant" { export=icon }
declare module "lenz:icons/wall_sconce_round_variant_outline" { export=icon }
declare module "lenz:icons/wallet" { export=icon }
declare module "lenz:icons/wallet_bifold" { export=icon }
declare module "lenz:icons/wallet_bifold_outline" { export=icon }
declare module "lenz:icons/wallet_giftcard" { export=icon }
declare module "lenz:icons/wallet_membership" { export=icon }
declare module "lenz:icons/wallet_outline" { export=icon }
declare module "lenz:icons/wallet_plus" { export=icon }
declare module "lenz:icons/wallet_plus_outline" { export=icon }
declare module "lenz:icons/wallet_travel" { export=icon }
declare module "lenz:icons/wallpaper" { export=icon }
declare module "lenz:icons/wan" { export=icon }
declare module "lenz:icons/wardrobe" { export=icon }
declare module "lenz:icons/wardrobe_outline" { export=icon }
declare module "lenz:icons/warehouse" { export=icon }
declare module "lenz:icons/washing_machine" { export=icon }
declare module "lenz:icons/washing_machine_alert" { export=icon }
declare module "lenz:icons/washing_machine_off" { export=icon }
declare module "lenz:icons/watch" { export=icon }
declare module "lenz:icons/watch_export" { export=icon }
declare module "lenz:icons/watch_export_variant" { export=icon }
declare module "lenz:icons/watch_import" { export=icon }
declare module "lenz:icons/watch_import_variant" { export=icon }
declare module "lenz:icons/watch_variant" { export=icon }
declare module "lenz:icons/watch_vibrate" { export=icon }
declare module "lenz:icons/watch_vibrate_off" { export=icon }
declare module "lenz:icons/water" { export=icon }
declare module "lenz:icons/water_alert" { export=icon }
declare module "lenz:icons/water_alert_outline" { export=icon }
declare module "lenz:icons/water_boiler" { export=icon }
declare module "lenz:icons/water_boiler_alert" { export=icon }
declare module "lenz:icons/water_boiler_auto" { export=icon }
declare module "lenz:icons/water_boiler_off" { export=icon }
declare module "lenz:icons/water_check" { export=icon }
declare module "lenz:icons/water_check_outline" { export=icon }
declare module "lenz:icons/water_circle" { export=icon }
declare module "lenz:icons/water_minus" { export=icon }
declare module "lenz:icons/water_minus_outline" { export=icon }
declare module "lenz:icons/water_off" { export=icon }
declare module "lenz:icons/water_off_outline" { export=icon }
declare module "lenz:icons/water_opacity" { export=icon }
declare module "lenz:icons/water_outline" { export=icon }
declare module "lenz:icons/water_percent" { export=icon }
declare module "lenz:icons/water_percent_alert" { export=icon }
declare module "lenz:icons/water_plus" { export=icon }
declare module "lenz:icons/water_plus_outline" { export=icon }
declare module "lenz:icons/water_polo" { export=icon }
declare module "lenz:icons/water_pump" { export=icon }
declare module "lenz:icons/water_pump_off" { export=icon }
declare module "lenz:icons/water_remove" { export=icon }
declare module "lenz:icons/water_remove_outline" { export=icon }
declare module "lenz:icons/water_sync" { export=icon }
declare module "lenz:icons/water_thermometer" { export=icon }
declare module "lenz:icons/water_thermometer_outline" { export=icon }
declare module "lenz:icons/water_well" { export=icon }
declare module "lenz:icons/water_well_outline" { export=icon }
declare module "lenz:icons/waterfall" { export=icon }
declare module "lenz:icons/watering_can" { export=icon }
declare module "lenz:icons/watering_can_outline" { export=icon }
declare module "lenz:icons/watermark" { export=icon }
declare module "lenz:icons/wave" { export=icon }
declare module "lenz:icons/wave_arrow_down" { export=icon }
declare module "lenz:icons/wave_arrow_up" { export=icon }
declare module "lenz:icons/wave_undercurrent" { export=icon }
declare module "lenz:icons/waveform" { export=icon }
declare module "lenz:icons/waves" { export=icon }
declare module "lenz:icons/waves_arrow_left" { export=icon }
declare module "lenz:icons/waves_arrow_right" { export=icon }
declare module "lenz:icons/waves_arrow_up" { export=icon }
declare module "lenz:icons/waze" { export=icon }
declare module "lenz:icons/weather_cloudy" { export=icon }
declare module "lenz:icons/weather_cloudy_alert" { export=icon }
declare module "lenz:icons/weather_cloudy_arrow_right" { export=icon }
declare module "lenz:icons/weather_cloudy_clock" { export=icon }
declare module "lenz:icons/weather_dust" { export=icon }
declare module "lenz:icons/weather_fog" { export=icon }
declare module "lenz:icons/weather_hail" { export=icon }
declare module "lenz:icons/weather_hazy" { export=icon }
declare module "lenz:icons/weather_hurricane" { export=icon }
declare module "lenz:icons/weather_hurricane_outline" { export=icon }
declare module "lenz:icons/weather_lightning" { export=icon }
declare module "lenz:icons/weather_lightning_rainy" { export=icon }
declare module "lenz:icons/weather_moonset" { export=icon }
declare module "lenz:icons/weather_moonset_down" { export=icon }
declare module "lenz:icons/weather_moonset_up" { export=icon }
declare module "lenz:icons/weather_night" { export=icon }
declare module "lenz:icons/weather_night_partly_cloudy" { export=icon }
declare module "lenz:icons/weather_partly_cloudy" { export=icon }
declare module "lenz:icons/weather_partly_lightning" { export=icon }
declare module "lenz:icons/weather_partly_rainy" { export=icon }
declare module "lenz:icons/weather_partly_snowy" { export=icon }
declare module "lenz:icons/weather_partly_snowy_rainy" { export=icon }
declare module "lenz:icons/weather_pouring" { export=icon }
declare module "lenz:icons/weather_rainy" { export=icon }
declare module "lenz:icons/weather_snowy" { export=icon }
declare module "lenz:icons/weather_snowy_heavy" { export=icon }
declare module "lenz:icons/weather_snowy_rainy" { export=icon }
declare module "lenz:icons/weather_sunny" { export=icon }
declare module "lenz:icons/weather_sunny_alert" { export=icon }
declare module "lenz:icons/weather_sunny_off" { export=icon }
declare module "lenz:icons/weather_sunset" { export=icon }
declare module "lenz:icons/weather_sunset_down" { export=icon }
declare module "lenz:icons/weather_sunset_up" { export=icon }
declare module "lenz:icons/weather_tornado" { export=icon }
declare module "lenz:icons/weather_windy" { export=icon }
declare module "lenz:icons/weather_windy_variant" { export=icon }
declare module "lenz:icons/web" { export=icon }
declare module "lenz:icons/web_box" { export=icon }
declare module "lenz:icons/web_cancel" { export=icon }
declare module "lenz:icons/web_check" { export=icon }
declare module "lenz:icons/web_clock" { export=icon }
declare module "lenz:icons/web_minus" { export=icon }
declare module "lenz:icons/web_off" { export=icon }
declare module "lenz:icons/web_plus" { export=icon }
declare module "lenz:icons/web_refresh" { export=icon }
declare module "lenz:icons/web_remove" { export=icon }
declare module "lenz:icons/web_sync" { export=icon }
declare module "lenz:icons/webcam" { export=icon }
declare module "lenz:icons/webcam_off" { export=icon }
declare module "lenz:icons/webhook" { export=icon }
declare module "lenz:icons/webpack" { export=icon }
declare module "lenz:icons/webrtc" { export=icon }
declare module "lenz:icons/wechat" { export=icon }
declare module "lenz:icons/weight" { export=icon }
declare module "lenz:icons/weight_gram" { export=icon }
declare module "lenz:icons/weight_kilogram" { export=icon }
declare module "lenz:icons/weight_lifter" { export=icon }
declare module "lenz:icons/weight_pound" { export=icon }
declare module "lenz:icons/whatsapp" { export=icon }
declare module "lenz:icons/wheel_barrow" { export=icon }
declare module "lenz:icons/wheelchair" { export=icon }
declare module "lenz:icons/wheelchair_accessibility" { export=icon }
declare module "lenz:icons/whistle" { export=icon }
declare module "lenz:icons/whistle_outline" { export=icon }
declare module "lenz:icons/white_balance_auto" { export=icon }
declare module "lenz:icons/white_balance_incandescent" { export=icon }
declare module "lenz:icons/white_balance_iridescent" { export=icon }
declare module "lenz:icons/white_balance_sunny" { export=icon }
declare module "lenz:icons/widgets" { export=icon }
declare module "lenz:icons/widgets_outline" { export=icon }
declare module "lenz:icons/wifi" { export=icon }
declare module "lenz:icons/wifi_alert" { export=icon }
declare module "lenz:icons/wifi_arrow_down" { export=icon }
declare module "lenz:icons/wifi_arrow_left" { export=icon }
declare module "lenz:icons/wifi_arrow_left_right" { export=icon }
declare module "lenz:icons/wifi_arrow_right" { export=icon }
declare module "lenz:icons/wifi_arrow_up" { export=icon }
declare module "lenz:icons/wifi_arrow_up_down" { export=icon }
declare module "lenz:icons/wifi_cancel" { export=icon }
declare module "lenz:icons/wifi_check" { export=icon }
declare module "lenz:icons/wifi_cog" { export=icon }
declare module "lenz:icons/wifi_lock" { export=icon }
declare module "lenz:icons/wifi_lock_open" { export=icon }
declare module "lenz:icons/wifi_marker" { export=icon }
declare module "lenz:icons/wifi_minus" { export=icon }
declare module "lenz:icons/wifi_off" { export=icon }
declare module "lenz:icons/wifi_plus" { export=icon }
declare module "lenz:icons/wifi_refresh" { export=icon }
declare module "lenz:icons/wifi_remove" { export=icon }
declare module "lenz:icons/wifi_settings" { export=icon }
declare module "lenz:icons/wifi_star" { export=icon }
declare module "lenz:icons/wifi_strength1" { export=icon }
declare module "lenz:icons/wifi_strength1alert" { export=icon }
declare module "lenz:icons/wifi_strength1lock" { export=icon }
declare module "lenz:icons/wifi_strength1lock_open" { export=icon }
declare module "lenz:icons/wifi_strength2" { export=icon }
declare module "lenz:icons/wifi_strength2alert" { export=icon }
declare module "lenz:icons/wifi_strength2lock" { export=icon }
declare module "lenz:icons/wifi_strength2lock_open" { export=icon }
declare module "lenz:icons/wifi_strength3" { export=icon }
declare module "lenz:icons/wifi_strength3alert" { export=icon }
declare module "lenz:icons/wifi_strength3lock" { export=icon }
declare module "lenz:icons/wifi_strength3lock_open" { export=icon }
declare module "lenz:icons/wifi_strength4" { export=icon }
declare module "lenz:icons/wifi_strength4alert" { export=icon }
declare module "lenz:icons/wifi_strength4lock" { export=icon }
declare module "lenz:icons/wifi_strength4lock_open" { export=icon }
declare module "lenz:icons/wifi_strength_alert_outline" { export=icon }
declare module "lenz:icons/wifi_strength_lock_open_outline" { export=icon }
declare module "lenz:icons/wifi_strength_lock_outline" { export=icon }
declare module "lenz:icons/wifi_strength_off" { export=icon }
declare module "lenz:icons/wifi_strength_off_outline" { export=icon }
declare module "lenz:icons/wifi_strength_outline" { export=icon }
declare module "lenz:icons/wifi_sync" { export=icon }
declare module "lenz:icons/wikipedia" { export=icon }
declare module "lenz:icons/wind_power" { export=icon }
declare module "lenz:icons/wind_power_outline" { export=icon }
declare module "lenz:icons/wind_turbine" { export=icon }
declare module "lenz:icons/wind_turbine_alert" { export=icon }
declare module "lenz:icons/wind_turbine_check" { export=icon }
declare module "lenz:icons/window_close" { export=icon }
declare module "lenz:icons/window_closed" { export=icon }
declare module "lenz:icons/window_closed_variant" { export=icon }
declare module "lenz:icons/window_maximize" { export=icon }
declare module "lenz:icons/window_minimize" { export=icon }
declare module "lenz:icons/window_open" { export=icon }
declare module "lenz:icons/window_open_variant" { export=icon }
declare module "lenz:icons/window_restore" { export=icon }
declare module "lenz:icons/window_shutter" { export=icon }
declare module "lenz:icons/window_shutter_alert" { export=icon }
declare module "lenz:icons/window_shutter_auto" { export=icon }
declare module "lenz:icons/window_shutter_cog" { export=icon }
declare module "lenz:icons/window_shutter_open" { export=icon }
declare module "lenz:icons/window_shutter_settings" { export=icon }
declare module "lenz:icons/windsock" { export=icon }
declare module "lenz:icons/wiper" { export=icon }
declare module "lenz:icons/wiper_wash" { export=icon }
declare module "lenz:icons/wiper_wash_alert" { export=icon }
declare module "lenz:icons/wizard_hat" { export=icon }
declare module "lenz:icons/wordpress" { export=icon }
declare module "lenz:icons/wrap" { export=icon }
declare module "lenz:icons/wrap_disabled" { export=icon }
declare module "lenz:icons/wrench" { export=icon }
declare module "lenz:icons/wrench_check" { export=icon }
declare module "lenz:icons/wrench_check_outline" { export=icon }
declare module "lenz:icons/wrench_clock" { export=icon }
declare module "lenz:icons/wrench_clock_outline" { export=icon }
declare module "lenz:icons/wrench_cog" { export=icon }
declare module "lenz:icons/wrench_cog_outline" { export=icon }
declare module "lenz:icons/wrench_outline" { export=icon }
declare module "lenz:icons/xamarin" { export=icon }
declare module "lenz:icons/xml" { export=icon }
declare module "lenz:icons/xmpp" { export=icon }
declare module "lenz:icons/yahoo" { export=icon }
declare module "lenz:icons/yeast" { export=icon }
declare module "lenz:icons/yin_yang" { export=icon }
declare module "lenz:icons/yoga" { export=icon }
declare module "lenz:icons/youtube" { export=icon }
declare module "lenz:icons/youtube_gaming" { export=icon }
declare module "lenz:icons/youtube_studio" { export=icon }
declare module "lenz:icons/youtube_subscription" { export=icon }
declare module "lenz:icons/youtube_tv" { export=icon }
declare module "lenz:icons/yurt" { export=icon }
declare module "lenz:icons/zend" { export=icon }
declare module "lenz:icons/zigbee" { export=icon }
declare module "lenz:icons/zip_box" { export=icon }
declare module "lenz:icons/zip_box_outline" { export=icon }
declare module "lenz:icons/zip_disk" { export=icon }
declare module "lenz:icons/zodiac_aquarius" { export=icon }
declare module "lenz:icons/zodiac_aries" { export=icon }
declare module "lenz:icons/zodiac_cancer" { export=icon }
declare module "lenz:icons/zodiac_capricorn" { export=icon }
declare module "lenz:icons/zodiac_gemini" { export=icon }
declare module "lenz:icons/zodiac_leo" { export=icon }
declare module "lenz:icons/zodiac_libra" { export=icon }
declare module "lenz:icons/zodiac_pisces" { export=icon }
declare module "lenz:icons/zodiac_sagittarius" { export=icon }
declare module "lenz:icons/zodiac_scorpio" { export=icon }
declare module "lenz:icons/zodiac_taurus" { export=icon }
declare module "lenz:icons/zwave" { export=icon }
declare module "lenz:webcomponents/css-input-value" {
    export class CssInputValueElement extends HTMLElement {
        #private;
        static get observedAttributes(): string[];
        onAttributeChangedCallback(name: string, oldValue: string, newValue: string): void;
        get value(): string;
        set value(value: string);
        get defaultUnit(): string | null;
        set defaultUnit(value: string | null);
        constructor();
    }
}
declare module "lenz:widgets/icon" {
    export class IconWidget extends HTMLElement {
        constructor(iconPath: string);
        get icon(): string;
        set icon(value: string);
        static get observedAttributes(): string[];
        attributeChangedCallback(name: string, oldValue: string, newValue: string): void;
    }
}
declare module "lenz:widgets/button" {
    import { Ref } from "lenz:reactivity";
    export interface ButtonOptions {
        text?: string;
        icon?: string;
        active?: Ref<boolean>;
        mode: "icon" | "text" | "both";
    }
    export class ButtonWidget extends HTMLElement {
        constructor(options: ButtonOptions);
    }
}
declare module "lenz:widgets" {
    export * from "lenz:widgets/widget";
}
declare module "lenz:widgets/toolbar" { }
declare module "lenz:widgets/webview" {
    export interface WebViewWidgetOptions {
        content: string | URL;
        base?: URL;
        themed?: boolean;
    }
}

 declare const icon: string;