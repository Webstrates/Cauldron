// Add edit button to page that opens up the Cauldron editor
let button = document.createElement("button");
button.innerHTML="Edit"
button.style.position = "fixed";
button.style.top = "1em";
button.style.right = "1em";
button.id = "cauldron-edit-button";

let transientElement = document.createElement("transient");
transientElement.append(button);
document.body.appendChild(transientElement);

button.addEventListener("click", ()=>{
    cauldronEditor();
});

