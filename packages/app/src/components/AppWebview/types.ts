export interface WebviewSenderChannel<T> {
  close(): void;
  isClosed(): boolean;
  send(data: T): void;
}

export interface WebviewReceiverChannel<T> {
  close(): void;
  isClosed(): boolean;
  addListener(listener: (data: T) => void): () => void;
  next(): Promise<T>;
  listen(): AsyncIterableIterator<T>;
}

export type WebviewChannel<T> =
  | WebviewSenderChannel<T>
  | WebviewReceiverChannel<T>;
