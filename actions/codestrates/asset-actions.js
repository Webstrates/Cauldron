/**
 *  Asset Actions
 *  Menu entries related to assets in wpm packages
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

MenuSystem.MenuManager.registerMenuItem("TreeBrowser.TreeNode.ContextMenu", {
    label: "Download",
    group: "TransferActions",
    groupOrder: 0,
    icon: IconRegistry.createIcon("mdc:cloud_download"),                                
    onOpen: (menu)=>{
        return menu.context.type == "AssetNode" || menu.context.type == "AssetContainer";
    },
    onAction: (menuItem) =>{
        EventSystem.triggerEvent("Cauldron.Asset.Download", {
            asset: menuItem.menu.context.context
        });
    }
});

EventSystem.registerEventCallback("Cauldron.Asset.Download", ({detail: {asset: asset}})=>{
    let a = document.createElement("a");
    a.setAttribute("href", location.href+asset.fileName);
    a.setAttribute("download", asset.fileName);
    a.setAttribute("target", "_blank");
    a.click();
});

MenuSystem.MenuManager.registerMenuItem("TreeBrowser.TreeNode.ContextMenu", {
    label: "Delete",
    icon: IconRegistry.createIcon("mdc:delete"),                                
    group: "ViolentActions",
    groupOrder: 9000,
    onOpen: (menu)=>{
        return (menu.context.type == "AssetNode" || menu.context.type == "AssetContainer");
    },
    onAction: (menuItem)=>{
        if(
            menuItem.menu.context.parentNode != null &&
            menuItem.menu.context.parentNode.parentNode != null &&
            menuItem.menu.context.parentNode.parentNode.type === "DomTreeNode" &&
            menuItem.menu.context.parentNode.parentNode.context.matches("wpm-package")
        ) {
            //Asset inside wpm-package

            let descFrag = cQuery(menuItem.menu.context.parentNode.parentNode.context.querySelector("code-fragment[data-type='wpm/descriptor']")).data("Fragment");
            if(descFrag != null) {
                let decision = confirm("Really delete: "+menuItem.menu.context.getProperty("content"));
                if(decision) {
                    descFrag.require().then((descJson)=>{
                        descJson.assets.splice(descJson.assets.indexOf(menuItem.menu.context.context.fileName), 1);
                        descFrag.raw = JSON.stringify(descJson, null, 2);
                    });
                }
            }
        } else {
            //Asset node not inside a package
            EventSystem.triggerEvent("Codestrates.Asset.Delete", {
                asset: menuItem.menu.context.context,
                success: ()=>{
                    menuItem.menu.context.parentNode.removeNode(menuItem.menu.context);
                },
                fail: (err)=>{
                    console.error(err);
                }
            });
        }
    }
});

EventSystem.registerEventCallback("TreeBrowser.Keyup", ({detail: {evt: evt, treeNode: treeNode}})=>{
    if(evt.key === "Delete") {
        if(treeNode.type === "AssetNode" || treeNode.type === "AssetContainer") {
            EventSystem.triggerEvent("Codestrates.Asset.Delete", {
                asset: treeNode.context,
                success: (err)=>{
                    if(err == null) {
                        treeNode.parentNode.removeNode(treeNode);
                    } else {
                        console.error(err);
                    }
                }
            });
        }
    }
});

EventSystem.registerEventCallback("Codestrates.Asset.Delete", async ({detail: {asset: asset, success: successCallback, fail: failCallback}})=>{
    //Check if asset is used by any wpm-packages.
    let descFragUsingAsset = [];

    for(let wpmPackageElm of Array.from(document.querySelectorAll("wpm-package"))) {
        let descFrag = cQuery(wpmPackageElm).find("code-fragment[data-type='wpm/descriptor']").data("Fragment");

        if(descFrag != null) {
            let descJson = await descFrag.require();

            if(descJson.assets.includes(asset.fileName)) {
                descFragUsingAsset.push(descFrag);
            }
        }
    }

    let msg = "Really delete asset: "+asset.fileName;

    if(descFragUsingAsset.length > 0) {
        msg = "Really delete asset: "+asset.fileName+" (It is currently being used by "+descFragUsingAsset.length+" descriptor fragments, and will be removed from those as well";
    }

    let decision = confirm(msg);
    if(decision) {
        webstrate.deleteAsset(asset.fileName, (err) => {
            if(err == null) {
                for(let descFrag of descFragUsingAsset) {
                    descFrag.require().then((descJson)=>{
                        descJson.assets.splice(descJson.assets.indexOf(asset.fileName), 1);
                        descFrag.raw = JSON.stringify(descJson, null, 2);
                    });
                }
                successCallback();
            } else {
                failCallback(err);
            }
        });
    }
});