/**
 *  CauldronEditor
 *  Binding for editing Codestrate Fragments
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
 * CauldronEditor is a component that can edit Codestrate Fragments
 * @memberof Cauldron
 */
class CauldronEditor {
    /**
     * Create a new CauldronEditor that edits the given Fragment
     * @param {Fragments.Fragment} fragment - The fragment to edit
     */
    constructor(fragment, options) {
        let self = this;

        /** @member {Fragments.Fragment} - The fragment this CauldronEditor edits */
        this.fragment = fragment;

        this.options = options;

        /** @member {Element} - The DOM element of this CauldronEditor */
        this.html = document.createElement("div");
        this.html.classList.add("cauldron-editor-component");

        /** @member {Editors.Editor} - The codestrates editor of this CauldronEditor */
        this.editor = EditorManager.createEditor(fragment, {
            editor: this.options.editorClass, 
            theme: Cauldron.CauldronSettings.getTheme(),
            mode: "component"
        })[0];

        this.toolbar = document.createElement("div");
        this.toolbar.classList.add("cauldron-editor-component-toolbar");
        this.southArea = document.createElement("div");
        this.southArea.classList.add("cauldron-editor-component-south");

        this.toolbarMenu = MenuSystem.MenuManager.createMenu("Cauldron.Editor.Toolbar", {
            context: self.fragment,
            keepOpen: true,
            layoutDirection: MenuSystem.Menu.LayoutDirection.HORIZONTAL,
            defaultFocus: false
        });

        this.toolbar.appendChild(this.toolbarMenu.html);

        this.html.appendChild(this.toolbar);

        if(this.editor != null) {
            this.html.appendChild(this.editor.html[0]);
        } else {
            //Show warning instead of editor
            let warningDiv = document.createElement("div");
            this.html.appendChild(warningDiv);
            warningDiv.textContent = "No suitable editors could be found for fragment type ["+this.fragment.type+"] - Maybe require more editors.";
        }

        this.html.appendChild(this.southArea);

        this.fragment.registerOnAutoChangedHandler(()=>{
            //Update menu when fragment changes
            self.toolbarMenu.update();
        });

        function unloadHandler() {
            try {
                self.html.glContainer.close();
                self.destroy();
            } catch(e) {
                //Silent ignore
            }
            self.fragment.unRegisterOnFragmentUnloadedHandler(unloadHandler);
        }

        this.fragment.registerOnFragmentUnloadedHandler(unloadHandler);

        this.html.addEventListener("keydown", (evt)=> {
            if(evt.key === "s" && evt.ctrlKey) {
                evt.preventDefault();
            }
        });

        this.clientIcons = new Map();

        this.clientIconArea = document.createElement("div");
        this.clientIconArea.classList.add("cauldron-editor-component-clientarea");
        this.toolbar.insertBefore(this.clientIconArea, self.toolbar.firstChild);

        this.eventDeleters = [];

        this.eventDeleters.push(EventSystem.registerEventCallback("Collaboration.FragmentFocused", ({detail: { client:client, fragment: fragment}})=>{
            if(fragment === self.fragment) {
                self.addClientIcon(client);
            }
        }));

        this.eventDeleters.push(EventSystem.registerEventCallback("Collaboration.FragmentSelection", ({detail: { client:client, fragment: fragment, selection: selection}})=>{
            if(fragment === self.fragment) {
                if(self.editor != null) {
                    self.editor.setForeignSelection(client.id, selection);
                }
                self.addClientIcon(client);
            }
        }));

        this.eventDeleters.push(EventSystem.registerEventCallback("Collaboration.FragmentUnfocused", ({detail: { client:client, fragment: fragment}})=>{
            if(fragment === self.fragment) {
                if(self.editor != null) {
                    self.editor.setForeignSelection(client.id, null);
                }
                self.removeClientIcon(client);
            }
        }));

        // Handle live theme updates
        this.eventDeleters.push(EventSystem.registerEventCallback("Cauldron.Theme", (event)=>{
            if(self.editor !== null && event.detail.theme !== null) {
                self.editor.setTheme(event.detail.theme);
            }
        }));


        if(this.editor != null) {
            this.setupDropZone();

            //Setup settings on editor opened, and settings updated
            EventSystem.registerEventCallback("Cauldron.Settings.Updated", ({detail: settings}) => {
                self.editor.setWordwrap(Cauldron.CauldronSettings.getWordwrap());
            });

            EventSystem.registerEventCallback("Codestrates.Editor.Opened", ({detail: {editor}})=>{
                editor.setWordwrap(Cauldron.CauldronSettings.getWordwrap());
            });
        }
    }

    addClientIcon(client) {
        if(!this.clientIcons.has(client.id)) {
            let icon = Cauldron.Collaboration.getClientIcon(client.id);
            this.clientIcons.set(client.id, icon);
            this.clientIconArea.appendChild(icon);
        }
    }

    removeClientIcon(client) {
        if(this.clientIcons.has(client.id)) {
            let icon = this.clientIcons.get(client.id);
            this.clientIcons.delete(client.id);
            icon.remove();
        }
    }

    onSizeChanged() {
        if(this.editor != null) {
            this.editor.onSizeChanged();
        }
    }
    
    get title() {
        let content = "";
        let name = this.fragment.html[0].getAttribute("name");
        if (name != null && name != ""){
            content = name+" ";
        } else if(this.fragment.html[0].id != null && this.fragment.html[0].id!="") {
            content += "#"+this.fragment.html[0].id;
        }
        if (!content){
            content = this.fragment.html[0].tagName.toLowerCase();
        }
        if(typeof this.options.titleWrapper === "function") {
            return this.options.titleWrapper(content);
        } else {
            return content;
        }
    }
    
    get tooltip(){
        let type = this.fragment.type;
        let id = this.fragment.html[0].getAttribute("id");

        let tooltip = "Fragment";

        if (id != null && id.trim() !== "") {
            tooltip += "#" + id;
        }

        tooltip += " [" + type + "]";
        return tooltip;
    }

    focus() {
        if(this.editor != null) {
            this.editor.focus();
        }
    }

    setLine(line, column=1) {
        if(this.editor != null) {
            this.editor.setLine(line, column);
        }
    }

    destroy() {
        if(this.editor != null) {
            this.editor.unload();
        }

        this.editor = null;

        this.eventDeleters.forEach((deleter)=>{
            deleter.delete();
        });
    }

    setupDropZone() {
        let self = this;

        new CaviDroppableHTML5(this.html, {
            onDragLeave: (evt)=>{
            },
            onDragOver: (evt)=>{
                evt.dataTransfer.dropEffect = "none";

                if(evt.dataTransfer.types.includes("treenode/uuid")) {
                    let dragUUID = null;

                    evt.dataTransfer.types.forEach((type)=>{
                        if(type.indexOf("treenodedata/uuid") !== -1) {
                            dragUUID = type.split("|")[1];
                        }
                    });

                    let dragged = document.querySelector("[transient-drag-id='" + dragUUID + "']");
                    if (dragged != null && dragged.treeNode != null) {
                        let allowedRequireFragments = ["text/javascript", "text/typescript", "text/ruby", "text/python", "application/x-lua"];

                        if (dragged.treeNode.context.matches != null && dragged.treeNode.context.matches("code-fragment") && dragged.treeNode.context.hasAttribute("id") && allowedRequireFragments.includes(self.fragment.type)) {
                            evt.dataTransfer.dropEffect = "copy";
                        } else if(dragged.treeNode.type === "AssetNode" && allowedRequireFragments.includes(self.fragment.type) && (dragged.treeNode.context.fileName.endsWith(".js") || dragged.treeNode.context.fileName.endsWith(".css") )) {
                            evt.dataTransfer.dropEffect = "copy";
                        } else if(dragged.treeNode.type === "AssetNode" && self.fragment.type === "wpm/descriptor") {
                            evt.dataTransfer.dropEffect = "copy";
                        }
                    }
                }
            },
            onDrop: (evt, dropEffect)=>{
                let otherWebstrate = null;

                if(evt.dataTransfer.types.includes("treenode/href")) {
                    otherWebstrate = evt.dataTransfer.getData("treenode/href");
                }

                if(evt.dataTransfer.types.includes("treenode/uuid")) {
                    try {
                        let dragUUID = evt.dataTransfer.getData("treenode/uuid");
                        let dragged = document.querySelector("[transient-drag-id='" + dragUUID + "']");
                        if (dragged != null && dragged.treeNode != null) {
                            //Found the dragged TreeNode

                            let requireData = null;

                            if(dragged.treeNode.type === "DomTreeNode") {
                                requireData = cQuery(dragged.treeNode.context).data("Fragment");
                            } else if(dragged.treeNode.type === "AssetNode") {
                                requireData = dragged.treeNode.context;

                                if(self.fragment.type === "wpm/descriptor") {
                                    //Special insert here
                                    self.fragment.require().then((descJson)=>{
                                        if(!descJson.assets.includes(requireData.fileName)) {
                                            descJson.assets.push(requireData.fileName);
                                            self.fragment.raw = JSON.stringify(descJson, null, 2);
                                        }
                                    });
                                    return;
                                }
                            }

                            let requireLine = self.createRequireFromType(self.fragment.type, requireData);
                            self.editor.insertAtSelection(requireLine);
                            return;
                        }
                    } catch(e) {
                        console.log("Error accepting drop as treenode/uuid", e);
                    }
                }

                console.log("No supported data transfers:", evt.dataTransfer.types.slice());

                evt.dataTransfer.types.forEach((type)=>{
                    console.log(type, evt.dataTransfer.getData(type));
                });
            }
        });
    }

    createRequireFromType(type, requireData) {
        let requireLine = null;

        if(requireData instanceof Fragment) {
            let fragmentId = requireData.html[0].getAttribute("id");
            switch(type) {
                case "text/javascript":
                case "text/typescript":
                    requireLine = "let "+fragmentId+" = await Fragment.one(\"#"+fragmentId+"\").require();\n";
                    break;

                case "text/ruby":
                    requireLine = "Native(`Fragment`.JS.one(\"#"+fragmentId+"\").JS.require()).then { |result|\n" +
                        "    result = Native(result);\n" +
                        "}";
                    break;
                case "text/python":
                    requireLine = fragmentId+" = await window.Fragment.one(\"#"+fragmentId+"\").require()\n";
                    break;
                case "application/x-lua":
                    requireLine = "local "+fragmentId+" = pwait(js.global.Fragment:one(\"#"+fragmentId+"\"):require())\n";
                    break;

                default:
                    console.log("Unknown type for require creation: ", type);
            }
        } else if(requireData.fileName != null) {
            //Assume asset if fileName exists
            switch(type) {
                case "text/javascript":
                case "text/typescript":
                    requireLine = "await wpm.requireExternal(\""+location.href+requireData.fileName+"\");\n";
                    break;
                case "text/python":
                    requireLine = "load(\""+location.href+requireData.fileName+"\");\n";
                    break;

                default:
                    console.log("Unknown type for require creation: ", type);
            }
        }

        return requireLine;
    }
}

window.Cauldron.CauldronEditor = CauldronEditor;