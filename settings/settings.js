/**
 *  Cauldron Settings
 *  Provides settings that are preserved via localStorage
 *
 *  Copyright 2020, 2021 Rolf Bagge, Janus B. Kristensen, CAVI,
 *  Center for Advanced Visualization and Interaction, Aarhus University
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0

 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 **/

class CauldronSettings {
    /**
     * Sets word-wrap state
     * @param {boolean} state - true/false state of word-wrap
     */
    static setWordwrap(state) {
        CauldronSettings.setSetting(CauldronSettings.SETTINGS.wordWrap, state);
    }

    /**
     *
     * @returns {boolean} true/false depending on if word wrap should be enabled or not
     */
    static getWordwrap() {
        return CauldronSettings.getSetting(CauldronSettings.SETTINGS.wordWrap, false);
    }

    static getShadowRoot(){
        return CauldronSettings.getSetting(CauldronSettings.SETTINGS.shadowRoot, false);
    }
    static setShadowRoot(value) {
        CauldronSettings.setSetting(CauldronSettings.SETTINGS.shadowRoot, value);
    }     

    static setTheme(theme) {
        CauldronSettings.setSetting(CauldronSettings.SETTINGS.theme, theme);
    }    
    
    static getTheme(){
        // Try to detect the browser default theme if not set
        let defaultTheme = "light";
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            defaultTheme = "dark";
        }
        
        return CauldronSettings.getSetting(CauldronSettings.SETTINGS.theme, defaultTheme);        
    }

    /**
     *
     * @param {string} key
     * @param {any} setting
     */
    static setSetting(key, setting) {
        let settings = CauldronSettings.getSettings();
        settings[key] = setting;
        CauldronSettings.setSettings(settings);
    }

    /**
     *
     * @param {string} key
     * @param {any} defaultValue
     */
    static getSetting(key, defaultValue) {
        let settings = CauldronSettings.getSettings();
        if(settings.hasOwnProperty(key)) {
            return settings[key];
        }

        return defaultValue;
    }

    /**
     *
     * @param {Object} settings
     */
    static setSettings(settings) {
        localStorage.setItem(CauldronSettings.STORAGE_KEY, JSON.stringify(settings));

        EventSystem.triggerEvent("Cauldron.Settings.Updated", settings);
        console.log("Settings updated:", settings);
    }

    /**
     *
     * @returns {Object}
     */
    static getSettings() {
        try {
            let settings = JSON.parse(localStorage.getItem(CauldronSettings.STORAGE_KEY));

            if(settings == null || typeof settings !== "object") {
                settings = {};
            }

            return settings;
        } catch(e) {
            //Ignore
            console.warn("Unable to load CauldronSettings, resetting...");
        }

        return {}
    }
}

window.Cauldron.CauldronSettings = CauldronSettings;

CauldronSettings.SETTINGS = {
    "wordWrap": "wordWrap",
    "theme" : "theme",
    "shadowRoot": "shadowRoot"
};

CauldronSettings.STORAGE_KEY = "Cauldron.Settings.Key";
