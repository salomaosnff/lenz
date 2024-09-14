import { getSpecificElementSelector } from "../../util/element";

export interface CanvasElement {
  selector: string;
  element: HTMLElement;
  box: DOMRect;
}

export function simpleElementSelector(el: HTMLElement): string {
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


export function createElementSelection(
  element: HTMLElement,
  iframe?: HTMLIFrameElement,
  selector = getSpecificElementSelector(element)
): CanvasElement {
  const iframeBox = iframe?.getBoundingClientRect() ?? new DOMRect();
  const box = element.getBoundingClientRect();

  return {
    selector,
    element,
    box: new DOMRect(
      iframeBox.x + box.x,
      iframeBox.y + box.y,
      box.width,
      box.height
    ),
  };
}