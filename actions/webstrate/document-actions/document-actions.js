/**
 *  Document Actions
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

MenuSystem.MenuManager.registerMenuItem("Cauldron.File", {
    label: "Title",
    group: "DocumentActions",
    groupOrder: 1,
    order: 0,
    icon: IconRegistry.createIcon("mdc:title"),
    onAction: (menuItem)=>{
        EventSystem.triggerEvent("Document.Edit.Title");
    }
});

EventSystem.registerEventCallback("Document.Edit.Title", ()=>{
    let content = WebstrateComponents.Tools.loadTemplate("#document-title-edit-dialog-tpl");

    content.querySelector("input.title").value = document.title;

    let dialog = new WebstrateComponents.ModalDialog(content);

    content.querySelector("button.save").addEventListener("pointerup", ()=>{
        dialog.close("save");
    });

    content.querySelector("button.cancel").addEventListener("pointerup", ()=>{
        dialog.close("cancel");
    });

    EventSystem.registerEventCallback("ModalDialog.Closed", ({detail: {dialog: closingDialog, action}})=>{
        if(closingDialog === dialog) {
            if(action === "save") {
                document.title = content.querySelector("input.title").value;
            }
        }
    });

    document.querySelector("html").appendChild(dialog.html);

    dialog.open();
});

