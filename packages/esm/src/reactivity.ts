import { LenzDisposer } from "./types.js";

/**
 * Representa uma porta de um canal de comunicação bidirecional
 */
export class ChannelPort<Input = unknown, Output = Input> {
  #receiver: (data: Input) => void;
  #listeners = new Set<(data: Output) => void>();
  #closeListeners = new Set<() => void>();

  /**
   * Retorna se o canal está fechado
   */
  get closed() {
    return false;
  }

  constructor(receiver: (data: Input) => void) {
    this.#receiver = receiver;
  }

  /**
   * Envia dados para o canal
   * @param data Dados recebidos
   */
  send(data: Input): void {
    if (this.closed) return;
    this.#receiver(data);
  }

  /**
   * Notifica os ouvintes do canal
   * @param data
   */
  notify(data: Output): void {
    if (this.closed) return;
    for (const listener of this.#listeners) {
      listener(data);
    }
  }

  /**
   * Adiciona um ouvinte ao canal
   * @param listener
   * @returns {LenzDisposer} Função para remover o ouvinte
   */
  addListener(listener: (data: Output) => void): LenzDisposer {
    if (closed) {
      console.warn(
        "Tentativa de adicionar ouvinte a um canal fechado. Nada foi feito."
      );
      return () => {};
    }

    this.#listeners.add(listener);

    return () => {
      this.#listeners.delete(listener);
    };
  }

  /**
   * Aguarda pelo próximo dado
   * @param signal Sinal de cancelamento
   * @returns {Promise<Output>} Próximo dado recebido
   */
  next(signal?: AbortSignal): Promise<Output> {
    return new Promise((resolve, reject) => {
      const signalListener = () => {
        reject(new DOMException("Aborted", "AbortError"));
        dispose();
      };

      const dispose = this.addListener((data) => {
        dispose();

        if (signal) {
          signal.removeEventListener("abort", signalListener);
        }

        resolve(data);
      });

      if (signal) {
        signal.addEventListener("abort", signalListener);
      }
    });
  }

  /**
   * Aguarda o fechamento do canal
   * @param signal Sinal de cancelamento
   * @returns {Promise<void>}
   */
  waitClose(signal?: AbortSignal): Promise<void> {
    return new Promise((resolve, reject) => {
      if (closed) {
        resolve();
        return;
      }

      const signalListener = () => {
        reject(new DOMException("Aborted", "AbortError"));
        dispose();
      };

      if (signal) {
        signal.addEventListener("abort", signalListener);
      }

      const dispose = () => this.#closeListeners.delete(resolve);

      this.#closeListeners.add(resolve);
    });
  }

  /**
   * Retorna um iterador assíncrono para escutar os dados
   * @param signal
   * @returns {AsyncIterableIterator<Output>}
   */
  async *listen(signal?: AbortSignal): AsyncIterableIterator<Output> {
    if (this.closed) return;

    while (!this.closed) {
      let isClosed = false;
      let value: any;

      await Promise.race([
        this.next(signal).then((data) => {
          value = data;
        }),
        this.waitClose(signal).then(() => {
          isClosed = true;
        }),
      ]);

      if (isClosed && value === undefined) {
        return;
      }

      yield value;
    }
  }

  /**
   * Fecha a porta
   */
  close(): void {
    if (this.closed) return;

    this.#listeners.clear();
    this.#closeListeners.forEach((listener) => listener());
    this.#closeListeners.clear();
  }
}

/**
 * Representa uma Referência Reativa
 */
export class Ref<T = unknown> {
  #def: RefGetSet<T>;
  #effects = new Set<() => void>();

  /**
   * Valor atual da referência
   */
  get value(): T {
    return this.#def.get();
  }

  /**
   * Define o valor da referência
   * @param value Novo valor
   */
  set value(value: T) {
    this.#def.set(value);
  }

  constructor(
    factory: (track: () => void, trigger: () => void) => RefGetSet<T>
  ) {
    this.#def = factory(
      () => Ref.track(this as any),
      () => Ref.trigger(this as any)
    );
  }

  /**
   * Converte a referência em uma porta de canal
   * @returns 
   */
  asPort(): ChannelPort<T, T> {
    const port: ChannelPort<T, T> = createChannelPort((data) => {
      this.value = data;
    });

    const dispose = watch<any>(this, (value) => {
      port.notify(value as any);
    });

    port.waitClose().then(() => dispose());

    return port;
  }

  /**
   * Adiciona um efeito à ref
   * @param ref
   * @param effect
   * @returns
   */
  static addEffect(ref: Ref<any>, effect: () => void): LenzDisposer {
    ref.#effects.add(effect);

    return () => {
      ref.#effects.delete(effect);
    };
  }

  /**
   * Dispara a ref
   * @param ref
   */
  static trigger(ref: Ref<unknown>) {
    ref.#effects.forEach((effect) => effect());
  }

  /**
   * Adiciona o efeito atual na ref
   * @param ref
   * @returns
   */
  static track(ref: Ref<unknown>) {
    if (!currentScope) {
      console.warn(
        "Tentativa de rastrear referência fora de um escopo de efeito. Nada foi feito."
      );
      return;
    }

    if (!currentScope.currentEffect) {
      return;
    }

    const dispose = Ref.addEffect(ref, currentScope.currentEffect);

    currentScope.addDisposer(dispose);
  }
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
export function createChannelPort<Input = unknown, Output = Input>(
  send: (data: Input) => void
): ChannelPort<Input, Output> {
  return new ChannelPort<Input, Output>(send);
}

/**
 * Cria um novo canal de comunicação
 * @returns {[inputPort: ChannelPort<Input, Output>, outputPort: ChannelPort<Output, Input>]} Canal de comunicação
 */
export function createChannel<Input = unknown, Output = Input>(): [
  inputPort: ChannelPort<Input, Output>,
  outputPort: ChannelPort<Output, Input>,
] {
  const inputPort: ChannelPort<Input, Output> = createChannelPort((data) =>
    outputPort.notify(data)
  );
  const outputPort: ChannelPort<Output, Input> = createChannelPort((data) =>
    inputPort.notify(data)
  );

  inputPort.waitClose().then(() => outputPort.close());
  outputPort.waitClose().then(() => inputPort.close());

  return [inputPort, outputPort];
}

/**
 * Cria uma referência reativa customizada
 * @param factory
 * @returns {Ref<T>}
 */
export function createCustomRef<T>(
  factory: (track: () => void, trigger: () => void) => RefGetSet<T>
): Ref<T> {
  return new Ref(factory);
}

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
export function ref<T>(value?: T): Ref<T | undefined> {
  return createCustomRef((track, trigger) => ({
    get() {
      track();
      return value;
    },
    set(newValue) {
      if (newValue === value) return;
      value = newValue;
      trigger();
    },
  }));
}

/**
 * Representa um escopo de efeito
 */
export class EffectScope {
  #disposed = false;
  currentEffect: ((...args: any[]) => void) | null = null;

  #disposers = new Set<LenzDisposer>();

  #disposer?: LenzDisposer;

  constructor(parent: EffectScope | null = null) {
    this.#disposer = parent?.addDisposer(() => this.dispose());

    if (this.#disposer) {
      this.addDisposer(this.#disposer);
    }
  }

  /**
   * Adiciona um disposer ao escopo
   * @param disposer
   * @returns
   */
  addDisposer(disposer: LenzDisposer): LenzDisposer {
    if (this.#disposed) {
      console.warn(
        "Tentativa de adicionar disposer a um escopo de efeito descartado. Nada foi feito."
      );
    }

    this.#disposers.add(disposer);

    return () => {
      this.#disposers.delete(disposer);
    };
  }

  /**
   * Executa um efeito neste escopo
   * @param effect
   * @returns
   */
  run<T>(effect: () => T, track = false) {
    if (this.#disposed) {
      console.warn(
        "Tentativa de executar efeito em um escopo de efeito descartado. Nada foi feito."
      );

      return null as T;
    }

    const previousScope = currentScope;
    const previousEffect = this.currentEffect;

    currentScope = this;

    this.currentEffect = track ? effect : null;

    const result = effect();

    this.currentEffect = previousEffect;
    currentScope = previousScope;

    return result;
  }

  /**
   * Descarta o escopo e todos os efeitos associados
   */
  dispose() {
    if (this.#disposed) return;

    this.#disposed = true;

    for (const disposer of this.#disposers) {
      disposer();
    }

    this.#disposers.clear();
    this.currentEffect = null;
  }
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
export function createScope(cb?: () => void): EffectScope {
  const scope = new EffectScope(currentScope);

  if (cb) {
    scope.run(cb);
  }

  return scope;
}

/**
 * Adiciona um disposer ao escopo de efeito atual
 * @param cb
 * @returns {LenzDisposer}
 */
export function onDispose(cb: () => void): LenzDisposer {
  return getCurrentScope().addDisposer(cb);
}

let currentScope = new EffectScope(null);

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
export function getCurrentScope() {
  return currentScope;
}

/**
 * Obtém o valor de uma referência reativa, função ou valor
 * @param source
 * @returns
 */
export function toValue<T>(source: WatchSource<T> | T): T {
  if (typeof source === "function") {
    return (source as () => T)();
  }

  if (source instanceof Ref) {
    return source.value;
  }

  return source;
}

export type WatchSource<T = unknown> = Ref<T> | (() => T);

type WatchSourceValue<S> =
  S extends WatchSource<infer T>
    ? T
    : S extends WatchSource<any>[]
      ? { [K in keyof S]: WatchSourceValue<S[K]> }
      : never;

/**
 * Observa uma referência reativa
 * @param source
 * @param cb
 * @param options
 * @returns
 */
export function watch<const S extends (WatchSource<any> | WatchSource<any>[])>(
  sources: S,
  cb: (
    value: WatchSourceValue<S>,
    oldValue: WatchSourceValue<S> | undefined
  ) => void,
  { immediate = false }: { immediate?: boolean } = {}
): LenzDisposer {
  let value = Array.isArray(sources)
    ? (sources.map(toValue) as WatchSourceValue<S>[])
    : (toValue(sources) as WatchSourceValue<S>);

  function update() {
    const newValue = Array.isArray(sources)
      ? (sources.map(toValue) as WatchSourceValue<S>[])
      : (toValue(sources) as WatchSourceValue<S>);

    if (immediate) {
      immediate = false;
      return [newValue, undefined];
    }

    if (
      newValue === value ||
      (Array.isArray(sources) &&
        Array.isArray(newValue) &&
        Array.isArray(value) &&
        newValue.length === value.length &&
        newValue.every((v, i) => v === (value as any[])[i]))
    ) {
      return;
    }

    let oldValue = value as any;

    value = newValue;

    return [value, oldValue];
  }

  return watchEffect(() => {
    const result = update();

    if (result) {
      cb(result[0], result[1]);
    }
  });
}

/**
 * Executa um efeito e observa suas dependências
 * @param effect
 * @param param1
 * @returns
 */
export function watchEffect(effect: () => void): LenzDisposer {
  const scope = createScope();

  scope.run(effect, true);

  return () => scope.dispose();
}