import { Ref } from "../reactivity.js";
import { IconWidget } from "./icon.js";

export interface ButtonOptions {
  text?: string;
  icon?: string;
  active?: Ref<boolean>;
  mode: "icon" | "text" | "both";
}

export class ButtonWidget extends HTMLElement {
  constructor(options: ButtonOptions) {
    super();

    const shadowRoot = this.attachShadow({ mode: "open" });

    const button = document.createElement("button")

    shadowRoot.appendChild(button);

    if (options.icon && (options.mode === 'both' || options.mode === 'icon')) {
      const icon = new IconWidget(options.icon);

      button.appendChild(icon);
    }

    if (options.text && (options.mode === 'both' || options.mode === 'text')) {
      button.textContent = options.text;
    }
  }
}

customElements.define('button-widget', ButtonWidget);