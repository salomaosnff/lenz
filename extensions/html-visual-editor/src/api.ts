import type { Component, ShallowRef } from "vue";
import type { Disposable } from "lenz-sdk";
import type { EditorSession } from "./session";

export type { EditorSession };
export type { ColorResolver, CssVariable } from "./cssColorResolve";

/** Id of the editor provider, for `when` expressions: `activeEditor == 'html-visual-editor.visual'`. */
export const VISUAL_EDITOR_ID = "html-visual-editor.visual";

/** Id of the view that lists the element builders, in the container of the visual editor. */
export const BUILDERS_VIEW_ID = "html-visual-editor.builders";

/** Id of the layers view, in the `explorer` container. */
export const LAYERS_VIEW_ID = "html-visual-editor.layers";

/** Id of the elements view (the palette), in the extension's own activity bar panel. */
export const ELEMENTS_VIEW_ID = "html-visual-editor.elements";

/** What a drag from the elements view carries: the HTML to insert. The canvas takes the drop. */
export const ELEMENT_DRAG_TYPE = "application/x-lenz-element";

/** What a drag of the selection handle carries: the elements to move (kept by the editor). */
export const ELEMENT_MOVE_TYPE = "application/x-lenz-move";

/** Id of the attributes view, in the `secondary` side bar. */
export const ATTRIBUTES_VIEW_ID = "html-visual-editor.attributes";

/** Context key that is true while one element, other than the page itself, is selected. */
export const CAN_EDIT_ATTRIBUTES_KEY = "html-visual-editor.canEditAttributes";

/** Context key that is true while an element is selected in the visual editor. */
export const HAS_SELECTION_KEY = "html-visual-editor.hasSelection";

/** What the extension exports to the ones that list it in `dependencies`. */
/**
 * A tool that builds an element step by step (a table, a select...), usually in a window of its own.
 * It is listed in the view "Construtores de elementos".
 */
export interface ElementBuilder {
  /** Unique, e.g. `my-extension.table`. */
  readonly id: string;
  /** What the list shows, e.g. `Tabela`. */
  readonly title: string;
  /** One or two lines about what it builds. */
  readonly description?: string;
  /** Icon name, e.g. `lucide:table`. */
  readonly icon: string;
  /** Opens the builder, e.g. its window. */
  open(): void;
}

export interface HtmlEditorApi {
  /** The open visual editor's session, or `null` when none is open. */
  readonly session: Readonly<ShallowRef<EditorSession | null>>;
  /** The color picker field: props `modelValue`, `placeholder`, `variables`, `resolver`. */
  readonly ColorInput: Component;
  /** Adds a builder to the view "Construtores de elementos". Dispose to take it out. */
  registerBuilder(builder: ElementBuilder): Disposable;
  /** The builders that are listed now, in order. */
  readonly builders: readonly ElementBuilder[];
}

/** Context key that is true while there are selected elements and none of them is the page. */
export const CAN_EDIT_ELEMENTS_KEY = "html-visual-editor.canEditElements";
