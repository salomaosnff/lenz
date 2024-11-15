const template = document.createElement("template");

template.innerHTML = `
  <style>
    :host {
      display: inline-block;
    }
  </style>
  <svg fill="currentColor" viewBox="0 0 24 24" style="width: 1.2em; height: 1.2em;">
    <path />
  </svg>
`;

export class IconWidget extends HTMLElement {
  constructor(iconPath: string) {
    super();

    const shadowRoot = this.attachShadow({ mode: "open" });

    shadowRoot.appendChild(template.content.cloneNode(true));

    const path = shadowRoot.querySelector("path") as SVGPathElement;

    path.setAttribute("d", iconPath);
  }

  get icon(): string {
    return this.getAttribute("icon") || "";
  }

  set icon(value: string) {
    this.setAttribute("icon", value);
  }

  static get observedAttributes() {
    return ["icon"];
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (name === "icon" && oldValue !== newValue) {
      const path = this.shadowRoot!.querySelector("path") as SVGPathElement;

      path.setAttribute("d", newValue);
    }
  }
}

customElements.define("icon-widget", IconWidget);