/**
 *  Inspector HTML Bindings
 *  Visual inspector of HTML and DOM elements
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
    
class InspectorHTMLBinding {
    /**
     * Inspects the given TreeNode and if supported, returns a map of editable attributes
     * @param {TreeNode} treeNode
     * @returns {Cauldron.InspectorElement[]}
     */
    static inspect(treeNode, inspector) {
        if(treeNode.type === "DomTreeNode") {
            let elements = [];

            InspectorHTMLBinding.focusEditor = new Cauldron.InspectorAttributeEditor(treeNode.context, "id");
            
            let primaryFold = new Cauldron.InspectorSegment("Attributes", elements);
            elements.push(primaryFold);
            primaryFold.push(InspectorHTMLBinding.focusEditor);
            let primaryAttributes = ["class", "name"];
            
            switch (treeNode.context.tagName){
                case "IMG":
                    primaryAttributes = [...primaryAttributes, "src", "alt", "width", "height"];
                    break;
                case "SCRIPT":
                    primaryAttributes = [...primaryAttributes, "src", "type"];
                    break;
                case "IFRAME":
                    primaryAttributes.push("src");
                    break;
                case "A":
                    primaryAttributes.push("href");
                    break;
                case "INPUT":
                    primaryAttributes = [...primaryAttributes, "type", "value"];
                    break;
                case "OPTION":
                    primaryAttributes.push("value");
                    break;
                case "LINK":
                    primaryAttributes = [...primaryAttributes, "type", "rel", "href"];
                    break;
                case "LABEL":
                    primaryAttributes.push("for");
                    break;
                case "BUTTON":
                    primaryAttributes.push("type");
                    break;
                case "FORM":
                    primaryAttributes = [...primaryAttributes, "action", "method"];
                    break;
            }                        
            for (let attribute of primaryAttributes){
                primaryFold.push(new Cauldron.InspectorAttributeEditor(treeNode.context, attribute));                
            }
            primaryAttributes.push("id"); // We already added this manually

            // Add other attributes present which are not primary ones
            let fold = new Cauldron.InspectorSegment("Additional Attributes", elements);
            elements.push(fold);
            for (let attributeEntry of treeNode.context.attributes){
                if (!primaryAttributes.includes(attributeEntry.name)){
                    fold.push(new Cauldron.InspectorAttributeEditor(treeNode.context, attributeEntry.name));                
                }
            }
            fold.push(new Cauldron.InspectorAttributeAdder(treeNode.context, inspector));
            
            return elements;
        }

        return null;
    }
}

window.Cauldron.InspectorHTMLBinding = InspectorHTMLBinding;

Cauldron.CauldronInspector.registerContentBinding(InspectorHTMLBinding, 10);

class InspectorAttributeAdder extends Cauldron.InspectorElement {
    constructor(domElement, inspector){
        super();
        let label = document.createElement("label");
        label.classList.add("cauldron-inspector-element-label");        
        let adderButton = document.createElement("button");
        adderButton.innerText = "Add Attribute";
        adderButton.classList.add("cauldron-inspector-element-editor");
        this.html.append(label);
        this.html.append(adderButton);
        
        adderButton.addEventListener("click", ()=>{
            let attributeName = prompt("Attribute Name:");
            if (attributeName !== null && attributeName!==""){
                domElement.setAttribute(attributeName,"");
                inspector.reinspect();
            }
        });
    }
}
window.Cauldron.InspectorAttributeAdder = InspectorAttributeAdder;


class InspectorAttributeEditor extends Cauldron.InspectorElement {
    /**
     *
     * @param {Element} domElement
     * @param {String} attrName
     * @param {String} overrideLabel
     */
    constructor(domElement, attrName, overrideLabel= null) {
        super();

        let self = this;

        this.domElement = domElement;
        this.attrName = attrName;

        this.editor = document.createElement("input");
        this.editor.classList.add("cauldron-inspector-element-field");
        this.editor.classList.add("cauldron-inspector-element-editor");
        this.editor.setAttribute("contenteditable", "true");
        this.editor.setAttribute("spellcheck", "false");

        this.label = document.createElement("span");
        this.label.classList.add("cauldron-inspector-element-label");
        this.label.textContent = overrideLabel==null?this.attrName:overrideLabel;

        this.html.append(this.label);
        this.html.appendChild(this.editor);
        this.html.classList.add("inspector-htmlnode");

        this.editor.value = this.domElement.getAttribute(this.attrName);

        this.observer = new MutationObserver((mutations)=>{
            //handleMutations(mutations);
        });

        function handleMutations(mutations) {
            console.log("Mutations:", mutations.slice());
            //Attribute changed, update editor
            if(mutations.length > 0) {
                self.editor.value = self.domElement.getAttribute(self.attrName);
            }
        }

        function startObserver() {
            self.observer.observe(self.domElement, {
                attributes: true,
                attributeFilter: [self.attrName]
            });
        }

        function pauseObserver() {
            let mutationRecords = self.observer.takeRecords();
            self.observer.disconnect();
            handleMutations(mutationRecords);
        }

        startObserver();

        this.html.addEventListener("keydown", (event)=>{
            if(event.code === "Enter") {
                event.preventDefault();
            }
        });

        this.html.addEventListener("input", (evt)=>{
            console.log("Input:", evt);
            pauseObserver();
            self.domElement.setAttribute(self.attrName, self.editor.value);
            setTimeout(()=>{
                startObserver();
            }, 0);
        });
    }

    destroy() {
        super.destroy();
        this.observer.disconnect();
    }
    
    focus(){
        this.editor.select();
    }
}

window.Cauldron.InspectorAttributeEditor = InspectorAttributeEditor;

EventSystem.registerEventCallback("TreeBrowser.Keyup", ({detail: {evt: evt, treeNode: treeNode}})=>{
    console.log(evt);
    if(evt.key === "F2" && InspectorHTMLBinding.focusEditor) {
        InspectorHTMLBinding.focusEditor.focus();
    }
});   
