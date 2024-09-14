let channels;

export function getChannels() {
  if (channels) {
    return channels;
  }

  if (!window.__LENZ__CHANNELS) {
    throw new Error("Editor not initialized yet");
  }

  channels = window.__LENZ__CHANNELS;

  delete window.__LENZ__CHANNELS;

  return channels;
}

async function nextTick(cb) {
  return new Promise((resolve) => {
    const task = () => resolve(cb?.());

    if ("setImmediate" in window) {
      return window.setImmediate(task);
    }

    return window.setTimeout(task, 0);
  });
}

export function createChannel() {
  let closed = false;
  const listeners = new Set();

  function isClosed() {
    return closed;
  }

  function close() {
    if (closed) {
      throw new Error("Channel is already closed");
    }
    closed = true;
    listeners.clear();
  }

  const transmitter = {
    close,
    isClosed,
    send(data) {
      if (isClosed()) {
        throw new Error("Cannot send data on a closed channel");
      }
      listeners.forEach((listener) => listener(data));
    },
    addListener(listener) {
      throw new Error("Cannot add listener to a transmitter channel");
    },
    removeListener(listener) {
      throw new Error("Cannot remove listener from a transmitter channel");
    },
  };

  const receiver = {
    close,
    isClosed,
    send(data) {
      throw new Error("Cannot send data on a receiver channel");
    },
    async next(abortSignal) {
      return new Promise((resolve, reject) => {
        nextTick(() => {
          if (isClosed()) {
            return reject(new Error("Cannot wait next on a closed channel"));
          }

          let disposeAbortSignal;

          const dispose = receiver.addListener((data) => {
            disposeAbortSignal?.();
            dispose();
            resolve(data);
          });

          if (abortSignal) {
            const listener = () => {
              dispose();
              reject(new Error("Channel next operation was aborted"));
            };

            abortSignal.addEventListener("abort", listener, { once: true });
            disposeAbortSignal = () =>
              abortSignal.removeEventListener("abort", listener);
          }
        });
      });
    },
    async *listen(abortSignal) {
      if (isClosed()) {
        throw new Error("Cannot listen on a closed channel");
      }

      while (!isClosed()) {
        yield receiver.next(abortSignal);
      }
    },
    addListener(listener) {
      if (isClosed()) {
        throw new Error("Cannot add listener to a closed channel");
      }

      listeners.add(listener);

      return () => listeners.delete(listener);
    },
    removeListener(listener) {
      if (isClosed()) {
        throw new Error("Cannot remove listener from a closed channel");
      }
      listeners.delete(listener);
    },
  };

  return [transmitter, receiver];
}
