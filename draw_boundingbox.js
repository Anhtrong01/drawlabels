const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const folderInput = document.getElementById("folderInput");
const labelSelector = document.getElementById("labelSelector");
const saveBtn = document.getElementById("saveBtn");
const deleteBtn = document.getElementById("deleteBtn");
const nextBtn = document.getElementById("nextBtn");

let currentImage = null;
let images = [];
let currentImageIndex = 0;
let boundingBoxes = [];
let isDrawing = false;
let startX, startY, endX, endY;
let currentLabel = labelSelector.value;

// Load multiple images
folderInput.addEventListener("change", (e) => {
    images = Array.from(e.target.files).filter(file => file.type.startsWith("image/"));
    if (images.length > 0) {
        currentImageIndex = 0;
        loadImage(images[currentImageIndex]);
    }
});

// Update label when selecting a new one
labelSelector.addEventListener("change", (e) => {
    currentLabel = e.target.value;
});

// Load a single image
function loadImage(file) {
    const reader = new FileReader();
    reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            currentImage = img;
            boundingBoxes = []; // Reset bounding boxes for the new image
            redrawCanvas();
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
}

// Redraw the canvas with the current image and bounding boxes
function redrawCanvas() {
    if (currentImage) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(currentImage, 0, 0, canvas.width, canvas.height);
        redrawBoundingBoxes();
    }
}

// Redraw all bounding boxes
function redrawBoundingBoxes() {
    boundingBoxes.forEach((box) => {
        ctx.beginPath();
        ctx.strokeStyle = "red";
        ctx.lineWidth = 2;
        ctx.rect(box.x, box.y, box.width, box.height);
        ctx.stroke();
        ctx.font = "16px Arial";
        ctx.fillStyle = "red";
        ctx.fillText(box.label, box.x + 5, box.y + 20);
    });
}

// Handle mouse down event
canvas.addEventListener("mousedown", (e) => {
    isDrawing = true;
    const rect = canvas.getBoundingClientRect();
    startX = e.clientX - rect.left;
    startY = e.clientY - rect.top;
});

// Handle mouse move event
canvas.addEventListener("mousemove", (e) => {
    if (!isDrawing) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Redraw canvas and show the temporary bounding box
    redrawCanvas();
    ctx.beginPath();
    ctx.strokeStyle = "blue";
    ctx.lineWidth = 2;
    ctx.rect(startX, startY, mouseX - startX, mouseY - startY);
    ctx.stroke();
});

// Handle mouse up event
canvas.addEventListener("mouseup", (e) => {
    if (!isDrawing) return;
    isDrawing = false;

    const rect = canvas.getBoundingClientRect();
    endX = e.clientX - rect.left;
    endY = e.clientY - rect.top;

    const box = {
        label: currentLabel,
        x: Math.min(startX, endX),
        y: Math.min(startY, endY),
        width: Math.abs(endX - startX),
        height: Math.abs(endY - startY),
    };
    boundingBoxes.push(box);
    redrawCanvas();
});

// Save annotations to a YOLO format text file
saveBtn.addEventListener("click", () => {
    if (!currentImage) return;

    const imageName = images[currentImageIndex].name.replace(/\.[^/.]+$/, "");
    const annotation = boundingBoxes.map((box) => {
        const x_center = (box.x + box.width / 2) / canvas.width;
        const y_center = (box.y + box.height / 2) / canvas.height;
        const width = box.width / canvas.width;
        const height = box.height / canvas.height;
        const classId = ["Aortic_enlargement", "Lung_Opacity", "Pleural_effusion", "nofinding"].indexOf(box.label);
        return `${classId} ${x_center} ${y_center} ${width} ${height}`;
    }).join("\n");

    const blob = new Blob([annotation], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${imageName}.txt`;
    a.click();
});

// Delete the last bounding box
deleteBtn.addEventListener("click", () => {
    if (boundingBoxes.length > 0) {
        boundingBoxes.pop(); // Remove the last bounding box
        redrawCanvas(); // Redraw canvas without the deleted box
    }
});

// Move to the next image
nextBtn.addEventListener("click", () => {
    if (currentImageIndex < images.length - 1) {
        saveAnnotations(); // Automatically save annotations for the current image
        currentImageIndex++;
        loadImage(images[currentImageIndex]);
    } else {
        alert("You are already at the last image.");
    }
});

// Save annotations automatically before moving to the next image
function saveAnnotations() {
    if (!currentImage) return;

    const imageName = images[currentImageIndex].name.replace(/\.[^/.]+$/, "");
    const annotation = boundingBoxes.map((box) => {
        const x_center = (box.x + box.width / 2) / canvas.width;
        const y_center = (box.y + box.height / 2) / canvas.height;
        const width = box.width / canvas.width;
        const height = box.height / canvas.height;
        const classId = ["Aortic_enlargement", "Lung_Opacity", "Pleural_effusion", "nofinding"].indexOf(box.label);
        return `${classId} ${x_center} ${y_center} ${width} ${height}`;
    }).join("\n");

    const blob = new Blob([annotation], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${imageName}.txt`;
    a.click();
}