/**
 *  Cauldron Base
 *  The core IDE of Cauldron
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

/* global GoldenLayout */

/**
 * Triggered when a Cauldron is opened.
 * @event Cauldron.Cauldron#EventSystem:"Cauldron.OnOpen"
 * @type {CustomEvent}
 * @property {Cauldron.Cauldron} cauldron - The Cauldron that was opened
 */

/**
 * Triggered when a Cauldron is closed.
 * @event Cauldron.Cauldron#EventSystem:"Cauldron.OnClose"
 * @type {Event}
 * @property {Cauldron.Cauldron} cauldron - The Cauldron that was closed
 */

/**
 * Triggered when a Cauldron is initialized.
 * @event Cauldron.Cauldron#EventSystem:"Cauldron.OnInit"
 * @type {Event}
 * @property {Cauldron.Cauldron} cauldron - The Cauldron that was initialized
 */

/**
 * Tirgger to open a FragmentEditor
 * @event Cauldron.Cauldron#EventSystem:"Cauldron.Open.FragmentEditor"
 * @type {Event}
 * @property {Fragment} fragment - The fragment to open in a FragmentEditor
 */

/**
 * The Cauldron editor
 * @memberOf Cauldron
 * @alias Cauldron
 */
class CauldronBase {
    /**
     * Create a new Cauldron editor
     */
    constructor(config={}) {
        let defaultConfig = {
            edgeDockerMode: EdgeDocker.MODE.MINIMIZED,
            edgeDockerLoadMode: true,
            console: true,
            inspector: true,
            actionMenu: true,
            mainMenu: true,
            dragAndDrop: true,
            goldenLayoutSaveState: true
        };

        this.config = Object.assign({}, defaultConfig, config);

        this.setupGoldenLayoutPromise = null;

        //Setup EdgeDocker
        this.docker = new EdgeDocker({
            mode: this.config.edgeDockerMode
        });

        //Setup container divs
        this.editorContentArea = document.createElement("div");
        this.editorContentArea.classList.add("cauldron-base-content");
        this.docker.getComponentArea().appendChild(this.editorContentArea);

        //Setup main menu
        if(this.config.mainMenu) {
            this.topBar = document.createElement("div");
            this.topBar.classList.add("cauldron-base-top");
            this.mainMenu = new CauldronMainMenu();
            this.docker.setupDragHandle(this.mainMenu.html);
        }
        
        // Action menu
        if(this.config.actionMenu) {
            this.actionMenu = new CauldronActionMenu();
            this.topBar.appendChild(this.actionMenu.html);
            this.topBar.appendChild(this.mainMenu.html);
            this.editorContentArea.appendChild(this.topBar);
        }
        
        // Inspector
        if(this.config.inspector) {
            this.inspector = new Cauldron.CauldronInspector();
        }

        //Console
        if(this.config.console) {
            this.console = new Cauldron.CauldronConsole();
        }

        this.goldenLayoutArea = document.createElement("div");
        this.goldenLayoutArea.classList.add("cauldron-layout");
        this.editorContentArea.appendChild(this.goldenLayoutArea);

        this.goldenLayoutInitDone = false;

        //Added components
        this.registeredComponentNames = new Set();

        if(this.config.mainMenu) {
            this.setupMenuItems();
        }

        if(this.config.dragAndDrop) {
            this.setupDragAndDrop();
        }

        this.setupEvents();
    }

    /**
     * Opens Cauldron IDE
     */
    async open() {
        await this.setupGoldenLayout(this.goldenLayoutArea);

        if(this.config.edgeDockerLoadMode) {
            this.docker.loadMode(EdgeDocker.MODE.RIGHT);
        } else {
            this.docker.setMode(EdgeDocker.MODE.RIGHT, false);
        }

        EventSystem.triggerEvent("Cauldron.OnOpen", {
            cauldron: this
        });

        if(!this.goldenLayoutInitDone) {
            let initialisedPromise = new Promise((resolve, reject)=>{
                this.goldenLayout.on("initialised", ()=>{
                    resolve();
                })
            })
            this.goldenLayout.init();
            await initialisedPromise;
            this.goldenLayoutInitDone = true;
            EventSystem.triggerEvent("Cauldron.OnInit", {
                cauldron: this
            });
        }
    }

    /**
     * Closes Cauldron IDE
     */
    close() {
        this.docker.setMode(EdgeDocker.MODE.MINIMIZED);

        EventSystem.triggerEvent("Cauldron.OnClose", {
            cauldron: this
        });
    }

    /**
     * Check wether this Cauldron editor is open
     * @returns {boolean} true/false depending on if Cauldron is open or not
     */
    isOpen() {
        return this.docker.currentMode !== EdgeDocker.MODE.MINIMIZED;
    }

    /**
     * Sets the bounds of this Cauldron
     * @param {Number} x
     * @param {Number} y
     * @param {Number} width
     * @param {Number} height
     */
    setBounds(x, y, width, height) {
        this.docker.setBounds(x, y, width, height);
    }

    /**
     * @private
     */
    setupEvents() {
        let self = this;

        EventSystem.registerEventCallback("Cauldron.ResetLayout", ()=>{
            if(confirm("This will reset Cauldron layout, and reload the page, continue?")) {
                let key = "Cauldron-Saved-State-" + location.pathname.replace(/\//g, "");
                localStorage.setItem(key, null);
                location.reload();
            }
        });

        EventSystem.registerEventCallback("Cauldron.Minimize", ()=>{
            self.close();
        });

        EventSystem.registerEventCallback("Cauldron.Dock", ({detail:{pos: pos}})=>{
            self.docker.setMode(pos);
        });

        EventSystem.registerEventCallback("TreeBrowser.TreeNode.Action", ({detail:{node: node, treeBrowser: treeBrowser}})=>{
            if(node.type === "DomTreeNode" && node.context != null && node.context.matches("code-fragment")) {
                let fragment = cQuery(node.context).data("Fragment");

                EventSystem.triggerEvent("Cauldron.Open.FragmentEditor", {
                    fragment: fragment
                });

                return true; //Prevent default event
            }
        });

        EventSystem.registerEventCallback("Cauldron.Open.FragmentEditor", async ({detail: {fragment: fragment, line: line, column:column, editorClass: editorClass, titleWrapper: titleWrapper}})=>{

            if(editorClass == null) {
                editorClass = MonacoEditor;
            }

            if(titleWrapper == null) {
                titleWrapper = (t) => {
                    return t;
                }
            }

            //Make sure cauldron is open?
            if(!this.goldenLayoutInitDone) {
                await new Promise((resolve)=>{
                    EventSystem.registerEventCallback("Cauldron.OnInit", ()=>{
                        //Since goldenLayout has just opened, lets step back and wait a tick
                        setTimeout(()=>{
                            resolve();
                        }, 0);
                    });
                })
            }

            self.createComponent("FragmentEditor", {
                fragment: fragment,
                line: line,
                column: column,
                editorClass: editorClass,
                titleWrapper: titleWrapper
            }, false);
        });

        EventSystem.registerEventCallback("Cauldron.Open.Preview", ({detail: {fragment: fragment}})=>{
            self.createComponent("FragmentEditor", {
                fragment: fragment,
                editorClass: PreviewEditor
            });
        });

        EventSystem.registerEventCallback("Cauldron.Open.InnerHTMLEditor", ({detail: {element: element}}) => {
            self.createComponent("DomElementEditor", {
                element: element
            });
        });
    }

    /**
     * Selects a Golden Layout ContentItem, making it the active item in the Stack it lives inside.
     * @param item - The Golden Layout ContentItem to select
     * @private
     */
    selectItem(item) {
        //Check for stack parent
        if(item.parent != null && item.parent.type === "stack") {
            item.parent.setActiveContentItem(item);
        }
    }

    /**
     * @private
     */
    setupMenuItems() {
        let self = this;

        MenuSystem.MenuManager.registerMenuItem("Cauldron.View", {
            label: "Console",
            icon: IconRegistry.createIcon("mdc:laptop"),
            order: 100,
            onAction: ()=>{
                self.createComponent("Console", {}, false);
            }
        });

        MenuSystem.MenuManager.registerMenuItem("Cauldron.View", {
            label: "Inspector",
            icon: IconRegistry.createIcon("mdc:image_search"),
            order: 101,
            onAction: ()=>{
                self.createComponent("Inspector", {}, false);
            }
        });

        MenuSystem.MenuManager.registerMenuItem("Cauldron.File", {
            label: "Revisions...",
            group: "FileMeta",
            groupOrder: 0,
            icon: IconRegistry.createIcon("mdc:restore"),
            order: 0,
            onAction: ()=>{
                let revisionBrowser = new RevisionBrowser();

                let dialog = new WebstrateComponents.ModalDialog(revisionBrowser.html, {maximize: true});
                self.docker.getComponentArea().appendChild(dialog.html);
                dialog.open();

                EventSystem.registerEventCallback("RevisionBrowser.OnRestore", (evt)=>{
                    if(evt.detail === revisionBrowser) {
                        dialog.close();
                    }
                });

            }
        });

        MenuSystem.MenuManager.registerMenuItem("Cauldron.File", {
            label: "Permissions...",
            group: "FileMeta",
            groupOrder: 0,
            icon: IconRegistry.createIcon("mdc:lock_open"),
            order: 0,
            onAction: ()=>{
                let pmui = new WebstrateComponents.PermissionManagerUI();
                pmui.setTopLevelComponent(self.docker.getComponentArea());

                let dialog = new WebstrateComponents.ModalDialog(pmui.html);
                self.docker.getComponentArea().appendChild(dialog.html);
                dialog.open();

                EventSystem.registerEventCallback("PermissionManagerUI.Saved", (evt)=>{
                    if(evt.detail === pmui) {
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
            onAction: ()=>{
                let packageBrowser = new WPMPackageBrowser(false);

                let dialog = new WebstrateComponents.ModalDialog(packageBrowser.html, {maximize: true});
                self.docker.getComponentArea().appendChild(dialog.html);
                dialog.open();

                EventSystem.registerEventCallback("WPMPackageBrowser.OnClose", (evt)=>{
                    if(evt.detail === packageBrowser) {
                        dialog.close();
                    }
                });
            }
        });   
    }

    /**
     * Setup golden layout
     * @param {Element} container - The DOM element to use as a container for golden layout
     * @private
     */
    async setupGoldenLayout(container) {
        let self = this;

        if(this.setupGoldenLayoutPromise != null) {
            await this.setupGoldenLayoutPromise;
            return;
        }

        this.setupGoldenLayoutPromise = new Promise(async (resolve)=>{

            await loadGoldenLayout(self.goldenLayoutArea);

            let config = {
                settings: {
                    showPopoutIcon: false,
                    constrainDragToContainer: true
                },
                content: [
                    {
                        type: "row",
                        content: [
                            {
                                type: "column",
                                width: 25,
                                content: [
                                    {
                                        type: 'component',
                                        componentName: 'TreeBrowser',
                                        componentState: {},
                                        isClosable: false
                                    },
                                    {
                                        type: 'component',
                                        height: 25,
                                        componentName: 'Inspector',
                                        componentState: {},
                                        isClosable: true
                                    }
                                ]
                            },
                            {
                                type: "column",
                                width: 75,
                                content: [
                                    {
                                        type: "stack",
                                        id: "editors",
                                        isClosable: false,
                                        content: []
                                    },
                                    {
                                        type: "component",
                                        componentName: "Console",
                                        componentState: {},
                                        height: 25
                                    }
                                ]
                            }
                        ]
                    }
                ]
            };

            if(self.config.goldenLayoutConfig) {
                config = self.config.goldenLayoutConfig;
            }

            if(self.config.goldenLayoutSaveState) {
                let savedState = null;
                try {
                    let key = "Cauldron-Saved-State-" + location.pathname.replace(/\//g, "");

                    savedState = JSON.parse(localStorage.getItem(key), (key, value) => {
                        if (key === "content" && value instanceof Array) {
                            value = value.filter((arrayValue) => {
                                return arrayValue !== null;
                            });

                            //Fix any content with a missing content array?
                            value.forEach((child) => {
                                if (child.content == null) {
                                    child.content = [];
                                }

                                let activeItem = null;

                                if (child.activeItemIndex != null) {
                                    activeItem = child.content[child.activeItemIndex];
                                }

                                //Remove any components that did not deserialize correctly
                                value = value.filter((child) => {
                                    if (child.componentState != null && child.componentState.deserializeSuccess != null && child.componentState.deserializeSuccess !== true) {
                                        return false;
                                    }

                                    return true;
                                });

                                if (child.activeItemIndex != null) {
                                    child.activeItemIndex = Math.max(0, child.content.indexOf(activeItem));
                                }
                            });

                        }

                        if (key === "componentState" && value.serializer != null) {
                            //Use serializer if present
                            value.serializer.serialize = eval(value.serializer.serialize);
                            value.serializer.deserialize = eval(value.serializer.deserialize);
                            value.deserializeSuccess = value.serializer.deserialize(value);
                        }

                        return value;
                    });
                } catch (e) {
                    console.error("Error loading saved state:", e);
                }

                if (savedState != null) {
                    self.goldenLayout = new GoldenLayout(savedState, container);
                } else {
                    self.goldenLayout = new GoldenLayout(config, container);
                }

                let stateChangedTimeoutId = null;

                self.goldenLayout.on('stateChanged', function () {
                    if (stateChangedTimeoutId != null) {
                        clearTimeout(stateChangedTimeoutId);
                        stateChangedTimeoutId = null;
                    }

                    stateChangedTimeoutId = setTimeout(() => {
                        stateChangedTimeoutId = null;
                        let config = self.goldenLayout.toConfig();

                        let cache = [];

                        let key = "Cauldron-Saved-State-" + location.pathname.replace(/\//g, "");

                        localStorage.setItem(key, JSON.stringify(config, (key, value) => {
                            if (key === "componentState" && value.serializer != null) {
                                //Take copy, overriding serializer
                                let clone = Object.assign({}, value, {serializer: {}});
                                delete clone.deserializeSuccess;

                                //Use serializer if present
                                value.serializer.serialize(clone);

                                clone.serializer.serialize = value.serializer.serialize.toString();
                                clone.serializer.deserialize = value.serializer.deserialize.toString();

                                return clone;
                            }

                            return value;
                        }));
                    }, 250);
                });
            } else {
                self.goldenLayout = new GoldenLayout(config, container);
            }

            //Register TreeBrowser
            await self.registerComponent("TreeBrowser", (state)=>{
                let rootNode = new TreeNode({
                    context: null,
                    type: "",
                    hideSelf: true,
                    alwaysOpen: true
                });

                let bodyNode = new DomTreeGenerator().generateTree(document.querySelector("html > body"));
                bodyNode.unfold();
                rootNode.addNode(bodyNode);

                if (typeof webstrates !== "undefined"){
                    // If we are in a webstrate, also show its assets
                    let assetNode = new AssetTreeGenerator().generateTree();
                    assetNode.unfold();
                    rootNode.addNode(assetNode);
                }

                EventSystem.triggerEvent("Cauldron.TreeBrowserSpawned", {
                    root: rootNode
                });           

                let tree = new TreeBrowser(rootNode);

                let treeContainer = document.createElement("div");
                treeContainer.classList.add("cauldron-navigator");
                treeContainer.appendChild(tree.html);

                return treeContainer;
            });

            //Register FragmentEditor
            await self.registerComponent("FragmentEditor", (state)=>{

                const options = {
                };

                if(state.editorClass) {
                    options.editorClass = state.editorClass;
                }

                if(state.titleWrapper) {
                    options.titleWrapper = state.titleWrapper;
                }

                let editorComponent = new Cauldron.CauldronEditor(state.fragment, options);

                return {
                    dom: editorComponent.html,
                    serializer: {
                        serialize: (state)=>{
                            //Serialized needed state into string
                            if(state.fragment != null && typeof state.fragment !== "string") {
                                state.fragment = state.fragment.html[0].__wid;
                            }
                            if(state.editorClass != null && typeof state.editorClass !== "string") {
                                state.editorClass = state.editorClass.prototype.constructor.name;
                            }
                            if(state.titleWrapper != null && typeof state.titleWrapper === "function") {
                                state.titleWrapper = state.titleWrapper.toString();
                            }
                            if(state.line) {
                                delete state.line;
                            }
                        },
                        deserialize: (state)=>{
                            //Deserialize state, and return true/false if success
                            state.fragment = Fragment.find("code-fragment").find((frag)=>{
                                return frag.html[0].__wid === state.fragment;
                            });

                            if(state.editorClass != null) {
                                state.editorClass = window[state.editorClass];
                            }

                            if(state.titleWrapper != null) {
                                state.titleWrapper = eval(state.titleWrapper);
                            }

                            return state.fragment != null;
                        }
                    },
                    onResize: ()=>{
                        editorComponent.onSizeChanged();
                    },
                    onShow: ()=>{
                        //On show is called right before the container is actually shown?
                        setTimeout(()=>{
                            editorComponent.onSizeChanged();
                            editorComponent.focus();
                            if(state.line != null) {
                                if (state.column!=null){
                                    editorComponent.setLine(state.line, state.column);
                                } else {
                                    editorComponent.setLine(state.line);
                                }
                                //Only do this once
                                delete state.line;
                                delete state.column;
                            }
                        }, 0);
                    },
                    onTab: (tab)=>{
                        let lastTitle = null;
                        let lastTooltop = null;

                        function updateTab() {
                            if(lastTooltop !== editorComponent.tooltip || lastTitle !== editorComponent.title) {
                                tab.element[0].title = editorComponent.tooltip;
                                tab.titleElement[0].innerText = editorComponent.title;

                                tab.titleElement.find(".cauldron-editor-tab-icon").remove();
                                let icon = IconRegistry.createIcon(["code-fragment:" + state.fragment.type, "mdc:insert_drive_file"]);
                                icon.classList.add("cauldron-editor-tab-icon");
                                if (icon) {
                                    tab.titleElement.prepend(icon);
                                }
                                
                                // Setup context menu for tab
                                tab.element[0].addEventListener("contextmenu", (e)=>{
                                    e.preventDefault();
                                });
                                tab.element[0].addEventListener("mouseup", (e)=>{          
                                    if(e.button !== 2) {
                                       return;
                                    }
                                    let contextMenu = MenuSystem.MenuManager.createMenu("Cauldron.Tab.ContextMenu", {
                                        context: {tab:tab, editor:editorComponent},
                                        groupDividers: true
                                    });        
                                    contextMenu.registerOnCloseCallback(()=>{
                                        if(contextMenu.html.parentNode != null) {
                                            contextMenu.html.parentNode.removeChild(contextMenu.html);
                                        }
                                    });      

                                    //Find top component after html
                                    let parent = tab.element[0];
                                    while(parent.parentNode != null && !parent.parentNode.matches("html")) {
                                        parent = parent.parentNode;
                                    }
                                    parent.appendChild(contextMenu.html);
                                    contextMenu.open({
                                        x: e.pageX,
                                        y: e.pageY
                                    });
                                    e.stopPropagation();
                                    e.preventDefault();
                                });

                                lastTooltop = editorComponent.tooltip;
                                lastTitle = editorComponent.title;
                            }
                        }

                        state.fragment.registerOnFragmentChangedHandler(()=>{
                            updateTab();
                        });

                        updateTab();
                    },
                    onDestroy: ()=>{
                        editorComponent.destroy();
                    }
                };
            });

            //Register innerHTML editor
            await self.registerComponent("DomElementEditor", (state)=>{
                let element = state.element;

                let fragmentType = "text/html";
                let tabTitle = "Dom HTML";

                if(element.matches("style")) {
                    fragmentType = "text/css";
                    tabTitle = "Dom CSS";
                } else if(element.matches("script[type='text/javascript'], script:not([type])")) {
                    fragmentType = "text/javascript";
                    tabTitle = "Dom JS";
                }

                let fakeFragment = Fragment.create(fragmentType);
                fakeFragment.raw = element.innerHTML;

                fakeFragment.supportsAuto = ()=>{
                    return false;
                };

                fakeFragment.supportsRun = ()=>{
                    return false;
                };

                if(fragmentType === "text/css" || fragmentType === "text/javascript") {
                    //Setup direct editing of style / script

                } else {
                    fakeFragment.isInnerHtmlEditor = true;

                    //Indirect editing with save button for the rest
                    fakeFragment.save = ()=>{
                        let test = document.createElement(element.tagName.toLowerCase());
                        test.innerHTML = fakeFragment.raw;

                        if(test.innerHTML != fakeFragment.raw) {
                            if(!confirm("Your HTML does not parse correctly, the browser did some change, sure you want to save?")) {
                                return false;
                            }
                        }

                        element.innerHTML = fakeFragment.raw;

                        editorComponent.southArea.classList.remove("unsaved-changes");
                    };
                }

                let observer = null;

                let removed = false;

                const options = {
                    editorClass: MonacoEditor
                };

                if(state.editorClass) {
                    options.editorClass = state.editorClass;
                }

                if(state.titleWrapper) {
                    options.titleWrapper = state.titleWrapper;
                }

                let editorComponent = new Cauldron.CauldronEditor(fakeFragment, options);

                if(fragmentType === "text/css" || fragmentType === "text/javascript") {
                    //Read back changes into dom
                    fakeFragment.registerOnFragmentChangedHandler(()=>{
                        if(!removed && element.parentNode != null) {
                            observer.disconnect();
                            if (element.firstChild instanceof Text) {
                                element.firstChild.nodeValue = fakeFragment.raw;
                            } else {
                                element.textContent = fakeFragment.raw;
                            }
                            setTimeout(() => {
                                startObserver();
                            }, 0);
                        }
                    });
                } else {
                    //Setup direct editing of style / script
                    let oldHandleModelChanged = editorComponent.editor.handleModelChanged;

                    editorComponent.editor.handleModelChanged = function() {
                        oldHandleModelChanged.bind(editorComponent.editor)();

                        //Model changed, warn user
                        editorComponent.southArea.classList.add("unsaved-changes");
                    };

                    editorComponent.html.addEventListener("keyup", (evt)=>{
                        if(evt.key === "s" && evt.ctrlKey) {
                            fakeFragment.save();
                        }
                    });
                }

                observer = new MutationObserver((mutations)=>{
                    mutations.forEach((mutation)=>{
                        Array.from(mutation.removedNodes).forEach((removedNode)=>{
                            if(removedNode === element) {
                                fakeFragment.unload();
                                observer.disconnect();
                                removed = true;
                            }
                        });

                        if(!removed) {
                            if (fragmentType === "text/css" || fragmentType === "text/javascript") {
                                if (element.firstChild instanceof Text) {
                                    fakeFragment.raw = element.innerHTML;
                                } else {
                                    fakeFragment.raw = element.textContent;
                                }
                            }
                        }
                    });
                });

                function startObserver() {
                    observer.observe(element.parentNode, {
                        childList: true,
                        characterData: true,
                        subtree: true
                    });
                }

                startObserver();

                return {
                    dom: editorComponent.html,
                    serializer: {
                        serialize: (state)=>{
                            //Serialized needed state into string
                            if(state.element != null && typeof state.element !== "string") {
                                state.element = state.element.tagName+":"+state.element.__wid;
                            }
                        },
                        deserialize: (state)=>{
                            //Deserialize state, and return true/false if success
                            let split = state.element.split(":");
                            state.element = Array.from(document.querySelectorAll(split[0])).find((elm)=>{
                                return elm.__wid === split[1];
                            });

                            return state.element != null;
                        }
                    },
                    onTab: (tab)=>{
                        tab.titleElement[0].innerText = tabTitle+": "+element.tagName.toLowerCase();
                    },
                    onShow: ()=>{
                        //On show is called right before the container is actually shown?
                        setTimeout(()=>{
                            editorComponent.onSizeChanged();
                        }, 0);
                    },
                    onDestroy: (container)=>{
                        if(fragmentType === "text/css" || fragmentType === "text/javascript") {

                        } else {
                            if (editorComponent.southArea.classList.contains("unsaved-changes")) {
                                if (confirm("You have unsaved changes, save them now?")) {
                                    fakeFragment.save();
                                }
                            }
                        }
                    }
                };
            });

            //Register Inspector
            await self.registerComponent("Inspector", (state)=>{
                return self.inspector.html;
            });

            //Register Console
            await self.registerComponent("Console", (state)=>{
                return self.console.html;
            });

            window.addEventListener("resize", ()=>{
                let bounds = self.editorContentArea.getBoundingClientRect();

                let topBarHeight = 0;

                if(self.topBar != null) {
                    let topBarBounds = self.topBar.getBoundingClientRect();
                    topBarHeight = topBarBounds.height;
                }
                self.goldenLayout.updateSize(bounds.width, bounds.height - topBarHeight);
            });

            resolve();
        });

        await this.setupGoldenLayoutPromise;
    }

    hasComponent(componentName) {
        return this.registeredComponentNames.has(componentName);
    }

    /**
     * This callback is used to create components
     * @callback Cauldron.Cauldron~creatorCallback
     * @param {object} state - The state of the component
     * @returns {Cauldron.Cauldron~creatorCallbackResult|Element}
     */

    /**
     * This object is used to describe the serialize / deserialize of component state that cannot serialize correctly
     * using only JSON stringify/parse.
     * @typedef {object} Cauldron.Cauldron~serializer
     * @property {Function} serialize
     * @property {Function} deserialize
     */

    /**
     * Represents the result of a component creator function
     * @typedef {object} Cauldron.Cauldron~creatorCallbackResult
     * @property {Element} dom - The dom element of the component
     * @property {Cauldron.Cauldron~serializer} [serializer] - Serializer to use when state cannot serialize correctly using JSON stringify/parse
     * @property {Cauldron.Cauldron~componentResizedCallback} [onResize] - Callback that is called when component is resized
     * @property {Cauldron.Cauldron~tabCreatedCallback} [onTab] - Callback that is called when component has a tab created
     * @property {Cauldron.Cauldron~componentDestroyCallback} [onDestroy] - Callback that is called when component is destroyed
     * @property {Cauldron.Cauldron~componentShowCallback} [onShow] - Callback that is called when component is shown
    */

    /**
     * @callback Cauldron.Cauldron~componentShowCallback
     * @param {object} container - The Golden Layout container
     */

    /**
     * @callback Cauldron.Cauldron~componentResizedCallback
     * @param {object} container - The Golden Layout container
     */

    /**
     * @callback Cauldron.Cauldron~componentDestroyCallback
     * @param {object} container - The Golden Layout container
     */

    /**
     * @callback Cauldron.Cauldron~tabCreatedCallback
     * @param {object} tab - The tab that was created
     * @param {object} container - The Golden Layout container
     */

    /**
     * Register a component with Cauldron
     *
     * @example
     * registerComponent("MyComponent", (state)=>{
     *     let myComponentDom = document.createElement("div");
     *     myComponentDom.textContent = state.someState;
     *
     *     return myComponentDom;
     * });
     *
     * @example
     * registerComponent("MyComponent", (state)=>{
     *     let myComponentDom = document.createElement("div");
     *     myComponentDom.textContent = state.someState;
     *
     *     return {
     *         dom: myComponentDom,
     *         onResize: ()=>{
     *             //The component has been resized, do something
     *         },
     *         onTab: (tab)=>{
     *             //The component has created a tab, do something to it
     *         },
     *         onShow: ()=>{
     *             //Called when the component is made visible, ie. its tab is switched to
     *         },
     *         onDestroy: ()=>{
     *             //Called when the component is destroyed
     *         }
     *     };
     * });
     *
     * @example
     * registerComponent("MyComponent", (state)=>{
     *     let myComponentDom = document.createElement("div");
     *     myComponentDom.textContent = state.someState;
     *
     *     return {
     *         dom: myComponentDom,
     *
     *         //Setup serializer to handle state that cannot JSON stringify/parse correctly
     *         serializer: {
     *             serialize: (state)=>{
     *                 //Serialize all state that cannot JSON stringify/parse correctly
     *             },
     *             deserialize: (state)=>{
     *                 //Deserialize all state that cannot JSON stringify/parse correctly
     *             }
     *         }
     *     };
     * });
     *
     * @param {String} componentName - The name of the component
     * @param {Cauldron.Cauldron~creatorCallback} creator
     */
    async registerComponent(componentName, creator) {
        if(this.hasComponent(componentName)) {
            //Already registered
            return;
        }

        if(this.goldenLayout == null) {
            await this.setupGoldenLayout(this.goldenLayoutArea);
        }

        this.registeredComponentNames.add(componentName);

        await this.goldenLayout.registerComponent(componentName, function(container, state) {
            try {
                let componentConfig = creator(state, container);

                if(componentConfig.serializer != null) {
                    state.serializer = componentConfig.serializer;
                    container.setState(state);
                }

                if(componentConfig instanceof Element) {
                    container.getElement()[0].appendChild(componentConfig);
                    componentConfig.glContainer = container;
                } else {
                    container.getElement()[0].appendChild(componentConfig.dom);
                    componentConfig.dom.glContainer = container;

                    if(componentConfig.onResize != null) {
                        container.on("resize", () => {
                            componentConfig.onResize(container);
                        });
                    }

                    if(componentConfig.onShow != null) {
                        container.on("show", () => {
                            componentConfig.onShow(container);
                        });
                    }

                    if(componentConfig.onTab != null) {
                        container.on("tab", (tab) => {
                            componentConfig.onTab(tab, container);
                        });
                    }

                    if(componentConfig.onDestroy != null) {
                        container.on("destroy", () => {
                            componentConfig.onDestroy(container);
                        });
                    }
                }
            } catch(e) {
                console.error("Error creating component:", e);
                let errorDiv = document.createElement("div");
                errorDiv.innerHTML = "Something broke!";
                container.getElement()[0].appendChild(errorDiv);
                errorDiv.glContainer = container;
            }
        });
    }

    /**
     * Create a component with the given name and state
     *
     * @example
     * createComponent("MyComponent", {
     *     someState: "ImportantStateData"
     * });
     *
     * @param {String} componentName
     * @param {object} [state]
     * @param {boolean} [allowMultipleInstances=false] - Determines if multiple components with the same state are allowed, if set to true a new component will always be created. If false and a component with the same state already exists, then that component will be selected instead.
     */
    async createComponent(componentName, state = {}, allowMultipleInstances = false) {
        if(!allowMultipleInstances) {
            function compare(obj1, obj2) {
                //Check if these are equal
                if (Object.is(obj1, obj2)) {
                    return true;
                }

                //Check if both are same type
                if (typeof obj1 !== typeof obj2) {
                    return false;
                }

                //Since both were not equal, if one is null or undefined the other by definition is not
                if (obj1 == null || obj2 == null) {
                    return false;
                }

                //Handle object
                if (typeof obj1 === "object") {

                    //Only deep compare objects that are of constructor Object or Array
                    if(obj1.constructor.name !== obj2.constructor.name) {
                        return false;
                    }

                    if(obj1.constructor.name !== "Array" && obj1.constructor.name !== "Object") {
                        //We already tested that constructor names are equal, and only want Array or Object
                        return false;
                    }

                    for (let key in obj1) {
                        if(obj1.hasOwnProperty(key)) {
                            let obj1Value = obj1[key];
                            let obj2Value = obj2[key];

                            if (!compare(obj1Value, obj2Value)) {
                                return false;
                            }
                        }
                    }

                    for (let key in obj2) {
                        if(obj2.hasOwnProperty(key)) {
                            //Property existed in obj2 but not in obj1, everything else has already been tested
                            if (typeof obj1[key] === "undefined") {
                                return false;
                            }
                        }
                    }

                    return true;
                }

                if(typeof obj1 === "function") {
                    let equals = obj1.toString() === obj2.toString();

                    return equals;
                }

                //Nothing else failed, equal i guess?

                return true;
            }

            //Check for already present editor
            let foundComponents = this.goldenLayout.root.getItemsByFilter((item) => {
                if (item.componentName === componentName) {
                    let componentState = item.container.getState();

                    //Remove all our serializer stuff from state before comparing
                    let compareClone1 = Object.assign({}, componentState, {
                        componentName: null,
                        deserializeSuccess: null,
                        serializer: {},
                        line: null,
                        column: null
                    });
                    let compareClone2 = Object.assign({}, state, {
                        componentName: null,
                        deserializeSuccess: null,
                        serializer: {},
                        line: null,
                        column: null
                    });

                    let equal = compare(compareClone1, compareClone2);

                    return equal;
                }
            });

            if (foundComponents.length > 0) {
                //Attempt to update state
                foundComponents[0].config.componentState = Object.assign(foundComponents[0].config.componentState, state);

                //Select the already found component
                this.selectItem(foundComponents[0]);
                return;
            }
        }

        this.goldenLayout.root.getItemsById("editors")[0].addChild({
            type: "component",
            componentName: componentName,
            componentState: state
        });
    }

    /**
     * @private
     */
    setupDragAndDrop() {
        function addAssetToDescriptor(descFrag, assetFileName) {
            if(descFrag != null) {
                descFrag.require().then((descJson)=>{
                    if(!descJson.assets.includes(assetFileName)) {
                        descJson.assets.push(assetFileName);
                        descFrag.raw = JSON.stringify(descJson, null, 2);
                    }
                });
            }
        }

        EventSystem.registerEventCallback("TreeBrowser.TreeNode.Dropped", ({detail: { draggedNode: draggedNode, droppedNode: droppedNode, dropEffect: dropEffect, dragEvent: dragEvent}})=>{
            if(draggedNode.type === "DomTreeNode" && droppedNode.type === "DomTreeNode") {
                if(dragEvent.altKey && dropEffect === "move") {
                    //Move to before target
                    droppedNode.context.parentNode.insertBefore(draggedNode.context, droppedNode.context);
                } else if(!droppedNode.context.matches("code-fragment")) {
                    try {
                        if(dropEffect === "move") {
                            //Move inside target
                            droppedNode.context.appendChild(draggedNode.context);
                        } else if(dropEffect === "copy") {
                            let clone = draggedNode.context.cloneNode(true);
                            WPMv2.stripProtection(clone);
                            droppedNode.context.appendChild(clone);
                        }
                        droppedNode.unfold();
                    } catch(e) {
                        //Hide errors
                        console.error(e);
                    }
                }
            }

            if(draggedNode.type === "AssetNode" && droppedNode.type === "DomTreeNode") {
                let descFrag = cQuery(droppedNode.context.querySelector("code-fragment[data-type='wpm/descriptor']")).data("Fragment");

                addAssetToDescriptor(descFrag, draggedNode.context.fileName);
            }

            if(draggedNode.type === "AssetNode" && droppedNode.type === "AssetRootNode") {
                let parentNode = droppedNode.parentNode;
                if(parentNode != null && parentNode.type === "DomTreeNode" && parentNode.context.matches("wpm-package")) {

                    let descFrag = cQuery(parentNode.context.querySelector("code-fragment[data-type='wpm/descriptor']")).data("Fragment");

                    addAssetToDescriptor(descFrag, draggedNode.context.fileName);
                }
            }
        });

        EventSystem.registerEventCallback("TreeBrowser.DomFragment.Dropped", ({detail: { fragment: fragment, droppedNode: droppedNode, otherWebstrate: otherWebstrate}})=>{
            if(droppedNode.type === "DomTreeNode") {
                let firstChild = fragment.firstChild;
                let descriptors = fragment.querySelectorAll("code-fragment[data-type='wpm/descriptor']");
                droppedNode.context.appendChild(fragment);
                if(otherWebstrate != null && otherWebstrate !== location.href) {
                    //Let fragment stuff complete
                    setTimeout(() => {
                        descriptors.forEach((desc) => {
                            let frag = Fragment.one(desc);
                            frag.require().then((descJson) => {
                                descJson.assets.forEach((asset) => {
                                    fetch(otherWebstrate + asset).then((response) => {
                                        response.blob().then((blob) => {
                                            Uploader.upload(location.href, blob, asset).then(() => {
                                                frag.triggerFragmentChanged(frag);
                                            });
                                        });
                                    });
                                });
                            });
                        });
                    }, 0);
                }

                setTimeout(()=>{
                    //unfold the node we dropped into
                    TreeBrowser.findAllTreeBrowsers().forEach((tb)=>{
                        tb.findTreeNodeForContext(firstChild.parentNode).forEach((treeNode)=>{
                            treeNode.unfold();
                        });
                    });
                }, 0);
            }
        });

        EventSystem.registerEventCallback("TreeBrowser.Asset.Dropped", async ({detail: { assetUrl: assetUrl, droppedNode: droppedNode}})=>{
            let assetName = assetUrl.substring(assetUrl.lastIndexOf("/")+1);

            if(droppedNode.type === "AssetNode" || droppedNode.type === "AssetRootNode" || droppedNode) {
                let parentNode = droppedNode.parentNode;

                fetch(assetUrl).then((response)=>{
                    response.blob().then((blob)=>{
                        Uploader.upload(location.href, blob, assetName).then(()=>{
                            if(parentNode != null && parentNode.type === "DomTreeNode" && parentNode.context.matches("wpm-package")) {

                                let descFrag = cQuery(parentNode.context.querySelector("code-fragment[data-type='wpm/descriptor']")).data("Fragment");
                                addAssetToDescriptor(descFrag, assetName);
                            }
                        });
                    });
                });
            }

            if(droppedNode.type === "DomTreeNode" && droppedNode.context.matches("wpm-package")) {
                let descFrag = cQuery(droppedNode.context.querySelector("code-fragment[data-type='wpm/descriptor']")).data("Fragment");
                if(descFrag != null) {
                    fetch(assetUrl).then((response)=> {
                        response.blob().then((blob) => {
                            Uploader.upload(location.href, blob, assetName).then(() => {
                                addAssetToDescriptor(descFrag, assetName);
                            });
                        });
                    });
                }
            }
        });

        EventSystem.registerEventCallback("TreeBrowser.Files.Dropped", async ({detail: { files: files, droppedNode: droppedNode}})=>{
            if(droppedNode.type === "AssetNode" || droppedNode.type === "AssetRootNode") {
                let parentNode = droppedNode.parentNode;

                for(let file of Array.from(files)) {
                    await Uploader.upload(location.href, file, file.name);
                    if(parentNode != null && parentNode.type === "DomTreeNode" && parentNode.context.matches("wpm-package")) {

                        let descFrag = cQuery(parentNode.context.querySelector("code-fragment[data-type='wpm/descriptor']")).data("Fragment");

                        addAssetToDescriptor(descFrag, file.name);
                    }
                }
            }

            if(droppedNode.type === "DomTreeNode" && droppedNode.context.matches("wpm-package")) {
                let descFrag = cQuery(droppedNode.context.querySelector("code-fragment[data-type='wpm/descriptor']")).data("Fragment");
                if(descFrag != null) {
                    for(let file of Array.from(files)) {
                        await Uploader.upload(location.href, file, file.name);
                        addAssetToDescriptor(descFrag, file.name);
                    }
                }

            }
        });

        EventSystem.registerEventCallback("TreeBrowser.TreeNode.DragOver", ({detail: {node: node, dragEvent: evt}})=>{

            let defaultDropEffect = false;
            let handled = false;

            if(node.type === "DomTreeNode") {
                if(evt.dataTransfer.types.includes("Files")) {
                    if(node.context.matches("wpm-package")) {
                        let descFrag = cQuery(node.context.querySelector("code-fragment[data-type='wpm/descriptor']")).data("Fragment");
                        if(descFrag != null) {
                            evt.dataTransfer.dropEffect = "copy";
                            handled = true;
                        }
                    }
                } else if(evt.dataTransfer.types.includes("treenode/uuid")){
                    let dragUUID = null;

                    evt.dataTransfer.types.forEach((type)=>{
                        if(type.indexOf("treenodedata/uuid") !== -1) {
                            dragUUID = type.split("|")[1];
                        }
                    });


                    let dragged = document.querySelector("[transient-drag-id='" + dragUUID + "']");
                    if (dragged != null && dragged.treeNode != null) {
                        handled = true;
                        if(dragged.treeNode.type === "DomTreeNode" ) {
                            if(evt.altKey) {
                                //We are insertingBefore, not appending, only non allowed action is wpm-package inside wpm-package?
                                let draggedIsWpmPackage = dragged.treeNode.context.matches("wpm-package") || dragged.treeNode.context.querySelector("wpm-package") != null;
                                let droppedIsInsideWpmPackage = !node.context.matches("wpm-package") && node.context.closest("wpm-package") != null;

                                let droppedIsBody = node.context.matches("body");

                                if(!droppedIsBody && (!droppedIsInsideWpmPackage || !draggedIsWpmPackage)) {
                                    defaultDropEffect = true;
                                }
                            } else if(!node.context.matches("code-fragment, wpm-package") && node.context.closest("wpm-package") == null) {
                                //We are not dragging inside code-fragment or wpm-package
                                if (!dragged.treeNode.context.contains(node.context)) {
                                    defaultDropEffect = true;
                                }
                            } else if(node.context.matches("wpm-package")) {
                                //We are dragging into a wpm-package, make sure we dont ourselves include a wpm-package
                                if(!dragged.treeNode.context.matches("wpm-package") && dragged.treeNode.context.querySelector("wpm-package") == null) {
                                    defaultDropEffect = true;
                                }
                            }
                        } else if(dragged.treeNode.type === "AssetNode") {
                            if(node.context.matches("wpm-package")) {
                                let descFrag = cQuery(node.context.querySelector("code-fragment[data-type='wpm/descriptor']")).data("Fragment");
                                if(descFrag != null) {
                                    evt.dataTransfer.dropEffect = "copy";
                                }
                            }
                        }
                    }
                }

                if(!handled && evt.dataTransfer.types.includes("text/plain")) {
                    if(!node.context.matches("code-fragment")) {
                        defaultDropEffect = true;
                    }
                }
            } else if(node.type === "AssetRootNode") {
                if(evt.dataTransfer.types.includes("Files") || evt.dataTransfer.types.includes("treenode/asset")) {
                    evt.dataTransfer.dropEffect = "copy";
                }
            }

            if(defaultDropEffect) {
                if(evt.ctrlKey) {
                    evt.dataTransfer.dropEffect = "copy";
                } else {
                    evt.dataTransfer.dropEffect = "move";
                }
            }
        });
    }
}

window.Cauldron.Cauldron = CauldronBase;
