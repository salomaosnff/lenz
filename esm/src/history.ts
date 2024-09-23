/**
 * Módulo para manipulação do histórico de edições
 * @module lenz:history 
 */

function isEqual(a: any, b: any): boolean {
  if (a === b) {
    return true;
  }

  if (a.length !== b.length) {
    return false;
  }

  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) {
      return false;
    }
  }

  return true;
}

/**
 * TODO: Reimplementar usando uma lista ligada para melhorar a performance
 */
export class History {
  static MAX_SIZE = 100;

  past: any[];
  future: any[];

  constructor(data: any) {
    this.past = [data];
    this.future = [];
  }

  /**
   * Obtém o último estado salvo
   * @returns
   */
  read() {
    return this.past[this.past.length - 1];
  }

  /**
   * Salva um novo estado no histórico
   * @param data
   */
  save(data: any) {
    if (isEqual(this.read(), data)) {
      return;
    }

    this.past.push(data);
    this.future = [];

    if (this.past.length > History.MAX_SIZE) {
      this.past.splice(0, this.past.length - History.MAX_SIZE);
    }
  }

  /**
   * Desfaz a última ação
   * @returns Conteúdo anterior
   */
  undo() {
    if (this.past.length < 2) {
      return this.read();
    }

    this.future.push(this.past.pop());

    return this.read();
  }

  /**
   * Refaz a última ação desfeita
   * @returns Conteúdo posterior
   */
  redo() {
    if (this.future.length > 0) {
      this.past.push(this.future.pop());
    }

    return this.read();
  }
}

/**
 * Mapeia arquivos com seus respectivos históricos
 */
export class HistoryStore {
  store = new Map<string, History>();

  /**
   * Salva um novo estado para um arquivo
   * @param key Caminho para o arquivo
   * @param data Dados a serem salvos
   */
  save(key: string, data: string) {
    if (this.store.has(key)) {
      this.store.get(key)?.save(data);
    } else {
      this.store.set(key, new History(data));
    }
  }

  /**
   * Desfaz a última edição de um arquivo
   * @param key
   * @returns
   */
  undo(key: string) {
    return this.store.get(key)?.undo();
  }

  /**
   * Refaz a última edição desfeita de um arquivo
   * @param key
   * @returns
   */
  redo(key: string) {
    return this.store.get(key)?.redo();
  }

  /**
   * Remove o histórico de um arquivo
   * @param key
   */
  drop(key: string) {
    this.store.delete(key);
  }

  /**
   * Obtém o conteúdo atual de um arquivo
   * @param key
   * @returns
   */
  read(key: string) {
    return this.store.get(key)?.read();
  }

  /**
   * Retorna se é possível desfazer a última ação
   * @param key
   * @returns
   */
  canUndo(key: string) {
    return (this.store.get(key)?.past.length ?? 0) > 1;
  }

  /**
   * Retorna se é possível refazer a última ação desfeita
   * @param key
   * @returns
   */
  canRedo(key: string) {
    return (this.store.get(key)?.future.length ?? 0) > 0;
  }
}

const globalHistory = new HistoryStore();

/**
 * Salva um novo estado para um arquivo
 * @param key
 * @param data
 * @returns
 */
export function save(key: string, data: string) {
  return globalHistory.save(key, data);
}

/**
 * Desfaz a última ação
 * @param key 
 * @returns 
 */
export function undo(key: string) {
  return globalHistory.undo(key);
}

/**
 * Refaz a última ação desfeita
 * @param key 
 * @returns 
 */
export function redo(key: string) {
  return globalHistory.redo(key);
}

/**
 * Remove o histórico de um arquivo
 * @param key 
 * @returns 
 */
export function drop(key: string) {
  return globalHistory.drop(key);
}

/**
 * Obtém o conteúdo atual de um arquivo
 * @param key 
 * @returns 
 */
export function read(key: string) {
  return globalHistory.read(key);
}

/**
 * Retorna se é possível desfazer a última ação
 * @param key 
 * @returns 
 */
export function canUndo(key: string) {
  return globalHistory.canUndo(key);
}

/**
 * Retorna se é possível refazer a última ação desfeita
 * @param key 
 * @returns 
 */
export function canRedo(key: string) {
  return globalHistory.canRedo(key);
}
