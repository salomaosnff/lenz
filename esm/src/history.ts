/**
 * Módulo para gerenciamento de históricos
 * @module lenz:history
 */

import { ensureInitialized } from "./util.js";

function isEqual(a: any, b: any): boolean {
  if (a === b) {
    return true;
  }

  if (typeof a !== typeof b) {
    return false;
  }

  if (Array.isArray(a) && Array.isArray(b) && a.length === b.length) {
    return a.every((v, i) => isEqual(v, b[i]));
  }

  if (
    a instanceof ArrayBuffer &&
    b instanceof ArrayBuffer &&
    a.byteLength === b.byteLength
  ) {
    for (let i = 0; i < a.byteLength; i++) {
      if ((a as any)[i] !== (b as any)[i]) {
        return false;
      }
    }
  }

  if (
    ArrayBuffer.isView(a) &&
    ArrayBuffer.isView(b) &&
    a.byteLength === b.byteLength
  ) {
    return isEqual(a.buffer, b.buffer);
  }

  if (a instanceof Date && b instanceof Date) {
    return a.getTime() === b.getTime();
  }

  if (a instanceof Object && b instanceof Object) {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);

    if (keysA.length !== keysB.length) {
      return false;
    }

    return keysA.every((key) => isEqual(a[key], b[key]));
  }

  return false;
}

/**
 * Representa um estado de um histórico em um determinado momento
 */
export class SnapShot<T> {
  constructor(
    /** Dados do snapshot */
    public data: T,
    /** Snapshot anterior */
    public previous: SnapShot<T> | null = null,
    /** Próximo snapshot */
    public next: SnapShot<T> | null = null
  ) {}
}

/**
 * Representa um histórico de snapshots de um determinado estado
 */
export class History<T> {
  /** SnapShot mais antigo */
  oldest: SnapShot<T>;

  /** SnapShot atual */
  current: SnapShot<T>;

  /** Quantidade de snapshots registrados */
  count: number = 1;

  constructor(
    /** Dados iniciais */
    public data: T,

    /** Capacidade máxima de snapshots */
    public capacity = 100
  ) {
    this.oldest = new SnapShot(data);
    this.current = this.oldest;
  }

  /**
   * Retorna se é possível voltar ao estado anterior
   */
  get canUndo() {
    return !!this.current.previous;
  }

  /**
   * Retorna se é possível refazer o próximo estado
   */
  get canRedo() {
    return !!this.current.next;
  }

  /**
   * Desfaz o estado atual
   * @returns Dados do estado anterior
   */
  undo() {
    if (this.current.previous) {
      this.current = this.current.previous;
      this.count--;
    }

    return this.current.data;
  }

  /**
   * Refaz o próximo estado
   * @returns Dados do próximo estado
   */
  redo() {
    if (this.current.next) {
      this.current = this.current.next;
      this.count++;
    }

    return this.current.data;
  }

  /**
   * Adiciona um novo estado ao histórico
   * @param data Dados a serem salvos
   * @returns Dados salvos
   */
  push(data: T) {
    if (isEqual(data, this.current.data)) {
      return data;
    }

    const newSnapShot = new SnapShot(data, this.current);

    this.current.next = newSnapShot;
    this.current = newSnapShot;

    this.count++;

    while (this.count > this.capacity) {
      this.oldest = this.oldest.next!;
      this.oldest.previous = null;
      this.count--;
    }

    return data;
  }

  /**
   * Exclui todos os snapshots mais antigos que o snapshot atual
   */
  clear() {
    const current = this.current;

    current.previous = null;
    current.next = null;

    this.current = current;
    this.oldest = current;
    this.count = 1;
  }
}

/**
 * Obtém o histórico de um estado ou cria um novo
 * @param key Identificador do estado
 * @param initialData Dados iniciais
 * @returns
 */
export function ensureHistory(key: string, initialData: string) {
  return ensureInitialized().history().ensureHistory(key, initialData);
}

/**
 * Salva um novo estado
 * @param key Identificador do estado
 * @param data Dados a serem salvos
 * @returns
 */
export function save(key: string, data: string) {
  return ensureInitialized().history().save(key, data);
}

/**
 * Volta para o estado anterior
 * @param key
 * @returns
 */
export function undo(key: string) {
  return ensureInitialized().history().undo(key);
}

/**
 * Refaz o próximo estado
 * @param key
 * @returns
 */
export function redo(key: string) {
  return ensureInitialized().history().redo(key);
}

/**
 * Exclui todo o histórico deste estado
 * @param key
 * @returns
 */
export function drop(key: string) {
  return ensureInitialized().history().drop(key);
}

/**
 * Obtém o estado atual
 * @param key
 * @returns
 */
export function read(key: string) {
  return ensureInitialized().history().read(key);
}

/**
 * Retorna se é possível voltar ao estado atual
 * @param key
 * @returns
 */
export function canUndo(key: string) {
  return ensureInitialized().history().canUndo(key);
}

/**
 * Retorna se é possível refazer refazer o próximo estado
 * @param key
 * @returns
 */
export function canRedo(key: string) {
  return ensureInitialized().history().canRedo(key);
}
