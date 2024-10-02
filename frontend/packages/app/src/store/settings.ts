import { defineStore } from "pinia";

export const useSettingsStore = defineStore("settings", () => {
    const settings = useLocalStorage<any>("settings", {
        files: {
            autosave: {
                enabled: true,
                interval: 3_000
            },
            history: {
                max: 100
            }
        },
        frame: {
            width: 1024
        }
    });
    
    return {
        settings,
    };
});