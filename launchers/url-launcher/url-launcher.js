/**
 *  URL Launcher
 *  Launched Cauldron when a specific URL pattern is detected
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

// Launch Cauldron when ?edit is added to the URL
const urlParams = new URLSearchParams(window.location.search);
const editorMode = urlParams.get('edit');

if(editorMode != null && editorMode !== false) {
    // Be nice to Codestrates if it is running
    if (window.Fragment){
        Fragment.disableAutorun = true;
    }
    
    EventSystem.registerEventCallback("Cauldron.OnInit", ({detail: {cauldron: cauldron}})=>{
        EventSystem.triggerEvent("Cauldron.Dock", {
            pos: EdgeDocker.MODE.MAXIMIZED
        });
    });
    
    cauldronEditor();
}


//Run when/if Cauldron is initialized
EventSystem.registerEventCallback("Cauldron.OnInit", ()=>{
    //Insert Cauldron view menu item
    MenuSystem.MenuManager.registerMenuItem("Cauldron.View.Dock", {
        label: "Popout editor",
        icon: IconRegistry.createIcon("mdc:open_in_new"),        
        order: 1000, //Order us very low priority, so near the end of the menu
        onAction: ()=>{
            window.open(location.href+"?edit");
        }
    });
});