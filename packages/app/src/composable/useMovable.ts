import { MaybeRefOrGetter } from "vue";

export interface UseMovableOptions {
  x?: MaybeRefOrGetter<number | undefined>;
  y?: MaybeRefOrGetter<number | undefined>;
}

export function useMovable(options: UseMovableOptions = {}) {
  const x = ref(toValue(options.x) ?? 0);
  const y = ref(toValue(options.y) ?? 0);

  const { lockIframe } = (inject("lockIframe", null) ?? {}) as any;

  function startMove(event?: MouseEvent) {
    let startX = event?.clientX;
    let startY = event?.clientY;

    if (lockIframe) {
      lockIframe.value = true;
    }

    function move(event: MouseEvent) {
      if (startX !== undefined && startY !== undefined) {
        x.value += event.clientX - startX;
        y.value += event.clientY - startY;
      }

      startX = event.clientX;
      startY = event.clientY;
    }

    function stop() {
      if (lockIframe) {
        lockIframe.value = false;
      }
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", stop);
    }

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", stop);
  }

  return { x, y, startMove };
}
