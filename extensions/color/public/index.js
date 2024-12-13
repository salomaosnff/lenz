function toSuggestion(value) {
    if (!value) return;
    if (value.startsWith("var(--color-")) {
        const match = value.match(/var\(--color-(.+?)\)/);

        if (match) {
            return {
                title: match[1],
                value
            }
        }
    } else if (value.startsWith("#") || value.startsWith("rgb") || value.startsWith("rgba") || value.startsWith("hsl") || value.startsWith("hsla") || value.startsWith("transparent")) {
        return {
            value
        }
    }
}

/**
 * 
 * @param {Document} document 
 * @returns 
 */
export function getAllColors(document) {
    const colors = [];

    /** @type {HTMLStyleElement} */
    const themeStyle = document.head.querySelector('style#themes');

    if (themeStyle) {
        for (const rule of themeStyle?.sheet.cssRules) {
            if (rule.selectorText.startsWith(".theme--")) {
                for (const property of rule.style) {
                    if (!property.startsWith("--color-")) {
                        continue;
                    }

                    colors.push({
                        title: property.substring(8),
                        value: `var(${property})`
                    });
                }
            }
        }
    }

    for (const element of document.querySelectorAll('[style]')) {
        for (const property of element.style) {
            const value = element.style.getPropertyValue(property);
            const suggestion = toSuggestion(value);

            if (suggestion) {
                colors.push(suggestion);
            }
        }
    }

    const frequencyMap = colors.reduce((map, color) => {
        const [count = 0, suggestion = color] = map.get(color.value) ?? [];

        map.set(color.value, [count + 1, suggestion]);

        return map;
    }, new Map());

    return Array.from(frequencyMap.values())
        .sort(([countA], [countB]) => countB - countA)
        .map(([_, suggestion]) => suggestion);
}