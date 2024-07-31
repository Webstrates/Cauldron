/**
 *  CauldronMainMenu
 *  The primary top menu of Cauldron
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
    
/**
 * The primary top menu of Cauldron
 */    
window.CauldronMainMenu = class MainMenu {
    constructor(cauldron){        
        this.menu = MenuSystem.MenuManager.createMenu("Cauldron.MainMenu", {
            keepOpen: true,
            layoutDirection: MenuSystem.Menu.LayoutDirection.HORIZONTAL
        });
        
        // Register the basic submenus etc. that are always there
        let fileMenu = MenuSystem.MenuManager.createMenu("Cauldron.File", {
            context: {cauldron: cauldron},
            groupDividers: true,
            growDirection: MenuSystem.Menu.GrowDirection.DOWN
        });
        let syncMenu = MenuSystem.MenuManager.createMenu("Cauldron.File.Sync");
        fileMenu.addItem({
            label: "Sync...",
            group: "FileDirect",
            groupOrder: -1,
            order: 100,
            icon: IconRegistry.createIcon("mdc:cloud_sync"),
            onOpen: (menu)=>{
                return syncMenu.menuItems && syncMenu.menuItems.length>0;
            },
            submenu: syncMenu
        });
        let exportMenu = MenuSystem.MenuManager.createMenu("Cauldron.File.Export");
        fileMenu.addItem({
            label: "Export...",
            group: "FileDirect",
            groupOrder: -1,
            order: 100,
            icon: IconRegistry.createIcon("mdc:download"),
            onOpen: (menu)=>{
                return exportMenu.menuItems && exportMenu.menuItems.length>0;
            },
            submenu: exportMenu
        });        
        
        this.menu.addItem({            
            label: "File",
            order: 0,
            submenu: fileMenu,
            submenuOnHover: false
        });

        // Register the basic submenus etc. that are always there
        let settingsMenu = MenuSystem.MenuManager.createMenu("Cauldron.Settings", {
            groupDividers: true,
            growDirection: MenuSystem.Menu.GrowDirection.DOWN
        });
        this.menu.addItem({
            label: "Settings",
            order: 100,
            submenu: settingsMenu,
            submenuOnHover: false
        });

        let viewMenu = MenuSystem.MenuManager.createMenu("Cauldron.View", {
            groupDividers: true,
            growDirection: MenuSystem.Menu.GrowDirection.DOWN
        });
        this.menu.addItem({
            label: "View",
            order: 200,
            submenu: viewMenu,
            submenuOnHover: false
        });
        
        let helpMenu = MenuSystem.MenuManager.createMenu("Cauldron.Help", {
            growDirection: MenuSystem.Menu.GrowDirection.DOWN
        });
        this.menu.addItem({
            label: "Help",
            order: 999,
            submenu: helpMenu,
            submenuOnHover: false
        });

        
        this.menu.open();
        this.menu.html.classList.add("cauldron-mainmenu");
    }
    
    get html(){
        return this.menu.html;
    }
}