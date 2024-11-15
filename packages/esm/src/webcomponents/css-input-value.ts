const template = document.createElement("template");

template.innerHTML = `
  <style>
    :host {
      display: block;
    }
  </style>
  <input type="text" />
`;

export class CssInputValueElement extends HTMLElement {
  static get observedAttributes() {
    return ["value"];
  }

  #input: HTMLInputElement;

  onAttributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (name === "value" && this.#input.value !== newValue) {
      this.#input.value = newValue;
    }
  }

  get value() {
    return this.#input.value;
  }

  set value(value: string) {
    this.#input.value = value;
  }

  get defaultUnit() {
    return this.getAttribute("default-unit");
  }

  set defaultUnit(value: string | null) {
    if (value) {
      this.setAttribute("default-unit", value);
    } else {
      this.removeAttribute("default-unit");
    }
  }

  constructor() {
    super();

    const root = this.attachShadow({ mode: "open" });

    root.appendChild(template.content.cloneNode(true));

    this.#input = root.querySelector("input")!;

    this.#input.addEventListener("input", () => {
      this.dispatchEvent(
        new CustomEvent("change", {
          detail: {
            value: this.#input.value,
          },
        })
      );
    });

    this.#input.addEventListener("focus", () => {
      this.dispatchEvent(
        new CustomEvent("focus", {
          detail: {
            value: this.#input.value,
          },
        })
      );
    });

    this.#input.addEventListener("blur", () => {
      this.dispatchEvent(
        new CustomEvent("blur", {
          detail: {
            value: this.#input.value,
          },
        })
      );
    });
  }
}
