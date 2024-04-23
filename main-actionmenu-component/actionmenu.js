/**
 *  CauldronActionMenu
 *  A menu for prominent Cauldron actions like closing Cauldron
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
 * A menu for prominent Cauldron actions like closing Cauldron
 */
window.CauldronActionMenu = class MainActions {
    constructor(){        
        this.menu = MenuSystem.MenuManager.createMenu("Cauldron.MainActions", {
            keepOpen: true,
            layoutDirection: MenuSystem.Menu.LayoutDirection.HORIZONTAL            
        });
        
        this.menu.open();
        this.menu.html.classList.add("cauldron-actionmenu");
    }
    
    get html(){
        return this.menu.html;
    }
}