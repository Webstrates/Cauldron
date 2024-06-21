/**
 *  Collaboration
 *  A collaboration overlay for showing other connected users' focus in Cauldron
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

/* global webstrate */

class Collaboration {

    constructor(numColors) {
        let self = this;

        //Setup colors
        this.availableColors = new Set();

        //Select 16 different colors
        for(let i = 0; i<numColors; i++) {
            this.availableColors.add(Collaboration.selectColor(i, numColors));
        }

        //Setup transient to hold styles
        this.styleTransient = document.createElement("transient");
        this.styleTransient.id = "Collaboration-Styles";
        document.head.appendChild(this.styleTransient);

        //Client map that holds all our known remote clients
        this.clientMap = new Map();

        this.currentFocusFragment = null;
        this.currentSelection = null;

        //Listen for clients leaving
        webstrate.on("clientPart", (remoteClient)=>{
            self.onClientPart(remoteClient);
        });

        //Listen for clients joining
        webstrate.on("clientJoin", (remoteClient)=>{
            self.setupClient(remoteClient);
        });

        //Setup already connected clients
        webstrate.clients.forEach((client)=>{
            if(client === webstrate.clientId) {
                //Ignore self
                return;
            }

            self.setupClient(client);
        });

        this.setupObserver();

        this.setupEventHandlers();

        document.querySelectorAll("code-fragment").forEach((fragment)=>{
            self.handleFragmentFound(fragment);
        });

        webstrate.on("signal", (msg, sender)=>{
            self.handleSignal(msg, sender);
        });
    }

    handleSignal(msg, sender) {
        let self = this;

        //Ignore ourself
        if(sender === webstrate.clientId) {
            return;
        }

        if(msg.cmd != null) {
            switch (msg.cmd) {
                case "Collaboration.UserJoined": {
                    //Someone joined our webstrate, tell them who we are
                    self.sendUserInfoSignal(sender);

                    //Also tell them what we are currently focusing, and selecting
                    self.sendCurrentFocusAndSelection(sender);

                    break;
                }

                case "Collaboration.UserInfo": {
                    let client = self.getClient(sender);
                    client.info = msg.info;

                    break;
                }
            }
        }
    }

    getClient(clientId) {
        let client = this.clientMap.get(clientId);

        if(client == null) {
            client = {
                id: clientId
            };
            this.clientMap.set(clientId, client);
        }

        return client;
    }

    onClientPart(remoteClient) {
        let client = this.getClient(remoteClient);

        if(client.style != null) {
            client.style.remove();
            this.availableColors.add(client.color);
        }

        if(client.focusFragment != null) {
            EventSystem.triggerEvent("Collaboration.FragmentUnfocused", {
                client: client,
                fragment: client.focusFragment
            });
        }

        //Remove client info
        this.clientMap.delete(remoteClient);
    }

    setupEventHandlers() {
        let self = this;

        EventSystem.registerEventCallback("Collaboration.FragmentFocused", ({detail: {client: client, fragment: fragment}})=>{
            if(client.deleter != null) {
                client.deleter.delete();
            }

            let deleter = MenuSystem.MenuManager.registerMenuItem("TreeBrowser.TreeNode.MetaMenu", {
                icon: self.getClientIcon(client.id),
                onOpen: (menu, item)=>{
                    return menu.context === fragment.element;
                }
            });

            client.deleter = deleter;
        });

        EventSystem.registerEventCallback("Collaboration.FragmentUnfocused", ({detail: {client: client, fragment: fragment, userName: userName}})=>{
            if(client.deleter != null) {
                client.deleter.delete();
                client.deleter = null;
            }
        });

        EventSystem.registerEventCallback("Codestrates.Editor.Selection", ({detail: {editor: editor, selection: selection}})=>{
            if(self.currentFocusFragment !== editor.fragment) {
                self.setCurrentFocusedFragment(editor.fragment);
            }

            self.setCurrentSelection(selection);
        });

        EventSystem.registerEventCallback("Codestrates.Editor.Focus", ({detail: {editor: editor}})=>{
            if(self.currentFocusFragment !== editor.fragment) {
                self.setCurrentFocusedFragment(editor.fragment);
            }
        });

        EventSystem.registerEventCallback("Codestrates.Editor.Blur", ({detail: {editor: editor}})=>{
            if(self.currentFocusFragment === editor.fragment) {
                self.setCurrentFocusedFragment(null);
            }
        });

        EventSystem.registerEventCallback("Codestrates.Editor.Opened", ({detail: {editor: editor}})=>{
            self.clientMap.forEach((client)=>{
                if(client.focusFragment === editor.fragment) {
                    EventSystem.triggerEvent("Collaboration.FragmentSelection", {
                        client: client,
                        fragment: editor.fragment,
                        selection: client.selection
                    });
                }
            });
        });
    }

    setCurrentFocusedFragment(fragment) {
        if(this.currentFocusFragment != null) {
            //Send unfocus signal
            this.sendUnfocusedSignal(this.currentFocusFragment);
        }

        this.currentFocusFragment = fragment;

        //Send focus signal
        if(this.currentFocusFragment != null) {
            this.sendFocusedSignal(this.currentFocusFragment);
        }
    }

    setCurrentSelection(selection) {
        this.currentSelection = selection;
        this.sendSelectionSignal(this.currentFocusFragment);
    }

    getUserInfo() {
        return {
            userName: webstrate.user.displayName!=null?webstrate.user.displayName:webstrate.clientId,
            avatar:webstrate.user.avatarUrl!=null?webstrate.user.avatarUrl:null
        }
    }

    sendCurrentFocusAndSelection(receiver) {
        if(this.currentFocusFragment != null) {
            this.sendFocusedSignal(this.currentFocusFragment, receiver);
        }
        if(this.currentSelection != null) {
            this.sendSelectionSignal(this.currentFocusFragment, receiver);
        }
    }

    /**
     * Send our user info
     * @param receiver - The webstrate client to receive our user info, if null, everyone gets it
     */
    sendUserInfoSignal(receiver) {
        this.sendSignal({
            msg: {
                cmd: "Collaboration.UserInfo",
                info: this.getUserInfo()
            },
            receiver: receiver
        });
    }

    sendSelectionSignal(fragment, receiver) {
        this.sendSignal({
            msg: {
                cmd: "Collaboration.Fragment.Selection",
                selection: this.currentSelection
            },
            receiver: receiver,
            fragment: fragment
        });
    }

    sendSignal(options) {
        let channel = webstrate;

        if(options.fragment != null) {
            channel = options.fragment.element.webstrate;
        }

        if(channel != null) {
            if(options.receiver != null) {
                channel.signal(options.msg, [options.receiver]);
            } else {
                channel.signal(options.msg);
            }
        }
    }

    /**
     * Tell everyone that a fragment has been unfocused
     * @param fragment - The fragment that was unfocused
     */
    sendUnfocusedSignal(fragment, receiver) {
        this.sendSignal({
            msg: {
                cmd: "Collaboration.Fragment.Unfocused"
            },
            receiver: receiver,
            fragment: fragment
        });
    }

    /**
     * Tell everyone that a fragment has been focused
     * @param fragment - The fragment that was unfocused
     */
    sendFocusedSignal(fragment, receiver) {
        this.sendSignal({
            msg: {
                cmd: "Collaboration.Fragment.Focused"
            },
            receiver: receiver,
            fragment: fragment
        });
    }

    /**
     * Tell everyone that we joined the webstrate
     */
    sendJoinSignal() {
        this.sendSignal({
            msg: {
                cmd: "Collaboration.UserJoined"
            }
        });
    }

    setupClient(remoteClient) {
        let client = this.getClient(remoteClient);

        if(client.style == null) {
            client.style = document.createElement("style");
        }

        let colorArray = Array.from(this.availableColors.values());
        let random = Math.floor(Math.random() * colorArray.length);
        let color = colorArray[random];
        this.availableColors.delete(color);

        client.color = color;

        client.style.innerHTML = `
.otherCursor_${remoteClient}::before {
    background-color: hsl(${color}, 100%, 65%);
}

.otherSelection_${remoteClient} {
    background-color: hsla(${color}, 100%, 50%, 0.1);
}`

        this.styleTransient.appendChild(client.style);
    }

    getClientIcon(remoteClient) {
        let client = this.getClient(remoteClient);

        let icon = WebstrateComponents.Tools.loadTemplate("Collaboration_icon");
        cQuery(icon).one("#initials").appendChild(document.createTextNode(client.info.userName.substring(0, 2)));
        cQuery(icon).one("#name").appendChild(document.createTextNode(client.info.userName));
        if(client.info.avatar != null) {
            cQuery(icon).one("image").setAttribute("href", client.info.avatar);
        } else {
            cQuery(icon).one("image").remove();
        }
        icon.style.color = `hsl(${client.color}, 100%, 15%)`;
        icon.style.fill = `hsl(${client.color}, 100%, 75%)`;
        icon.classList.add("collaboration-client-icon");
        return icon;
    }

    handleFragmentFound(fragmentElement) {
        let self = this;

        let fragment = cQuery(fragmentElement).data("Fragment");

        //Check if fragment is transient
        if(webstrate.config.isTransientElement(fragmentElement)) {
            //No colaboration possible on transient elements
            return;
        }

        //Setup fragment listening of clients
        fragmentElement.webstrate.on("signal", (msg, sender)=>{
            if(sender === webstrate.clientId) {
                //Skip self
                return;
            }

            let client = self.getClient(sender);

            if(msg.cmd === "Collaboration.Fragment.Selection" || msg.cmd === "Collaboration.Fragment.Focused") {
                if(client.focusFragment !== fragment) {
                    client.focusFragment = fragment;
                    EventSystem.triggerEvent("Collaboration.FragmentFocused", {
                        client: client,
                        fragment: fragment
                    });
                }

                if(msg.selection != null) {
                    client.selection = msg.selection;
                    EventSystem.triggerEvent("Collaboration.FragmentSelection", {
                        client: client,
                        fragment: fragment,
                        selection: msg.selection
                    });
                }
            } else if(msg.cmd === "Collaboration.Fragment.Unfocused") {
                if(client.focusFragment === fragment) {
                    client.focusFragment = null;
                    EventSystem.triggerEvent("Collaboration.FragmentUnfocused", {
                        client: client,
                        fragment: fragment
                    });
                }
            }
        });
    }

    setupObserver() {
        let self = this;

        this.observer = new MutationObserver((mutations)=>{
            mutations.forEach((mutation)=>{
                Array.from(mutation.addedNodes).forEach((addedNode)=>{
                    if(addedNode.matches != null && addedNode.matches("code-fragment")) {
                        self.handleFragmentFound(addedNode);
                    }

                    if(addedNode.querySelectorAll != null) {
                        addedNode.querySelectorAll("code-fragment").forEach((fragment)=>{
                            self.handleFragmentFound(fragment);
                        });
                    }
                });
            });
        });

        this.observer.observe(document, {
            childList: true,
            subtree: true
        });
    }

    //Get a color from a HSL divided spectrum
    static selectColor(colorNum, colors){
        if (colors < 1) colors = 1; // defaults to one color - avoid divide by zero
        return (colorNum * (360 / colors) % 360);
    }
}

if (typeof webstrate !== "undefined"){
    // We only support collaboration with a webstrates server backend
    Cauldron.Collaboration = new Collaboration(16);

    //Signal everyon on the webstrate that we are here, and who we are
    Cauldron.Collaboration.sendJoinSignal();
    Cauldron.Collaboration.sendUserInfoSignal();
}
