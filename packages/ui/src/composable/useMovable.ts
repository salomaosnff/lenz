import { MaybeRefOrGetter, ref, toValue, watch } from "vue";

export interface UseMovableOptions {
  x?: MaybeRefOrGetter<number | undefined>;
  y?: MaybeRefOrGetter<number | undefined>;
  onStart?(): void;
  onStop?(): void;
  onMove?(x: number, y: number): void;
}

export function useMovable(options: UseMovableOptions = {}) {
  const x = ref(toValue(options.x) ?? 0);
  const y = ref(toValue(options.y) ?? 0);

  watch(
    () => toValue(options.x),
    (value) => {
      x.value = value ?? 0;
    }
  );

  watch(
    () => toValue(options.y),
    (value) => {
      y.value = value ?? 0;
    }
  );

  function startMove(event?: MouseEvent) {
    let startX = event?.clientX;
    let startY = event?.clientY;

    function move(event: MouseEvent) {
      if (startX !== undefined && startY !== undefined) {
        x.value += event.clientX - startX;
        y.value += event.clientY - startY;
        options.onMove?.(x.value, y.value);
      }

      startX = event.clientX;
      startY = event.clientY;
    }

    function stop() {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", stop);
      options.onStop?.();
    }

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", stop);

    options.onStart?.();
  }

  return { x, y, startMove };
}
