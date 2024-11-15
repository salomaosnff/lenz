export function getSpecificElementSelector(element: HTMLElement): string {
  if (element.tagName === "BODY" || element.tagName === "HTML") {
    return element.tagName.toLowerCase();
  }

  let current: HTMLElement | null = element;

  const path: string[] = [];

  while (current) {
    if (current.tagName === "BODY" || current.tagName === "HTML") {
        break;
    }

    if (current.id) {
      path.push(`#${current.id}`);
      break;
    }

    let selector = current.tagName.toLowerCase();

    if (current.classList.length) {
      selector += "." + Array.from(current.classList).join(".");
    }

    if (current.parentElement) {
      const siblings = Array.from(current.parentElement.children);
      const index = siblings.indexOf(current);

      selector += `:nth-child(${index + 1})`;
    }

    path.push(selector);
    
    current = current.parentElement;
  }

  return path.reverse().join(" > ");
}
