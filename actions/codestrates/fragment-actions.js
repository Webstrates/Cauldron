/**
 *  Fragment Actions
 *  Menu entries related to fragments in codestrates
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

// Filter with elements that cannot have children
let nonChildElements = "code-fragment, script, style";

MenuSystem.MenuManager.registerMenuItem("Cauldron.Editor.Toolbar", {
    label: "Run",
    icon: IconRegistry.createIcon(["mdc:play_arrow"]),
    tooltip: "Execute the contents of this fragment",
    order: 200,
    class: "runAction",
    onAction: (menuItem)=>{
        EventSystem.triggerEvent("Codestrates.Fragment.Run", {
            fragment: menuItem.menu.context
        });
    },
    onOpen: (menu, menuItem)=>{
        return menu.context.supportsRun();
    }
});
EventSystem.registerEventCallback("Codestrates.Fragment.Run", async ({detail: {fragment: fragment}})=>{
    try {
        let result = await fragment.require();
        console.log("Require result: ", result);
    } catch(e) {
    }
});

MenuSystem.MenuManager.registerMenuItem("Cauldron.Editor.Toolbar", {
    label: "Auto",
    icon: IconRegistry.createIcon(["mdc:play_circle_outline"]),
    tooltip: "Run this fragment automatically",
    order: 100,
    class: "autoAction",
    onAction: (menuItem)=>{
        EventSystem.triggerEvent("Codestrates.Fragment.Auto", {
            fragment: menuItem.menu.context
        });

        menuItem.active = menuItem.menu.context.auto;
    },
    onOpen: (menu, menuItem)=>{
        if(menu.context.supportsAuto()) {
            menuItem.active = menu.context.auto;
            return true;
        }

        return false;
    }
});

// Single-element Autorun On/Off
MenuSystem.MenuManager.registerMenuItem("TreeBrowser.TreeNode.ContextMenu", {
    label: "Enable Autorun",
    icon: IconRegistry.createIcon("mdc:play_circle_outline"),
    tooltip: "Execute the contents of this fragment when the page loads",    
    group: "EditActions",
    groupOrder: 200,
    order: 200,
    onOpen: (menu)=>{
        if(menu.context.type == "DomTreeNode" && menu.context.context.matches("code-fragment")) {
            let fragment = Fragment.one(menu.context.context);

            return fragment.supportsAuto() && !fragment.auto;
        }
    },
    onAction: (menuItem)=>{
        EventSystem.triggerEvent("Codestrates.Fragment.AutoOn", {
            fragment: Fragment.one(menuItem.menu.context.context)
        });
    }
});
MenuSystem.MenuManager.registerMenuItem("TreeBrowser.TreeNode.ContextMenu", {
    label: "Disable Autorun",
    icon: IconRegistry.createIcon("mdc:play_circle_outline"),
    tooltip: "Stop executing the contents of this fragment when the page loads",        
    group: "EditActions",
    groupOrder: 200,
    order: 200,
    onOpen: (menu)=>{
        if(menu.context.type == "DomTreeNode" && menu.context.context.matches("code-fragment")) {
            let fragment = Fragment.one(menu.context.context);

            return fragment.supportsAuto() && fragment.auto;
        }
    },
    onAction: (menuItem)=>{
        EventSystem.triggerEvent("Codestrates.Fragment.AutoOff", {
            fragment: Fragment.one(menuItem.menu.context.context)
        });
    }
});

MenuSystem.MenuManager.registerMenuItem("TreeBrowser.TreeNode.ContextMenu", {
    label: "Enable Autorun Recursively",
    icon: IconRegistry.createIcon("mdc:play_circle_outline"),
    group: "FragmentActions",
    groupOrder: 9000,
    order: 205,
    onOpen: (menu)=>{
        if(menu.context.type == "DomTreeNode") {
            let childFragments = Fragment.find(menu.context.context.querySelectorAll("code-fragment"));

            let autoFragment = childFragments.find((fragment)=>{
                return fragment.supportsAuto() && !fragment.auto;
            });

            return autoFragment != null;
        }
    },
    onAction: (menuItem)=>{
        let fragments = menuItem.menu.context.context.querySelectorAll("code-fragment");
        fragments.forEach((fragmentHtml)=>{
            let fragment = Fragment.one(fragmentHtml);
            if(fragment.supportsAuto() && !fragment.auto) {
                EventSystem.triggerEvent("Codestrates.Fragment.AutoOn", {
                    fragment: fragment
                });
            }
        });
    }
});
MenuSystem.MenuManager.registerMenuItem("TreeBrowser.TreeNode.ContextMenu", {
    label: "Disable Autorun Recursively",
    icon: IconRegistry.createIcon("mdc:play_circle_outline"),
    group: "FragmentActions",
    groupOrder: 9000,
    order: 210,
    onOpen: (menu)=>{
        if(menu.context.type == "DomTreeNode") {
            let childFragments = Fragment.find(menu.context.context.querySelectorAll("code-fragment"));

            let autoFragment = childFragments.find((fragment)=>{
                return fragment.supportsAuto() && fragment.auto;
            });

            return autoFragment != null;
        }
    },
    onAction: (menuItem)=>{
        let fragments = menuItem.menu.context.context.querySelectorAll("code-fragment");
        fragments.forEach((fragmentHtml)=>{
            let fragment = Fragment.one(fragmentHtml);
            if(fragment.supportsAuto() && fragment.auto) {
                EventSystem.triggerEvent("Codestrates.Fragment.AutoOff", {
                    fragment: fragment
                });
            }
        });
    }
});
EventSystem.registerEventCallback("Codestrates.Fragment.Auto", ({detail: {fragment: fragment}})=>{
    fragment.auto = !fragment.auto;
});
EventSystem.registerEventCallback("Codestrates.Fragment.AutoOn", ({detail: {fragment: fragment}})=>{
    fragment.auto = true;
});
EventSystem.registerEventCallback("Codestrates.Fragment.AutoOff", ({detail: {fragment: fragment}})=>{
    fragment.auto = false;
});


EventSystem.registerEventCallback("TreeBrowser.Keyup", ({detail: {evt: evt, treeNode: treeNode}})=>{
    if(evt.key === "Delete") {
        if(treeNode.type === "DomTreeNode") {
            EventSystem.triggerEvent("Codestrates.DomNode.Delete", {
                treeNode: treeNode
            });
        }
    }
});

MenuSystem.MenuManager.registerMenuItem("TreeBrowser.TreeNode.ContextMenu", {
    label: "Delete",
    icon: IconRegistry.createIcon("mdc:delete"),                            
    group: "ViolentActions",
    groupOrder: 9000,
    order: 200,
    onOpen: (menu)=>{
        if(menu.context.type == "DomTreeNode") {
            return true;
        }
    },
    onAction: (menuItem)=>{
        EventSystem.triggerEvent("Codestrates.DomNode.Delete", {
            treeNode: menuItem.menu.context
        });
    }
});
MenuSystem.MenuManager.registerMenuItem("TreeBrowser.TreeNode.ContextMenu", {
    label: "Move Up",
    icon: IconRegistry.createIcon("mdc:north"),
    group: "EditActions",
    groupOrder: 9000,
    order: 1000,
    onOpen: (menu)=>{
        if(menu.context.type === "DomTreeNode"){
            let children = Array.from(menu.context.context.parentNode.children);
            return children.indexOf(menu.context.context)>0;
        }
    },
    onAction: (menuItem)=>{
        let children = Array.from(menuItem.menu.context.context.parentNode.children);
        let currentIndex = children.indexOf(menuItem.menu.context.context);
        menuItem.menu.context.context.parentNode.insertBefore(menuItem.menu.context.context, children[currentIndex-1]);
    }
});
MenuSystem.MenuManager.registerMenuItem("TreeBrowser.TreeNode.ContextMenu", {
    label: "Move Down",
    icon: IconRegistry.createIcon("mdc:south"),
    group: "EditActions",
    groupOrder: 9000,
    order: 1001,
    onOpen: (menu)=>{
        if(menu.context.type === "DomTreeNode"){
            let children = Array.from(menu.context.context.parentNode.children);
            return children.indexOf(menu.context.context)<children.length-1;
        }
    },
    onAction: (menuItem)=>{        
        let children = Array.from(menuItem.menu.context.context.parentNode.children);
        let currentIndex = children.indexOf(menuItem.menu.context.context);
        menuItem.menu.context.context.parentNode.insertBefore(menuItem.menu.context.context, currentIndex===children.length-2?null:children[currentIndex+2]);
    }
});

MenuSystem.MenuManager.registerMenuItem("TreeBrowser.TreeNode.ContextMenu", {
    label: "Duplicate",
    icon: IconRegistry.createIcon("mdc:content_copy"),
    group: "EditActions",
    groupOrder: 9000,
    order: 900,
    onOpen: (menu)=>menu.context.type === "DomTreeNode",
    onAction: (menuItem)=>{
        let clone = menuItem.menu.context.context.cloneNode(true);
        WPMv2.stripProtection(clone);
        menuItem.menu.context.context.parentNode.insertBefore(clone, menuItem.menu.context.context);
    }
});

EventSystem.registerEventCallback("Codestrates.DomNode.Delete", ({detail: {treeNode: treeNode}})=>{
    let decision = confirm("Really delete: "+treeNode.getProperty("content"));
    if(decision) {
        treeNode.context.parentNode.removeChild(treeNode.context);
    }
});

MenuSystem.MenuManager.registerMenuItem("TreeBrowser.TreeNode.ContextMenu", {
    label: "New WPM Package",
    icon: IconRegistry.createIcon("webstrates:wpm-package-open"),
    order: 20,
    group: "inserters",
    groupOrder: -1,
    onOpen: (menu)=>{
        if (!window.DescriptorFragment) return false;
        return menu.context.type == "DomTreeNode" && (!menu.context.context.matches("wpm-package")) && (!menu.context.context.matches(nonChildElements));
    },
    onAction: (menuItem)=>{
        EventSystem.triggerEvent("Codestrates.Fragment.CreateWPMPackage", {
            treeNode: menuItem.menu.context
        });
    }
});

EventSystem.registerEventCallback("Codestrates.Fragment.CreateWPMPackage", ({detail: {treeNode: treeNode}})=>{
    let wpmPackage = document.createElement("wpm-package");

    let wpmDescriptor = Fragment.create("wpm/descriptor");
    wpmPackage.appendChild(wpmDescriptor.element);

    WPMv2.stripProtection(wpmPackage);

    treeNode.context.appendChild(wpmPackage);
    setTimeout(()=>{
        let treeBrowser = treeNode.getTreeBrowser();
        let treeNodes = treeBrowser.findTreeNodeForContext(wpmPackage);
        if(treeNodes.length > 0) {
            let treeNode = treeNodes[0];
            treeNode.reveal();
            treeNode.select();
        }
    }, 0);
});

function insertNewElement(context, elementType){
    try {
        let element = document.createElement(elementType, {approved: true});
        context.context.appendChild(element);
        setTimeout(()=>{
            let treeBrowser = context.getTreeBrowser();
            let treeNodes = treeBrowser.findTreeNodeForContext(element);
            if(treeNodes.length > 0) {
                let treeNode = treeNodes[0];
                treeNode.reveal();
                treeNode.select();
            }
        }, 1);
        return element;
    } catch(e) {
        console.error(e);
    }    
}

let domMenu = MenuSystem.MenuManager.createMenu("Cauldron.TreeBrowser.DOMInsertMenu");
MenuSystem.MenuManager.registerMenuItem("Cauldron.TreeBrowser.DOMInsertMenu", {
    label: "Script",
    icon: IconRegistry.createIcon("mdc:code"),                                
    onAction: (menuItem)=>insertNewElement(menuItem.menu.superMenu.context, "script")
});
MenuSystem.MenuManager.registerMenuItem("Cauldron.TreeBrowser.DOMInsertMenu", {
    label: "Stylesheet",
    icon: IconRegistry.createIcon("mdc:brush"),                                
    onAction: (menuItem)=>insertNewElement(menuItem.menu.superMenu.context, "style")
});
MenuSystem.MenuManager.registerMenuItem("Cauldron.TreeBrowser.DOMInsertMenu", {
    label: "Div",
    icon: IconRegistry.createIcon("mdc:html"),                                
    onAction: (menuItem)=>insertNewElement(menuItem.menu.superMenu.context, "div")
});


MenuSystem.MenuManager.registerMenuItem("Cauldron.TreeBrowser.DOMInsertMenu", {
    label: "Other Element...",
    order: 999,
    icon: IconRegistry.createIcon("mdc:html"),                                
    group: "inserters",
    groupOrder: -1,
    onAction: (menuItem)=>{
        let elementType = prompt("Element Tag");
        if (elementType===null) return;
        insertNewElement(menuItem.menu.superMenu.context, elementType);
    }
});

MenuSystem.MenuManager.registerMenuItem("TreeBrowser.TreeNode.ContextMenu", {
    label: "New Folder...",
    order: 1,
    icon: IconRegistry.createIcon("mdc:create_new_folder"),                                
    group: "inserters",
    groupOrder: -1,
    onOpen: (menu)=>{
        return menu.context.type == "DomTreeNode" && !menu.context.context.matches(nonChildElements);
    },    
    onAction: (menuItem)=>{
        let elementName = prompt("Folder Name");
        if (elementName===null) return;
        let element = insertNewElement(menuItem.menu.context, "code-folder");
        element.setAttribute("name", elementName);
    }
});


MenuSystem.MenuManager.registerMenuItem("TreeBrowser.TreeNode.ContextMenu", {
    label: "New DOM Element...",
    order: 10,
    icon: IconRegistry.createIcon("mdc:html"),                                
    group: "inserters",
    groupOrder: -1,
    onOpen: (menu)=>{
        return menu.context.type == "DomTreeNode" && !menu.context.context.matches(nonChildElements);
    },
    submenu: domMenu
});

let fragmentMenu = MenuSystem.MenuManager.createMenu("FragmentInsertMenu");

MenuSystem.MenuManager.registerMenuItem("TreeBrowser.TreeNode.ContextMenu", {
    label: "New Fragment...",
    icon: IconRegistry.createIcon("mdc:note_add"),                            
    order: 5,
    group: "inserters",
    groupOrder: -1,
    onOpen: (menu)=>{
        if (Fragment.fragmentTypes.size === 0) return false;
        
        let canOpen = menu.context.type == "DomTreeNode" && !menu.context.context.matches(nonChildElements);
        
        // Check for new fragments not already registered in the menu
        if (!fragmentMenu.alreadyRegistered){
            fragmentMenu.alreadyRegistered = [];
        }
        Fragment.fragmentTypes.forEach((fragment, fragType)=>{    
            if (!fragmentMenu.alreadyRegistered.includes(fragType)){
                MenuSystem.MenuManager.registerMenuItem("FragmentInsertMenu", {
                    label: fragment.name.replace("Fragment",""),                    
                    icon: IconRegistry.createIcon(["code-fragment:"+fragType, "mdc:insert_drive_file"]),
                    onAction: (menuItem)=>{
                        let fragment = Fragment.create(fragType);
                        WPMv2.stripProtection(fragment.element);
                        menuItem.menu.superMenu.context.context.appendChild(fragment.element);
                        setTimeout(()=>{
                            //Find the newly added treenode and open the editor
                            let treeBrowser = menuItem.menu.superMenu.context.getTreeBrowser();
                            let treeNodes = treeBrowser.findTreeNodeForContext(fragment.element);
                            if(treeNodes.length > 0) {
                                let treeNode = treeNodes[0];
                                treeNode.reveal();
                                treeNode.select();
                                //Is this needed?
                                treeNode.triggerAction();
                            }
                        }, 0);
                    }
                });
                fragmentMenu.alreadyRegistered.push(fragType);
            }
        });
        
        return canOpen;
    },
    submenu: fragmentMenu
});


MenuSystem.MenuManager.registerMenuItem("TreeBrowser.TreeNode.ContextMenu", {
    label: "Open Preview",
    group: "EditActions",
    groupOrder: 0,
    icon: IconRegistry.createIcon("mdc:web"),                                
    onOpen: (menu)=>{
        if(menu.context.type == "DomTreeNode" && menu.context.context.matches("code-fragment")) {
            let fragment = cQuery(menu.context.context).data("Fragment");

            if(PreviewEditor.types().includes(fragment.type)) {
                return true;
            }
        }
        return false;
    },
    onAction: (menuItem)=>{
        let fragment = cQuery(menuItem.menu.context.context).data("Fragment");

        EventSystem.triggerEvent("Cauldron.Open.Preview", {
            fragment: fragment
        });
    }
});

MenuSystem.MenuManager.registerMenuItem("TreeBrowser.TreeNode.ContextMenu", {
    label: "Edit InnerHTML",
    icon: IconRegistry.createIcon("mdc:edit"),                                
    group: "EditActions",
    groupOrder: 200,
    order: 100,
    onOpen: (menu)=>{
        return menu.context.type === "DomTreeNode" && !menu.context.context.matches("code-fragment");
    },
    onAction: (menuItem)=>{
        let element = menuItem.menu.context.context;

        //Check for any code-fragment inside element
        if(element.querySelector("code-fragment") != null) {
            let decision = confirm("You are about to edit InnerHTML that contains or is itself a code-fragment, are you sure?");

            if(!decision) {
                return;
            }
        }

        EventSystem.triggerEvent("Cauldron.Open.InnerHTMLEditor", {
            element: menuItem.menu.context.context
        });
    }
});

MenuSystem.MenuManager.registerMenuItem("Cauldron.Editor.Toolbar", {
    label: "Save",
    icon: IconRegistry.createIcon(["mdc:save"]),
    onOpen: (menu)=>{
        return menu.context.isInnerHtmlEditor === true;
    },
    onAction: (menuItem)=>{
        menuItem.menu.context.save();
    }
});
