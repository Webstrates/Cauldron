/**
 *  Asset Inspector
 *  Visual inspector for webstrate assets
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

class InspectorAssetBinding {
    /**
     * Inspects the given TreeNode and if supported, returns a map of inspector elements
     * @param {TreeNode} treeNode
     * @returns {Cauldron.InspectorElement[]}
     */
    static inspect(treeNode) {
        if(treeNode.type === "AssetNode" || treeNode.type === "AssetContainer") {
            let elements = [];

            elements.push(new Cauldron.InspectorAssetPreviewElement(treeNode));
            elements.push(new Cauldron.InspectorAssetAttributeElement(treeNode, "fileName", "name"));
            elements.push(new Cauldron.InspectorAssetAttributeElement(treeNode, "v", "version"));
            elements.push(new Cauldron.InspectorAssetAttributeElement(treeNode, "fileSize", "size", true));
            elements.push(new Cauldron.InspectorAssetAttributeElement(treeNode, "mimeType", "type"));

            let downloadButton = ButtonSystem.ButtonFactory.createButton("Download", {
                onAction: ()=>{
                    EventSystem.triggerEvent("Cauldron.Asset.Download", {
                        asset: treeNode.context
                    });
                },
                style: "outlined",
                icon: IconRegistry.createIcon("mdc:get_app"),
            });

            elements.push(new Cauldron.InspectorHTMLElement(downloadButton.html));

            downloadButton.html.style.gridColumn = "1/3";

            return elements;
        }

        return null;
    }
}

window.Cauldron.InspectorAssetBinding = InspectorAssetBinding;

Cauldron.CauldronInspector.registerContentBinding(InspectorAssetBinding, 10);

class InspectorAssetAttributeElement extends Cauldron.InspectorElement {
    /**
     *
     * @param {TreeNode} treeNode
     * @param {String} attrName
     * @param {String} overrideLabel
     */
    constructor(treeNode, attrName, overrideLabel = null, formatSize = false) {
        super();

        let self = this;

        this.formatSize = formatSize;

        this.treeNode = treeNode;
        this.attrName = attrName;

        this.label = document.createElement("span");
        this.label.classList.add("cauldron-inspector-element-label");
        this.label.textContent = overrideLabel==null?this.attrName+":":overrideLabel;

        this.content = document.createElement("span");
        this.content.classList.add("cauldron-inspector-element-field");

        this.html.appendChild(this.label);
        this.html.appendChild(this.content);

        this.handleAssetUpdated = function() {
            self.assetUpdated();
        };

        this.treeNode.registerOnDecoratedCallback(this.handleAssetUpdated);

        this.assetUpdated();
    }

    destroy() {
        super.destroy();
        this.treeNode.deregisterOnDecoratedCallback(this.handleAssetUpdated);
    }

    assetUpdated() {
        let value = this.treeNode.context[this.attrName];

        if(this.formatSize) {
            let unit = "B";

            value = parseInt(value);

            if(value > 1024) {
                value /= 1024;
                unit = "KiB";

                if(value > 1024) {
                    value /= 1024;
                    unit = "MiB";

                    if(value > 1024) {
                        value /= 1024;
                        unit = "GiB";

                        if(value > 1024) {
                            value /= 1024;
                            unit = "TiB";
                        }
                    }
                }
            }



            value = value.toFixed(2) + " " + unit;
        }

        this.content.textContent = value;
    }
}

window.Cauldron.InspectorAssetAttributeElement = InspectorAssetAttributeElement;

class InspectorAssetPreviewElement extends Cauldron.InspectorElement {
    constructor(treeNode) {
        super();
        let self = this;

        this.treeNode = treeNode;

        this.handleAssetUpdated = function() {
            self.assetUpdated();
        };

        this.treeNode.registerOnDecoratedCallback(this.handleAssetUpdated);

        this.assetUpdated();
        this.html.classList.add("inspector-asset");
    }

    destroy() {
        super.destroy();
        this.treeNode.deregisterOnDecoratedCallback(this.handleAssetUpdated);
    }

    assetUpdated() {
        while(this.html.firstChild) this.html.firstChild.remove();

        let element = null;       
        switch(this.treeNode.context["mimeType"]){
            case "image/svg+xml":
            case "image/gif":
            case "image/jpeg":
            case "image/bmp":
            case "image/x-icon":
            case "image/png":
                element = document.createElement("img");
                element.src = location.href + this.treeNode.context["fileName"];
                break;
                
            case "video/x-matroska":
            case "video/quicktime":
            case "video/mp4":
            case "video/webm":
            case "video/opgg":
                element = document.createElement("video");
                element.src = location.href + this.treeNode.context["fileName"];
                element.setAttribute("controls", true);
                break;
                
            case "audio/mp3":
            case "audio/wav":
            case "audio/ogg":
            case "audio/mpeg":
                element = document.createElement("audio");
                element.src = location.href + this.treeNode.context["fileName"];
                element.setAttribute("controls", true);
                break;

            default:
                console.log("Unhandled mimeType:", this.treeNode.context["mimeType"]);
                return;
        }
        
        element.classList.add("cauldron-inspector-element-asset-preview");
        element.setAttribute("tabindex","0");
        this.html.appendChild(element);

    }
}

window.Cauldron.InspectorAssetPreviewElement = InspectorAssetPreviewElement;