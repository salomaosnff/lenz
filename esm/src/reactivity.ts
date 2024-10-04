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
export class Ref<T> extends ChannelPort<T, T> {
  #get: () => T;
  #set: (value: T) => void;

  /**
   * Valor atual da referência
   */
  get value(): T {
    return this.#get();
  }

  /**
   * Define o valor da referência
   * @param value Novo valor
   */
  set value(value: T) {
    this.#set(value);
  }

  constructor(
    factory: (sender: ChannelPort<T>, receiver: ChannelPort<T>) => RefGetSet<T>
  ) {
    super((data) => {
      console.warn("Atualize a referência por meio de `value`.");
      this.value = data;
    });

    const sender = createChannelPort<T, T>((data) => this.notify(data));

    const { get, set } = factory(sender, this);

    this.#get = get;
    this.#set = set;
  }

  /**
   * Cria uma cópia da referência
   * @param ref
   * @returns
   */
  static clone<T>(ref: Ref<T>): Ref<T> {
    const r: Ref<T> = createCustomRef((sender, receiver) => {
      const disposer = ref.addListener((data) => sender.send(data));

      receiver.waitClose().then(() => disposer());

      return {
        get() {
          return ref.value;
        },
        set(value) {
          ref.value = value;
        },
      };
    });

    return r;
  }

  /**
   * Espelha o valor de uma referência em outra
   * @param from Referência de origem
   * @param to Referência de destino
   * @param bidirecional Se o espelhamento deve ser bidirecional
   * @returns {LenzDisposer} Função para remover o espelhamento
   */
  static mirror<T>(
    from: Ref<T>,
    to: Ref<T>,
    bidirecional = false
  ): LenzDisposer {
    to.value = from.value;

    const disposers = new Set<LenzDisposer>();

    const disposer = from.addListener((data) => {
      to.value = data;
    });

    disposers.add(disposer);

    if (bidirecional) {
      const disposer = to.addListener((data) => {
        from.value = data;
      });

      disposers.add(disposer);
    }

    return () => {
      for (const disposer of disposers) {
        disposer();
      }

      disposers.clear();
    };
  }
}

/**
 * Objeto get/set para referência reativa
 */
export interface RefGetSet<T> {
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
  factory: (sender: ChannelPort<T>, receiver: ChannelPort<T>) => RefGetSet<T>
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
  return createCustomRef((sender) => {
    return {
      get() {
        return value;
      },
      set(newValue) {
        if (newValue === value) return;
        value = newValue;
        sender.send(newValue);
      },
    };
  });
}
