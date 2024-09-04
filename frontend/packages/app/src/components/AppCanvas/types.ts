export interface CanvasElement {
  element: HTMLElement;
  box: DOMRect;
}

export function getElementSelector(el: HTMLElement): string {
  let selector = `${el.tagName.toLowerCase()}`;

  if (el.id) {
    selector += `#${el.id}`;

    return selector;
  }

  if (el.classList.length) {
    for (const className of el.classList) {
      selector += `.${className}`;
    }

    return selector;
  }

  return selector;
}
