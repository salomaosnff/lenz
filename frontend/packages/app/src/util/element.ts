
export function getSpecificElementSelector(element: Element): string {
    let selector = `${element.tagName.toLowerCase()}`;

    if (element.tagName === 'HTML') {
        return 'html';
    }

    if (element.tagName === 'BODY') {
        return `${getSpecificElementSelector(element.parentElement as Element)} > body`;
    }

    if (element.id) {
        selector += `#${element.id}`;

        return selector;
    }

    if (element.classList.length) {
        selector += `.${Array.from(element.classList).join('.')}`;
    }
    
    if (element.parentElement) {
        const index = Array.from(element.parentElement.children).indexOf(element);

        selector += `:nth-child(${index + 1})`;

        return `${getSpecificElementSelector(element.parentElement)} > ${selector}`;
    }

    return selector;
}