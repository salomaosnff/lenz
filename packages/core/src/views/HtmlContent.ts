import { ViewContent } from ".";

export abstract class HtmlContent implements ViewContent {
    #element: HTMLElement | null = null;

    abstract createElement(): HTMLElement;

    async onInit() {
        this.#element = this.createElement();
    }

    
}