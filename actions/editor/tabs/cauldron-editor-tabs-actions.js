/**
 *  Tab Actions
 *  Control the Cauldron tabs
 * 
 *  Copyright 2021 Rolf Bagge, Janus B. Kristensen, CAVI,
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
    MenuSystem.MenuManager.registerMenuItem("Cauldron.Tab.ContextMenu", {
        label: "Close",
        group: "Tab",
        icon: IconRegistry.createIcon("mdc:close"),                        
        order: 100,
        onAction: (e)=>{
            e.menu.context.tab.closeElement.click();
        }
    });
    
    MenuSystem.MenuManager.registerMenuItem("Cauldron.Tab.ContextMenu", {
        label: "Close Other",
        group: "Tab",
        icon: IconRegistry.createIcon("mdc:close"),                        
        order: 110,
        onOpen: (e)=>e.context.tab.header.tabs.length>1,
        onAction: (e)=>{
            let ourContent = e.menu.context.tab.contentItem;
            
            for (let tab of e.menu.context.tab.header.tabs.slice()){
                if (tab.contentItem != ourContent){
                    tab.closeElement.click();
                }
            };
            return true;            
        }
    });
    
    MenuSystem.MenuManager.registerMenuItem("Cauldron.Tab.ContextMenu", {
        label: "Close All",
        group: "Tab",
        icon: IconRegistry.createIcon("mdc:close"),                        
        order: 120,
        onOpen: (e)=>e.context.tab.header.tabs.length>1,
        onAction: (e)=>{
            for (let tab of e.menu.context.tab.header.tabs.slice()){
                tab.closeElement.click();
            };
            return true;            
        }
    });    
    
}