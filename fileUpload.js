const empty = document.getElementById("empty");

// use to store pre selected files
let FILES = {};

// check if file is of type image and prepend the initialied
// template to the target element
function addFile(file) {
    var reader = new FileReader();

    reader.onload = function () {
        var arrayBuffer = this.result;
        console.log(arrayBuffer);
    }

    reader.readAsArrayBuffer(file.files[0]);
}

overlay = document.getElementById("overlay");

// click the hidden input of type file if the visible button is clicked
// and capture the selected files
const hidden = document.getElementById("hidden-input");
document.getElementById("button").onclick = () => hidden.click();



document.getElementById('hidden-input').addEventListener('change', function () {
    var reader = new FileReader();

    reader.onload = function () {
        var arrayBuffer = this.result;
        onSbpFileData(arrayBuffer);
    }

    reader.readAsArrayBuffer(this.files[0]);
});

// use to check if a file is being dragged
const hasFiles = ({ dataTransfer: { types = [] } }) =>
    types.indexOf("Files") > -1;

// use to drag dragenter and dragleave events.
// this is to know if the outermost parent is dragged over
// without issues due to drag events on its children
let counter = 0;

// reset counter and append file to gallery when file is dropped
function dropHandler(ev) {
    ev.preventDefault();
    var reader = new FileReader();

    reader.onload = function () {
        var arrayBuffer = this.result;
        onSbpFileData(arrayBuffer);
    }

    reader.readAsArrayBuffer(ev.dataTransfer.files[0]);
    overlay.classList.remove("draggedover");
    counter = 0;
}

// only react to actual files being dragged
function dragEnterHandler(e) {
    e.preventDefault();
    if (!hasFiles(e)) {
        return;
    }
    ++counter && overlay.classList.add("draggedover");
}

function dragLeaveHandler(e) {
    1 > --counter && overlay.classList.remove("draggedover");
}

function dragOverHandler(e) {
    if (hasFiles(e)) {
        e.preventDefault();
    }
}

// clear entire selection
function clear() {
    FILES = {};
    empty.classList.remove("hidden");

};