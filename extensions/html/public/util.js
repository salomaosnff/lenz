export function createElement(tag, { attrs, domProps, style, children } = {}) {
  const el = document.createElement(tag);

  if (attrs) {
    for (const [attr, value] of Object.entries(attrs)) {
      el.setAttribute(attr, value);
    }
  }

  if (style) {
    for (const [property, value] of Object.entries(style)) {
      el.style.setProperty(property, value);
    }
  }

  if (domProps) {
    for (const [prop, value] of Object.entries(domProps)) {
      el[prop] = value;
    }
  }

  if (children) {
    el.append(...children);
  }

  return el;
}
