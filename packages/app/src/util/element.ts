export function getSpecificElementSelector(element: HTMLElement): string {
  const path: string[] = [];

  let currentElement: HTMLElement | null = element;

  while (currentElement) {
    if (currentElement.id) {
      path.unshift(`#${currentElement.id}`);
      break;
    }

    let selector = currentElement.tagName.toLowerCase();

    if (currentElement.classList.length) {
      selector += `.${Array.from(currentElement.classList)
        .map((className) => className.trim())
        .join(".")}`;
    }

    const siblings = Array.from(
      currentElement.parentElement?.children ?? []
    ).filter((el) => el.tagName === currentElement?.tagName);

    if (siblings.length > 1) {
      const index = siblings.indexOf(currentElement);
      selector += `:nth-of-type(${index + 1})`;
    }

    path.unshift(selector);

    currentElement = currentElement.parentElement;
  }

  return path.join(" > ");
}
