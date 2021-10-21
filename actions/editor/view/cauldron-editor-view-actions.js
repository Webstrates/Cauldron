/**
 *  View Actions
 *  Control the Cauldron docking mode
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
    MenuSystem.MenuManager.registerMenuItem("Cauldron.File", {
        label: "Close",
        group: "Cauldron",
        icon: IconRegistry.createIcon("mdc:close"),                        
        order: 9000,
        onAction: ()=>{
            EventSystem.triggerEvent("Cauldron.Minimize");
        }
    });

    MenuSystem.MenuManager.registerMenuItem("Cauldron.MainActions", {
        icon: IconRegistry.createIcon("mdc:close"),
        order: 9000,
        onAction: ()=>{
            EventSystem.triggerEvent("Cauldron.Minimize");
        }
    });

    MenuSystem.MenuManager.registerMenuItem("Cauldron.View.Dock",{
        label: "Left",
        icon: IconRegistry.createIcon("mdc:vertical_split"),
        order: 0,
        onAction: ()=>{
            EventSystem.triggerEvent("Cauldron.Dock", {
                pos: EdgeDocker.MODE.LEFT
            });
        }
    });
    MenuSystem.MenuManager.registerMenuItem("Cauldron.View.Dock",{
        label: "Right",
        icon: IconRegistry.createIcon("mdc:vertical_split"),
        order: 0,
        onAction: ()=>{
            EventSystem.triggerEvent("Cauldron.Dock", {
                pos: EdgeDocker.MODE.RIGHT
            });
        }
    });
    MenuSystem.MenuManager.registerMenuItem("Cauldron.View.Dock",{
        label: "Bottom",
        icon: IconRegistry.createIcon("mdc:horizontal_split"),
        order: 0,
        onAction: ()=>{
            EventSystem.triggerEvent("Cauldron.Dock", {
                pos: EdgeDocker.MODE.BOTTOM
            });
        }
    });
    MenuSystem.MenuManager.registerMenuItem("Cauldron.View.Dock",{
        label: "Float",
        icon: IconRegistry.createIcon("mdc:featured_video"),        
        order: 0,
        onAction: ()=>{
            EventSystem.triggerEvent("Cauldron.Dock", {
                pos: EdgeDocker.MODE.FLOAT
            });
        }
    });
    MenuSystem.MenuManager.registerMenuItem("Cauldron.View.Dock",{
        label: "Maximize",
        icon: IconRegistry.createIcon("mdc:aspect_ratio"),        
        order: 0,
        onAction: ()=>{
            EventSystem.triggerEvent("Cauldron.Dock", {
                pos: EdgeDocker.MODE.MAXIMIZED
            });
        }
    });

    let dockMenu = MenuSystem.MenuManager.createMenu("Cauldron.View.Dock");
    MenuSystem.MenuManager.registerMenuItem("Cauldron.View", {
        label: "Dock...",
        group: "Positioning",
        groupOrder:0,
        icon: IconRegistry.createIcon("mdc:view_quilt"),                        
        order: 0,
        submenu: dockMenu
    });

    MenuSystem.MenuManager.registerMenuItem("Cauldron.View", {
        label: "Reset layout",
        group: "LayoutCommands",
        groupOrder:10,
        
        
        icon: IconRegistry.createIcon("mdc:settings_backup_restore"),
        order: -1,
        onAction:()=>{
            EventSystem.triggerEvent("Cauldron.ResetLayout");
        }
    });
}