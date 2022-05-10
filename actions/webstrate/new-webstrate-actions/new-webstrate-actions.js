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
        icon: IconRegistry.createIcon("mdc:note_add"),
        submenu: newMenu
    });

    // New empty webstrate
    MenuSystem.MenuManager.registerMenuItem("Cauldron.File.NewWebstrate", {
        label: "Empty",
        icon: IconRegistry.createIcon("mdc:description"),        
        onAction: ()=>{
            EventSystem.triggerEvent("Cauldron.Webstrate.New", {
                type: "empty"
            });
        }
    });

    // Download as archive
    MenuSystem.MenuManager.registerMenuItem("Cauldron.File", {
        label: "Download",
        group: "FileDirect",
        icon: IconRegistry.createIcon("mdc:archive"),                
        onAction: ()=>{
            EventSystem.triggerEvent("Cauldron.Webstrate.Download");
        }
    });

    // New copy from this one
    MenuSystem.MenuManager.registerMenuItem("Cauldron.File.NewWebstrate", {        
        label: "Copy",
        icon: IconRegistry.createIcon("mdc:file_copy"),        
        onAction: ()=>{
            EventSystem.triggerEvent("Cauldron.Webstrate.New", {
                type: "copy"
            });
        }
    });

    // New from prototype url
    MenuSystem.MenuManager.registerMenuItem("Cauldron.File.NewWebstrate", {
        label: "From URL...",
        icon: IconRegistry.createIcon("mdc:link"),        
        onAction: ()=>{
            EventSystem.triggerEvent("Cauldron.Webstrate.New", {
                type: "url"
            });
        }
    });

    // New from prototype file
    MenuSystem.MenuManager.registerMenuItem("Cauldron.File.NewWebstrate", {
        label: "From File...",
        icon: IconRegistry.createIcon("mdc:unarchive"),        
        onAction: ()=>{
            EventSystem.triggerEvent("Cauldron.Webstrate.New", {
                type: "file"
            });
        }
    });

    EventSystem.registerEventCallback("Cauldron.Webstrate.Download", ()=>{
        let iframe = document.createElement("iframe");
        let transient = document.createElement("transient");
        transient.style.display = "none";

        transient.appendChild(iframe);

        iframe.webstrate.on("transcluded", async (webstrate)=>{
            console.log("Webstrate created:", webstrate);

            //Insert WPMv2
            await WPMv2.installWPMInto("/"+webstrate);

            transient.remove();
        });

        iframe.src = location.href + "?dl";

        document.body.appendChild(transient);
    });

    EventSystem.registerEventCallback("Cauldron.Webstrate.New", ({detail: {type: type}})=>{
        let iframe = document.createElement("iframe");
        let transient = document.createElement("transient");
        transient.style.display = "none";

        transient.appendChild(iframe);

        iframe.webstrate.on("transcluded", async (webstrate)=>{
            console.log("Webstrate created:", webstrate);

            //Insert WPMv2
            await WPMv2.installWPMInto("/"+webstrate);

            transient.remove();

            window.open("/"+webstrate);
        });

        switch(type) {
            case "empty":
                iframe.src = "/new";
                break;
            case "copy":
                iframe.src = location.href + "?copy";
                break;
            case "file": {
                let fileInput = document.createElement("input");
                fileInput.setAttribute("type", "file");
                fileInput.setAttribute("name", "file");
                fileInput.setAttribute("accept", ".zip");
                fileInput.click();

                fileInput.addEventListener("input", ()=>{
                    let formElement = document.createElement("form");
                    formElement.appendChild(fileInput);

                    let formData = new FormData(formElement);

                    fetch("/new", {
                        method: "POST",
                        body: formData
                    }).then((response)=>{
                        iframe.src = response.url;
                    });
                });
                break;
            }
            case "url": {
                let url = prompt("Prototype URL:");

                if(url.trim().length > 0) {
                    iframe.src = "/new?prototypeUrl="+url;
                }

                break;
            }
            default:
                console.log("Unknown type:", type);
        }

        document.body.appendChild(transient);
    });
}