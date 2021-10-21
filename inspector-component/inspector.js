/**
 *  CauldronInspector
 *  Visual inspector of various elements that can be edited in Cauldron
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

class CauldronInspector {
    constructor(){
        let self = this;

        this.html = document.createElement("div");
        this.html.classList.add("cauldron-inspector");
        
        this.fields = document.createElement("div");
        this.fields.classList.add("cauldron-inspector-fields");
        this.html.appendChild(this.fields);
        this.currentSelection = null;

        this.currentInspectElements = [];

        EventSystem.registerEventCallback("TreeBrowser.Selection", ({detail: {selection: selection}})=>{
            self.inspect(selection);
        });
    }

    /**
     *
     * @param {TreeNode} selection
     */
    inspect(selection) {
        let self = this;
        this.currentSelection = selection;

        this.html.scrollTo(0, 0);

        let inspectorElements = null;
        for(let inspector of CauldronInspector.contentBindings) {
            inspectorElements = inspector.contentBinding.inspect(selection, this);

            if(inspectorElements != null) {
                //First inspector to return something wins.
                break;
            }
        }

        //Remove old elements
        this.currentInspectElements.forEach((inspectElement)=>{
            inspectElement.destroy();
        });

        this.currentInspectElements = [];

        if(inspectorElements != null) {
            inspectorElements.forEach((element)=>{
                self.fields.append(element.html);
                self.currentInspectElements.push(element);
            });
        }
    }
    
    reinspect(){
        this.inspect(this.currentSelection);
    }

    /**
     * Register a content binding for the CauldronInspector component
     * @param contentBinding
     * @param {Number} priority
     */
    static registerContentBinding(contentBinding, priority) {
        CauldronInspector.contentBindings.push({
            contentBinding: contentBinding,
            priority: priority
        });

        //Sort decorators according to priority
        CauldronInspector.contentBindings.sort((i1, i2)=>{
            return i2.priority - i1.priority;
        });
    }
};

CauldronInspector.contentBindings = [];

window.Cauldron.CauldronInspector = CauldronInspector;

class InspectorSegment {    
    constructor(name, parentList){
        this.html = document.createElement("div");
        this.html.classList.add("cauldron-inspector-section");
        let sectionHeader = document.createElement("div");
        sectionHeader.classList.add("cauldron-inspector-header");
        sectionHeader.innerText = name;
        this.html.appendChild(sectionHeader);
        this.parentList = parentList;
    }    
    
    push(element){
        this.parentList.push(element);
    }

    destroy() {
        this.html.remove();
    }
}
window.Cauldron.InspectorSegment = InspectorSegment;


class InspectorElement {
    constructor() {
        this._html = document.createElement("div");
        this._html.classList.add("cauldron-inspector-element");
    }
    
    setFailing(failing){
        if (failing){
            if (!this._html.classList.contains("failing-element")) this._html.classList.toggle("failing-element");
        } else {
            if (this._html.classList.contains("failing-element")) this._html.classList.toggle("failing-element");
        }
    }

    get html() {
        return this._html;
    }

    destroy() {
        this.html.remove();
    }
}
window.Cauldron.InspectorElement = InspectorElement;

class InspectorHTMLElement extends InspectorElement {
    constructor(html) {
        super();

        this.html.appendChild(html);
    }
}

window.Cauldron.InspectorHTMLElement = InspectorHTMLElement;
