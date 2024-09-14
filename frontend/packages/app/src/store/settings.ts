import { defineStore } from "pinia";

export const useSettingsStore = defineStore("settings", () => {
    const settings = useLocalStorage<any>("settings", {
        files: {
            autosave: true
        },
        frame: {
            width: 1024
        }
    });
    
    return {
        settings,
    };
});