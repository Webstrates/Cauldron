/**
 *  Webstrate Actions
 *  Ways of copying and manipulating a webstrate into a new one through the menu
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

if (typeof webstrate !== "undefined"){
    let newMenu = MenuSystem.MenuManager.createMenu("Cauldron.File.NewWebstrate");

    MenuSystem.MenuManager.registerMenuItem("Cauldron.File", {
        label: "New...",
        group: "FileDirect",
        groupOrder: -1,
        order: -1,
        onOpen: (menu)=>{
            return newMenu.menuItems && newMenu.menuItems.length>0;
        },
        icon: IconRegistry.createIcon("mdc:note_add"),
        submenu: newMenu
    });

    // New copy from this one
    if (webstrate.copy){
        MenuSystem.MenuManager.registerMenuItem("Cauldron.File.NewWebstrate", {        
            label: "Copy",
            tooltip: "A new copy of this webstrate without history",
            icon: IconRegistry.createIcon("mdc:file_copy"),        
            onAction: ()=>{
                webstrate.copy();
            }
        });
    }
    if (webstrate.clone){
        MenuSystem.MenuManager.registerMenuItem("Cauldron.File.NewWebstrate", {        
            label: "Clone With History",
            tooltip: "A new clone of this webstrate with history",
            icon: IconRegistry.createIcon("mdc:file_copy"),        
            onAction: ()=>{
                webstrate.clone();
            }
        });
    }



    // New from prototype url
    if (webstrate.newFromPrototypeURL){
        MenuSystem.MenuManager.registerMenuItem("Cauldron.File.NewWebstrate", {
            label: "From URL...",
            icon: IconRegistry.createIcon("mdc:link"),        
            onAction: ()=>{
                let url = prompt("Prototype URL:");
                if(url && url.trim().length > 0) {
                    webstrate.newFromPrototypeURL(url,"urlprototype-"+(Math.random().toString(16).substr(2,8)));
                }                
            }
        });
    }

    // New from prototype zip
    if (webstrate.newFromPrototypeFile || webstrate.importFromZip){
        MenuSystem.MenuManager.registerMenuItem("Cauldron.File.NewWebstrate", {
            label: "From Zip-Archive...",
            tooltip: "Import from archive with assets",
            icon: IconRegistry.createIcon("mdc:unarchive"),        
            onAction: async ()=>{
                if (webstrate.importFromZip){
                    webstrate.importFromZip();
                } else if (webstrate.newFromPrototypeFile){
                    let id = "fileprototype-"+(Math.random().toString(16).substr(2,8));
                    await webstrate.newFromPrototypeFile(id);
                    window.open("/"+id, '_blank').focus();
                }
            }
        });        
    }
    if (webstrate.loadFromZip){
        MenuSystem.MenuManager.registerMenuItem("Cauldron.File.NewWebstrate", {
            label: "From Native Binary Archive...",
            tooltip: "Load from archive with history",
            icon: IconRegistry.createIcon("mdc:unarchive"),        
            onAction: ()=>{
                webstrate.loadFromZip();
            }
        });        
    }
}