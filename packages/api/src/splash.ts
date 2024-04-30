import { invoke } from "@tauri-apps/api/core";

export function show() {
    return invoke('splash_show')
}
export function hide() {
    return invoke('splash_hide')
}