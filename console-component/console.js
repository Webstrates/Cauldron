/**
 *  Cauldron Console
 *  A textual console for error logging
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

window.Cauldron.CauldronConsole = class CauldronConsole {
    constructor() {
        let self = this;

        this.html = document.createElement("div");
        this.html.classList.add("cauldron-console-content");

        this.consoleUl = document.createElement("ul");

        this.html.appendChild(this.consoleUl);

        this.contextMenu = MenuSystem.MenuManager.createMenu("Cauldron.Inspector.ContextMenu");

        //Make errors able to be JSON.stringifyied
        if (!('toJSON' in Error.prototype)) {
            Object.defineProperty(Error.prototype, 'toJSON', {
                value: function () {
                    let alt = {};

                    Object.getOwnPropertyNames(this).forEach(function (key) {
                        alt[key] = this[key];
                    }, this);

                    return alt;
                },
                configurable: true,
                writable: true
            });
        }

        MenuSystem.MenuManager.registerMenuItem("Cauldron.Inspector.ContextMenu", {
            label: "Clear console",
            onAction:()=>{
                self.consoleUl.innerHTML = "";
            }
        });

        MenuSystem.MenuManager.registerMenuItem("Cauldron.Inspector.ContextMenu", {
            label: "Filter",
            onAction:()=>{
                let filter = prompt("Enter filter string:");

                let entries = Array.from(self.consoleUl.querySelectorAll(".cauldron-console-entry"));

                entries.forEach((entry)=>{
                    entry.classList.add("cauldron-console-entry-filtered");
                });

                entries.filter((entry)=>{
                    if(filter == null || filter.trim() === "") {
                        return true;
                    } else {
                        return entry.textContent.toLowerCase().indexOf(filter.trim().toLowerCase()) !== -1;
                    }
                }).forEach((entry)=>{
                    entry.classList.remove("cauldron-console-entry-filtered");
                });
            }
        });

        this.html.addEventListener("contextmenu", (evt)=>{
            evt.preventDefault();
        });

        this.html.addEventListener("mouseup", (evt)=>{
            if(evt.button !== 2) {
                return;
            }

            try {
                //Find top component after html
                let parent = self.html;
                while(parent.parentNode != null && !parent.parentNode.matches("html")) {
                    parent = parent.parentNode;
                }
                parent.appendChild(self.contextMenu.html);

                self.contextMenu.open({
                    x: evt.pageX,
                    y: evt.pageY
                });
            } catch(e) {
                console.error(e);
            }
            evt.preventDefault();
        });

        EventSystem.registerEventCallback("Codestrates.Fragment.Error", ({detail: {messages: messages, fragment: fragment}})=>{
            self.handleMessages(messages, "error", fragment);
        });

        EventSystem.registerEventCallback("Codestrates.Fragment.Log", ({detail: {messages: messages, fragment: fragment}})=>{
            self.handleMessages(messages, "log", fragment);
        });

        EventSystem.registerEventCallback("Codestrates.Fragment.Warn", ({detail: {messages: messages, fragment: fragment}})=>{
            self.handleMessages(messages, "warn", fragment);
        });
    }

    handleMessages(messages, type, fragment) {
        let li = document.createElement("li");
        li.classList.add("cauldron-console-entry");
        
        let source = document.createElement("span");
        source.classList.add("cauldron-console-source");
        let sourceName = "";

        if (fragment){
            source.appendChild(IconRegistry.createIcon(["code-fragment:"+fragment.type, "mdc:insert_drive_file"]));
            if (fragment.html[0].getAttribute("name")) sourceName = fragment.html[0].getAttribute("name")+" ";
            if (fragment.html[0].id) sourceName += "#"+fragment.html[0].id;
            if (sourceName==="") sourceName = fragment.html[0].tagName.toLowerCase();

            new CaviTouch(source);

            source.addEventListener("caviTap", ()=>{
                TreeBrowser.findAllTreeBrowsers().forEach((tb)=>{
                    tb.findTreeNodeForContext(fragment.html[0]).forEach((tn)=>{
                        tn.reveal();
                        tn.select();
                    });
                });
            });

            source.addEventListener("caviDoubleTap", ()=>{
                TreeBrowser.findAllTreeBrowsers().forEach((tb)=>{
                    tb.findTreeNodeForContext(fragment.html[0]).forEach((tn)=>{
                        tn.triggerAction();
                    });
                });
            });
        }
        let sourceTitle = document.createElement("span");
        sourceTitle.textContent = sourceName;
        source.appendChild(sourceTitle);
        li.appendChild(source);

        switch(type) {
            case "log":
                li.classList.add("cauldron-console-entry-log");
                break;
            case "error":
                li.classList.add("cauldron-console-error");
                break;
            case "warn":
                li.classList.add("cauldron-console-warn");
                break;
        }

        messages.forEach((msg)=>{
            let item = document.createElement("span");
            if(typeof msg === "object") {
                function parseDom(dom) {
                    let tagName = dom.tagName.toLowerCase();

                    let attributes = "";

                    Array.from(dom.attributes).forEach((attr)=>{
                        if(attr.specified) {
                            attributes += " "+attr.name+"='"+attr.value+"'";
                        }
                    });

                    let result = "<"+tagName+attributes+"></"+tagName+">";

                    return result;
                }

                if (msg instanceof Element) {
                    item.textContent = parseDom(msg);
                    item.classList.add("cauldron-console-entry-dom");
                } else if (msg instanceof StackWalker.StackTrace){
                    item.textContent = msg.extraReason;
                    let trace = document.createElement("ul");
                    trace.classList.add("cauldron-console-entry-stacktrace");

                    let stack = msg.stack;
                    stack = StackWalker.compactify(msg.stack);

                    stack.forEach((stackLine)=>{
                        let li = document.createElement("li");
                        li.textContent = stackLine.method + (stackLine.lineNumber != null?":" + stackLine.lineNumber:"");
                        trace.appendChild(li);
                    });
                    item.appendChild(trace);
                    item.classList.add("cauldron-console-entry-object", "cauldron-console-entry-folded");
                    item.addEventListener("click", ()=>{
                        item.classList.toggle("cauldron-console-entry-folded");
                    });
                } else {
                    let cache = [];

                    function convertObject(obj) {
                        if (obj instanceof Error) {
                            obj = obj.toJSON();
                        }

                        if (obj instanceof Set) {
                            obj = {
                                "Set": Array.from(obj)
                            };
                        }

                        if (obj instanceof Map) {
                            let objMap = {};

                            obj.forEach((value, key) => {
                                objMap[key] = value;
                            });

                            obj = {
                                "Map": objMap
                            };
                        }

                        return obj;
                    }

                    item.textContent = JSON.stringify(msg, (key, value) => {
                        if (typeof value === "object" && value != null) {
                            if (value instanceof Element) {
                                return parseDom(value);
                            }

                            if(cache.includes(value)) {
                                return;
                            }

                            cache.push(value);

                            return convertObject(value);
                        }

                        return value;
                    }, 2);;
                    item.classList.add("cauldron-console-entry-object", "cauldron-console-entry-folded");
                    item.addEventListener("click", ()=>{
                        item.classList.toggle("cauldron-console-entry-folded");
                    });
                }
            } else {
                item.textContent = msg;
                item.classList.add("cauldron-console-entry-text");
            }

            li.appendChild(item);
        });

        this.consoleUl.appendChild(li);
        this.html.scrollTo(0, this.html.scrollHeight);
    }
};