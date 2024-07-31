/**
 *  Document Actions
 *  Menu entries related to the Webstrate Document
 * 
 *  Copyright 2020, 2021 Rolf Bagge, Janus B. Kristensen, CAVI,
 *  Copyright 2024 Janus B. Kristensen   
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

if (webstrate?.tags){
    // Show revisions if webstrate supports tagging
    MenuSystem.MenuManager.registerMenuItem("Cauldron.File", {
        label: "Revisions...",
        group: "FileMeta",
        groupOrder: 0,
        icon: IconRegistry.createIcon("mdc:restore"),
        order: 0,
        onAction: (menuItem)=>{
            let revisionBrowser = new RevisionBrowser();
            let dialog = new WebstrateComponents.ModalDialog(revisionBrowser.html, {maximize: true});
            menuItem.menu.context.cauldron.getPopupParent().appendChild(dialog.html);
            dialog.open();

            EventSystem.registerEventCallback("RevisionBrowser.OnRestore", (evt)=>{
                if(evt.detail === revisionBrowser) {
                    dialog.close();
                }
            });
        }
    });
}

if (webstrate?.permissions){
    MenuSystem.MenuManager.registerMenuItem("Cauldron.File", {
        label: "Permissions...",
        group: "FileMeta",
        groupOrder: 0,
        icon: IconRegistry.createIcon("mdc:admin_panel_settings"),
        order: 0,
        onAction: (menuItem)=>{
            let parent = menuItem.menu.context.cauldron.getPopupParent();
            let pmui = new WebstrateComponents.PermissionManagerUI();
            pmui.setTopLevelComponent(parent);
            let dialog = new WebstrateComponents.ModalDialog(pmui.html);
            parent.appendChild(dialog.html);
            dialog.open();

            EventSystem.registerEventCallback("PermissionManagerUI.Saved", (evt)=>{
                if(evt.detail === pmui) {
                    dialog.close();
                }
            });
        }
    });    
}

MenuSystem.MenuManager.registerMenuItem("Cauldron.File", {
    label: "Properties...",
    group: "FileMeta",
    groupOrder: 0,
    icon: IconRegistry.createIcon("mdc:build_circle"),
    order: 0,
    onAction: (menuItem)=>{
        let headEditor = new HeadEditorComponent(false);
        let dialog = new WebstrateComponents.ModalDialog(headEditor.html, {
            title: "File Properties",
            actions: {
                "Close":{primary:true}
            }
        });
        menuItem.menu.context.cauldron.getPopupParent().appendChild(dialog.html);
        dialog.open();

        EventSystem.registerEventCallback("HeadEditorComponent.OnClose", (evt)=>{
            if(evt.detail === headEditor) {
                dialog.close();
            }
        });
    }
});           

MenuSystem.MenuManager.registerMenuItem("Cauldron.File", {
    label: "Packages...",
    group: "FileMeta",
    groupOrder: 0,
    icon: IconRegistry.createIcon("mdc:extension"),
    order: 0,
    onAction: (menuItem)=>{
        let parent = menuItem.menu.context.cauldron.getPopupParent();
        let packageBrowser = new WPMPackageBrowser(false);
        packageBrowser.setTopLevelComponent(parent);
        let dialog = new WebstrateComponents.ModalDialog(packageBrowser.html, {flexContent: true});
        parent.appendChild(dialog.html);
        dialog.open();

        EventSystem.registerEventCallback("WPMPackageBrowser.OnClose", (evt)=>{
            if(evt.detail === packageBrowser) {
                dialog.close();
            }
        });
    }
});   


// Download as archive
if (webstrate?.exportToZip){
    MenuSystem.MenuManager.registerMenuItem("Cauldron.File.Export", {
        label: "As Zip-Archive...",
        tooltip: "Flat format including assets",
        icon: IconRegistry.createIcon("mdc:archive"),                
        onAction: ()=>{
            webstrate.exportToZip();
        }
    });    
} else if (typeof webstrate !== "undefined"){
    // Assume old-school HTTP API
    MenuSystem.MenuManager.registerMenuItem("Cauldron.File.Export", {
        label: "As Zip-Archive...",
        tooltip: "Flat format including assets",
        icon: IconRegistry.createIcon("mdc:archive"),                
        onAction: ()=>{
            window.location = location.href + "?dl";
        }
    });    
}
if (webstrate?.saveToZip){
    MenuSystem.MenuManager.registerMenuItem("Cauldron.File.Export", {
        label: "As Zip-Archive (Native)...",
        tooltip: "Binary format including history",
        icon: IconRegistry.createIcon("mdc:archive"),                
        onAction: ()=>{
            webstrate.saveToZip();
        }
    });        
}