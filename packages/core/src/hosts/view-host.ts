import { View } from "../types";
import { ViewContent } from "../views";
import { EventHost, ExtensionHost } from "../hosts";

export interface ViewState {
    meta: View;
    extensionId: string;
    visible: boolean;
    content: ViewContent;
    element?: HTMLElement;
}

const viewHost = new Map<string, ViewState>();

export function prepareView(extensionId: string, view: View) {
    if (viewHost.has(view.id)) {
        throw new Error(`View with id "${view.id}" already exists`);
    }

    const viewState = {
        meta: view,
        extensionId,
        visible: false,
        content: {},
    }
    viewHost.set(view.id, viewState);

    EventHost.emit('@app/views:prepare', {
        ...view,
        extension: ExtensionHost.getExtension(extensionId)?.meta,
    });
    EventHost.emit('@app/views:update', viewState);
}

export async function setViewElement(id: string, element: HTMLElement) {
    const view = viewHost.get(id);

    if (!view) {
        throw new Error(`View with id "${id}" not found`);
    }

    view.element = element;

    view.content.onDestroy?.(element)
    view.content.onInit?.(element)

    if (view.visible) {
        await view.content.onShow?.(element);
    }

    EventHost.emit('@app/views:update', view);
}

export function getView(id: string) {
    const view = viewHost.get(id);

    if (!view) {
        throw new Error(`View with id "${id}" not found`);
    }

    return view;
}

export async function setViewContent(id: string, content: ViewContent) {
    hideView(id);
    
    const view = getView(id);

    await view.content.onDestroy?.(view.element as HTMLElement);
    
    view.content = content;

    await content.onInit?.(view.element as HTMLElement);

    if (view.visible) {
        await view.content.onShow?.(view.element as HTMLElement);
    }

    EventHost.emit('@app/views:update', view);
}

export async function showView(id: string) {
    const view = getView(id);

    if (view.visible) {
        return;
    }

    view.visible = true;
    await view.content.onShow?.(view.element as HTMLElement);

    EventHost.emit('@app/views:update', view);
}

export async function hideView(id: string) {
    const view = getView(id);

    if (!view.visible) {
        return;
    }

    view.visible = false;

    await view.content.onHide?.(view.element as HTMLElement);

    EventHost.emit('@app/views:update', view);
}

export function getViews() {
    return Array.from(viewHost.values());
}

export function removeView(id: string) {
    const view = viewHost.get(id);

    if (!view) {
        throw new Error(`View with id "${id}" not found`);
    }

    hideView(id);

    viewHost.delete(id);

    EventHost.emit('@app/views:remove', view);
}

export default {
    prepareView,
    setViewElement,
    getView,
    setViewContent,
    showView,
    hideView,
    getViews,
    removeView
};