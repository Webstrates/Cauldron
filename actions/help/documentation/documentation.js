/**
 *  Help Actions
 *  Links to various API and help documentation
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

{
    let documentationMenu = MenuSystem.MenuManager.createMenu("Cauldron.Help.Documentation");

    MenuSystem.MenuManager.registerMenuItem("Cauldron.Help", {
        label: "Documentation",
        icon: IconRegistry.createIcon("mdc:menu_book"),
        submenu: documentationMenu
    });

    MenuSystem.MenuManager.registerMenuItem("Cauldron.Help.Documentation", {
        label: "Webstrates",
        icon: IconRegistry.createIcon("webstrates:logo"),
        onAction: () => {
            window.open("https://webstrates.github.io/userguide/api.html");
        }
    });

    MenuSystem.MenuManager.registerMenuItem("Cauldron.Help.Documentation", {
        label: "Codestrates",
        icon: IconRegistry.createIcon("webstrates:codestrates"),
        onAction: () => {
            window.open("https://codestrates.projects.cavi.au.dk/codestrates/");
        }
    });

    MenuSystem.MenuManager.registerMenuItem("Cauldron.Help.Documentation", {
        label: "Cauldron",
        icon: IconRegistry.createIcon("webstrates:cauldron"),
        onAction: () => {
            window.open("https://codestrates.projects.cavi.au.dk/cauldron/");
        }
    });

    MenuSystem.MenuManager.registerMenuItem("Cauldron.Help.Documentation", {
        label: "Webstrate Components",
        icon: IconRegistry.createIcon("webstrates:components"),
        onAction: () => {
            window.open("https://webstrate.projects.cavi.au.dk/docs/webstrate_components/");
        }
    });

    MenuSystem.MenuManager.registerMenuItem("Cauldron.Help.Documentation", {
        label: "Webstrate Package Manager",
        icon: IconRegistry.createIcon("webstrates:wpm-package-open"),
        onAction: () => {
            window.open("https://webstrate.projects.cavi.au.dk/docs/wpmv2/");
        }
    });
}
