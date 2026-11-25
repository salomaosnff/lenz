<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, reactive, ref, shallowRef, watch } from "vue";
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuRoot,
  DropdownMenuTrigger,
} from "reka-ui";
import type { EditorDocument } from "lenz-sdk";
import { collectCssVariables, resolverFor } from "./cssColorResolve";
import { ELEMENT_DRAG_TYPE, ELEMENT_MOVE_TYPE } from "./api";
import { BLOCK_FLOW, edgeSide, flowOf, isBefore, lineAt, nearest, type Flow } from "./layoutFlow";
import { session, type EditorSession } from "./session";
import Breadcrumb from "./Breadcrumb.vue";
import { buildDocument, containerTags, describe, isFullDocument, serialize } from "./model";

const props = defineProps<{ document: EditorDocument }>();

interface Box {
  left: number;
  top: number;
  width: number;
  height: number;
}

const frame = ref<HTMLIFrameElement>();
const canvas = ref<HTMLElement>();
const root = shallowRef<HTMLElement | null>(null);
/** Everything selected; the first one is the main element the panels read their values from. */
const selection = shallowRef<HTMLElement[]>([]);
const selected = computed(() => selection.value[0] ?? null);
/** The DOM is not reactive: this bumps after each edit so panels re-read it. */
const version = ref(0);
/** Where a dragged element would land: a line before or after an element, or a container's frame. */
interface DropMark extends Box {
  kind: "line" | "inside";
}
const boxes = reactive<{ selected: Box[]; hover: Box | null; drop: DropMark | null }>({
  selected: [],
  hover: null,
  drop: null,
});

let hovered: HTMLElement | null = null;
let fullDocument = isFullDocument(props.document.content);
// The last content this editor wrote to (or read from) the file. It tells our own edits
// apart from edits made in another editor of the same file.
let synced = props.document.content;
let teardown: (() => void) | undefined;

const doc = () => frame.value?.contentDocument ?? null;

// The canvas is another window, so `instanceof HTMLElement` does not work on its nodes.
const asElement = (target: EventTarget | null) =>
  (target as Node | null)?.nodeType === 1 ? (target as HTMLElement) : null;

const px = (box: Box) => ({
  position: "absolute" as const,
  left: `${box.left}px`,
  top: `${box.top}px`,
  width: `${box.width}px`,
  height: `${box.height}px`,
});

function boxOf(el: HTMLElement | null): Box | null {
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { left: r.left, top: r.top, width: r.width, height: r.height };
}

function updateBoxes() {
  boxes.selected = selection.value.flatMap((el) => boxOf(el) ?? []);
  boxes.hover = hovered && !selection.value.includes(hovered) ? boxOf(hovered) : null;
}

/** Selects an element; `additive` adds it to the selection, or takes it out if it is there. */
function select(el: HTMLElement | null, additive = false) {
  // The page is `body` for the editor; `html` (a click on the empty area) can not be moved,
  // copied or removed, so it stands for `body` too.
  const target = el && el === doc()?.documentElement ? (doc()?.body ?? el) : el;
  if (!target) selection.value = [];
  else if (!additive) selection.value = [target];
  else {
    selection.value = selection.value.includes(target)
      ? selection.value.filter((item) => item !== target)
      : [...selection.value, target];
  }
  updateBoxes();
}

/** Elements that are content of the page, not its plumbing. */
const SKIPPED = new Set(["SCRIPT", "STYLE", "TEMPLATE", "LINK", "META"]);

/**
 * Select all: the children of the selected element (of the page, with nothing selected).
 * An element with no children selects the ones next to it.
 */
function selectAll() {
  if (selection.value.length > 1) return; // everything is already selected
  const target = selected.value ?? root.value;
  if (!target) return;
  const pick = (parent: Element) =>
    [...parent.children].filter((child) => !SKIPPED.has(child.tagName)) as HTMLElement[];
  let items = pick(target);
  if (!items.length && target.parentElement) items = pick(target.parentElement);
  selection.value = items.length ? items : [target];
  updateBoxes();
}

/**
 * Writes the canvas back to the file. `label` names the entry in the file's history; quick edits
 * with the same label (typing, dragging a slider) join one entry unless `merge` is `false`.
 */
function commit(label = "Editar", merge = true) {
  const d = doc();
  if (!d) return;
  synced = serialize(d, fullDocument);
  props.document.setContent(synced, { label, merge });
  version.value++;
  nextTick(updateBoxes);
}

function load(content: string) {
  fullDocument = isFullDocument(content);
  selection.value = [];
  hovered = null;
  boxes.selected = [];
  boxes.hover = null;
  if (frame.value) frame.value.srcdoc = buildDocument(content);
}

/** Ends the text edit in progress and puts the text back as it was; nothing while not editing. */
let cancelEditing: (() => void) | undefined;

function startEditing(el: HTMLElement) {
  const original = el.innerHTML;
  let typed = false;
  let cancelled = false;
  el.contentEditable = "true";
  el.focus();
  const onInput = () => {
    typed = true;
    commit("Editar texto");
  };
  const onBlur = () => {
    el.removeEventListener("input", onInput);
    el.removeAttribute("contenteditable");
    cancelEditing = undefined;
    if (!cancelled) return commit("Editar texto");
    // Cancelled: back to the text it had, in the file too if it was already written there.
    if (!typed) return updateBoxes();
    el.innerHTML = original;
    commit("Editar texto");
  };
  el.addEventListener("input", onInput);
  el.addEventListener("blur", onBlur, { once: true });
  cancelEditing = () => {
    cancelled = true;
    el.blur();
  };
}

function onFrameLoad() {
  teardown?.();
  const d = doc();
  const win = frame.value?.contentWindow;
  if (!d || !win) return;
  root.value = d.body;
  version.value++;

  const onClick = (e: MouseEvent) => {
    e.preventDefault();
    // Ctrl, Cmd or Shift adds to the selection instead of replacing it.
    select(asElement(e.target), e.ctrlKey || e.metaKey || e.shiftKey);
  };
  const onOver = (e: MouseEvent) => {
    hovered = asElement(e.target);
    updateBoxes();
  };
  const onLeave = () => {
    hovered = null;
    updateBoxes();
  };
  const onDblClick = (e: MouseEvent) => {
    const el = asElement(e.target);
    if (el && el !== d.body) startEditing(el);
  };
  const onKey = (e: KeyboardEvent) => {
    const target = e.target as HTMLElement;
    // The canvas is another window, so the app would never see its keys. Shortcuts (they carry a
    // modifier) are handed over; so is a plain key, unless it is text going into a field of the
    // page or into an element being edited. While text is edited only Ctrl/Cmd shortcuts pass.
    // A text edit in progress counts whatever element got the key: it is the user's typing.
    const typing =
      !!cancelEditing ||
      target.isContentEditable ||
      ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
    // Select all, copy, paste... of a text being edited stay with the text.
    const ownsEditing =
      typing &&
      (e.ctrlKey || e.metaKey) &&
      !e.altKey &&
      ["a", "c", "x", "v", "z", "y"].includes(e.key.toLowerCase());
    const modified = !ownsEditing && (e.ctrlKey || e.metaKey || (e.altKey && !typing));
    if (modified || !typing) {
      const copy = new KeyboardEvent("keydown", {
        key: e.key,
        code: e.code,
        ctrlKey: e.ctrlKey,
        altKey: e.altKey,
        shiftKey: e.shiftKey,
        metaKey: e.metaKey,
        cancelable: true,
      });
      // `false` means a shortcut took the keys: keep the page of the canvas from acting on them.
      if (!window.dispatchEvent(copy)) {
        e.preventDefault();
        return;
      }
    }
    if (e.key === "Escape" && cancelEditing) {
      e.preventDefault();
      cancelEditing();
      return;
    }
    if (target.isContentEditable) return;
    if (e.key === "Delete" || e.key === "Backspace") {
      e.preventDefault();
      remove();
    }
  };
  // An element dragged from the elements view lands where it is dropped.
  const carriesElement = (e: DragEvent) => !!e.dataTransfer?.types.includes(ELEMENT_DRAG_TYPE);
  // The selection dragged by its handle: moves the elements instead of inserting new ones.
  const carriesMove = (e: DragEvent) =>
    !!moving && !!e.dataTransfer?.types.includes(ELEMENT_MOVE_TYPE);
  const onDragOver = (e: DragEvent) => {
    if (carriesMove(e)) {
      const place = dropPlace(d, asElement(e.target), e.clientX, e.clientY);
      // Not into itself, nor into what it holds: the drop is refused there.
      if (!canMoveTo(moving!, place)) {
        boxes.drop = null;
        if (e.dataTransfer) e.dataTransfer.dropEffect = "none";
        return;
      }
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
      boxes.drop = markOf(place);
      return;
    }
    if (!carriesElement(e)) return;
    e.preventDefault(); // allows the drop
    if (e.dataTransfer) e.dataTransfer.dropEffect = "copy";
    const place = dropPlace(d, asElement(e.target), e.clientX, e.clientY);
    boxes.drop = markOf(place);
  };
  const onDragLeave = (e: DragEvent) => {
    // Moving between elements fires it too: only leaving the page counts.
    if (!e.relatedTarget) boxes.drop = null;
  };
  const onDrop = (e: DragEvent) => {
    if (carriesMove(e)) {
      e.preventDefault();
      const place = dropPlace(d, asElement(e.target), e.clientX, e.clientY);
      boxes.drop = null;
      if (canMoveTo(moving!, place)) moveTo(moving!, place);
      return;
    }
    if (!carriesElement(e)) return;
    e.preventDefault();
    const html = e.dataTransfer?.getData(ELEMENT_DRAG_TYPE);
    const place = dropPlace(d, asElement(e.target), e.clientX, e.clientY);
    boxes.drop = null;
    if (html) insertAt(html, place);
  };
  d.addEventListener("click", onClick);
  d.addEventListener("mouseover", onOver);
  d.documentElement.addEventListener("mouseleave", onLeave);
  d.addEventListener("dblclick", onDblClick);
  d.addEventListener("keydown", onKey);
  d.addEventListener("dragover", onDragOver);
  d.addEventListener("dragleave", onDragLeave);
  d.addEventListener("drop", onDrop);
  win.addEventListener("scroll", updateBoxes);
  teardown = () => {
    d.removeEventListener("click", onClick);
    d.removeEventListener("mouseover", onOver);
    d.documentElement.removeEventListener("mouseleave", onLeave);
    d.removeEventListener("dblclick", onDblClick);
    d.removeEventListener("keydown", onKey);
    d.removeEventListener("dragover", onDragOver);
    d.removeEventListener("dragleave", onDragLeave);
    d.removeEventListener("drop", onDrop);
    boxes.drop = null;
    win.removeEventListener("scroll", updateBoxes);
  };
}

// ---- Editing actions ------------------------------------------------------

/** Where an element goes: next to `ref`, or at the end of `ref` (a container). */
interface Place {
  ref: HTMLElement;
  where: "before" | "after" | "append";
}

/** Puts the HTML in `place`, selects it and writes the file. */
function insertAt(html: string, place: Place) {
  const d = doc();
  if (!d) return;
  const template = d.createElement("template");
  template.innerHTML = html;
  const node = template.content.firstElementChild as HTMLElement | null;
  if (!node) return;
  if (place.where === "before") place.ref.before(node);
  else if (place.where === "after") place.ref.after(node);
  else place.ref.append(node);
  select(node);
  commit("Inserir elemento", false);
}

/** The elements being dragged by the handle of the selection, or `null`. */
let moving: HTMLElement[] | null = null;

/** Whether the elements may go to `place`: not next to themselves, nor into one of themselves. */
function canMoveTo(els: HTMLElement[], place: Place) {
  return !els.some((el) => el === place.ref || el.contains(place.ref));
}

/** Moves the elements to `place`, in the order they have now, and keeps them selected. */
function moveTo(els: HTMLElement[], place: Place) {
  const ordered = [...els].sort((a, b) =>
    a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1,
  );
  if (place.where === "before") place.ref.before(...ordered);
  else if (place.where === "after") place.ref.after(...ordered);
  else place.ref.append(...ordered);
  selection.value = ordered;
  commit(ordered.length > 1 ? "Mover elementos" : "Mover elemento", false);
}

function startMove(e: DragEvent) {
  if (!canEdit.value || !e.dataTransfer) return e.preventDefault();
  moving = targets();
  e.dataTransfer.setData(ELEMENT_MOVE_TYPE, "move");
  e.dataTransfer.effectAllowed = "move";
}

function endMove() {
  moving = null;
  boxes.drop = null;
}

/** Inserts where the editor is: after the selected element, or inside it if it is a container. */
function insert(html: string) {
  const d = doc();
  if (!d) return;
  const target = selected.value ?? d.body;
  insertAt(html, {
    ref: target,
    where: containerTags.has(target.tagName.toLowerCase()) ? "append" : "after",
  });
}

/** The flow of the children of an element: how a drop among them is placed. */
function flowOfChildren(parent: HTMLElement | null): Flow {
  if (!parent) return BLOCK_FLOW;
  const style = parent.ownerDocument.defaultView!.getComputedStyle(parent);
  const boxes = [...parent.children]
    .filter((child) => !SKIPPED.has(child.tagName))
    .slice(0, 2)
    .map((child) => boxOf(child as HTMLElement)!);
  return flowOf(style, boxes.length === 2 ? [boxes[0]!, boxes[1]!] : undefined);
}

/**
 * Where a drop at this point goes, along the way the elements are laid out (a column of blocks, a
 * flex row, a grid...). On a container the middle takes it inside, next to the child nearest to the
 * pointer (before it in its first half, after it in the second); its edges put it next to the
 * container. On any other element, the first half is before it and the second half after it.
 */
function dropPlace(d: Document, over: HTMLElement | null, x: number, y: number): Place {
  const el = !over || over === d.documentElement ? d.body : over;
  const box = boxOf(el)!;
  if (containerTags.has(el.tagName.toLowerCase())) {
    const edge = el === d.body ? null : edgeSide(flowOfChildren(el.parentElement), box, x, y);
    if (edge) return { ref: el, where: edge };
    const children = [...el.children].filter(
      (child) => !SKIPPED.has(child.tagName),
    ) as HTMLElement[];
    const boxes = children.map((child) => boxOf(child)!);
    const index = nearest(boxes, x, y);
    if (index === -1) return { ref: el, where: "append" };
    const near = children[index]!;
    return {
      ref: near,
      where: isBefore(flowOfChildren(el), boxes[index]!, x, y) ? "before" : "after",
    };
  }
  return {
    ref: el,
    where: isBefore(flowOfChildren(el.parentElement), box, x, y) ? "before" : "after",
  };
}

/** What to draw for a place: a line across the flow where the element would go, or a container's frame. */
function markOf(place: Place): DropMark | null {
  const box = boxOf(place.ref);
  if (!box) return null;
  if (place.where === "append") {
    // At the end of a container: a line after its last child, or the container's frame if empty.
    const last = [...place.ref.children].filter((c) => !SKIPPED.has(c.tagName)).pop() as
      | HTMLElement
      | undefined;
    const lastBox = boxOf(last ?? null);
    return lastBox
      ? { kind: "line", ...lineAt(flowOfChildren(place.ref), lastBox, "after") }
      : { kind: "inside", ...box };
  }
  return { kind: "line", ...lineAt(flowOfChildren(place.ref.parentElement), box, place.where) };
}

/** What the actions below act on: the selected elements, never the page itself. */
const targets = () => selection.value.filter((el) => el !== doc()?.body && el.isConnected);

function remove() {
  const items = targets();
  if (!items.length) return;
  const parent = items[0]!.parentElement;
  items.forEach((el) => el.remove());
  select(parent);
  commit(items.length > 1 ? "Excluir elementos" : "Excluir elemento", false);
}

function duplicate() {
  const items = targets();
  if (!items.length) return;
  const copies = items.map((el) => {
    const copy = el.cloneNode(true) as HTMLElement;
    el.after(copy);
    return copy;
  });
  selection.value = copies;
  commit(items.length > 1 ? "Duplicar elementos" : "Duplicar elemento", false);
}

function move(direction: -1 | 1) {
  const items = targets();
  if (!items.length) return;
  const chosen = new Set(items);
  // Each one steps over its neighbor, unless that is selected too: the group keeps its shape.
  for (const el of direction < 0 ? items : [...items].reverse()) {
    const neighbor = direction < 0 ? el.previousElementSibling : el.nextElementSibling;
    if (!neighbor || chosen.has(neighbor as HTMLElement)) continue;
    if (direction < 0) neighbor.before(el);
    else neighbor.after(el);
  }
  commit(items.length > 1 ? "Mover elementos" : "Mover elemento", false);
}

function selectParent() {
  const parent = selected.value?.parentElement;
  if (parent) select(parent);
}

// ---- Properties -------------------------------------------------------------

const canEdit = computed(
  () => selection.value.length > 0 && selection.value.every((el) => el !== root.value),
);

/** The elements from the page down to the selected one: what the breadcrumb shows. */
const path = computed(() => {
  void version.value;
  const page = root.value;
  if (!page) return [];
  const chain: HTMLElement[] = [];
  for (let el: HTMLElement | null = selected.value ?? page; el; el = el.parentElement) {
    chain.unshift(el);
    if (el === page) break;
  }
  // An element that left the page (it was removed) has no way up to it: only the page is shown.
  return chain[0] === page ? chain : [page];
});

const tag = computed(() => {
  void version.value;
  if (!selected.value) return null;
  const more = selection.value.length - 1;
  return more > 0 ? `${describe(selected.value)} +${more}` : describe(selected.value);
});

// The color picker resolves var() and friends against the selected element, and offers the
// custom properties that element can see.
const colorResolver = computed(() => resolverFor(selected.value));
const cssVariables = computed(() => {
  void version.value;
  return selected.value ? collectCssVariables(selected.value) : [];
});

/** A style goes to every selected element. */
function setStyle(prop: string, value: string) {
  if (!selection.value.length) return;
  for (const el of selection.value) {
    if (value) el.style.setProperty(prop, value);
    else el.style.removeProperty(prop);
    if (!el.getAttribute("style")) el.removeAttribute("style");
  }
  commit(`Estilo: ${prop}`);
}

// Other extensions (the style editor) work on the selection through this session.
const mine: EditorSession = {
  root,
  selected,
  selection,
  version,
  select,
  selectAll,
  commit,
  selectParent,
  duplicate,
  remove,
  move,
  insert,
  setStyle,
  colorResolver,
  cssVariables,
};
session.value = mine;
onBeforeUnmount(() => {
  if (session.value === mine) session.value = null;
});

// ---- Lifecycle ----------------------------------------------------------------

// Edits made in another editor (e.g. the text editor) replace the canvas.
watch(
  () => props.document.content,
  (content) => {
    if (content === synced) return;
    synced = content;
    load(content);
  },
);

const initial = buildDocument(props.document.content);

const observer = new ResizeObserver(updateBoxes);
watch(canvas, (el, _, onCleanup) => {
  if (!el) return;
  observer.observe(el);
  onCleanup(() => observer.disconnect());
});

onBeforeUnmount(() => {
  teardown?.();
  observer.disconnect();
});
</script>

<template>
  <div class="hve">
    <Breadcrumb :path="path" :version="version" @select="(el) => select(el)" />

    <div class="hve-main">
      <div ref="canvas" class="hve-canvas">
        <!-- No allow-scripts: the page being edited can not run code in the app. -->
        <iframe
          ref="frame"
          class="hve-frame"
          sandbox="allow-same-origin"
          :srcdoc="initial"
          title="Canvas"
          @load="onFrameLoad"
        />
        <div v-if="boxes.hover" class="hve-box hover" :style="px(boxes.hover)" />
        <div
          v-if="boxes.drop"
          class="hve-box drop"
          :class="boxes.drop.kind"
          :style="px(boxes.drop)"
        />
        <div
          v-for="(box, index) in boxes.selected"
          :key="index"
          class="hve-box selected"
          :style="px(box)"
        >
          <span v-if="tag && index === 0" class="hve-box-tag" :class="{ inside: box.top < 20 }">
            <!-- The tag, the handle and the menu are the parts of the box that take the mouse. -->
            <!-- Left to right: the tag, the handle to move it, the menu of actions. -->
            {{ tag }}
            <span
              v-if="canEdit"
              class="hve-box-handle"
              draggable="true"
              title="Arraste para mover o elemento"
              aria-label="Mover o elemento"
              @dragstart="startMove"
              @dragend="endMove"
            >
              <!-- Four arrows say "move"; dots are left to the menu, so the two are not mistaken. -->
              <Icon name="lucide:move" class="size-3.5" />
            </span>
            <template v-if="canEdit">
              <!-- The actions of the element are one menu; the handle (a drag, not an action) stays. -->
              <DropdownMenuRoot>
                <DropdownMenuTrigger
                  class="hve-box-action first"
                  title="Ações do elemento"
                  aria-label="Ações do elemento"
                >
                  <Icon name="lucide:ellipsis" class="size-3.5" />
                </DropdownMenuTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuContent class="hve-menu" align="start" :side-offset="4">
                    <DropdownMenuItem class="hve-menu-item" @select="selectParent">
                      <Icon name="lucide:corner-left-up" class="size-3.5" /> Selecionar o pai
                    </DropdownMenuItem>
                    <DropdownMenuItem class="hve-menu-item" @select="move(-1)">
                      <Icon name="lucide:arrow-up" class="size-3.5" /> Mover para cima
                    </DropdownMenuItem>
                    <DropdownMenuItem class="hve-menu-item" @select="move(1)">
                      <Icon name="lucide:arrow-down" class="size-3.5" /> Mover para baixo
                    </DropdownMenuItem>
                    <DropdownMenuItem class="hve-menu-item danger" @select="remove">
                      <Icon name="lucide:trash-2" class="size-3.5" /> Excluir o elemento
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenuPortal>
              </DropdownMenuRoot>
            </template>
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
