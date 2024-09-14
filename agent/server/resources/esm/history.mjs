function isEqual(a, b) {
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

  constructor(data) {
    this.past = [data];
    this.future = [];
  }

  read() {
    return this.past[this.past.length - 1];
  }

  save(data) {
    if (isEqual(this.read(), data)) {
      return;
    }

    this.past.push(data);
    this.future = [];

    if (this.past.length > History.MAX_SIZE) {
      this.past.splice(0, this.past.length - History.MAX_SIZE);
    }
  }

  undo() {
    if (this.past.length < 2) {
      return this.read();
    }

    this.future.push(this.past.pop());

    return this.read();
  }

  redo() {
    if (this.future.length > 0) {
      this.past.push(this.future.pop());
    }

    return this.read();
  }
}

export class HistoryStore {
  constructor() {
    this.store = new Map();
  }

  save(key, data) {
    if (this.store.has(key)) {
      this.store.get(key).save(data);
    } else {
      this.store.set(key, new History(data));
    }
  }

  undo(key) {
    return this.store.get(key)?.undo();
  }

  redo(key) {
    return this.store.get(key)?.redo();
  }

  drop(key) {
    this.store.delete(key);
  }

  read(key) {
    return this.store.get(key)?.read();
  }

  canUndo(key) {
    return this.store.get(key)?.past.length > 1;
  }

  canRedo(key) {
    return this.store.get(key)?.future.length > 0;
  }
}

const globalHistory = new HistoryStore();

export function save(key, data) {
  return globalHistory.save(key, data);
}

export function undo(key) {
  return globalHistory.undo(key);
}

export function redo(key) {
  return globalHistory.redo(key);
}

export function drop(key) {
  return globalHistory.drop(key);
}

export function read(key) {
  return globalHistory.read(key);
}

export function canUndo(key) {
  return globalHistory.canUndo(key);
}

export function canRedo(key) {
  return globalHistory.canRedo(key);
}
