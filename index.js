let canvas = document.getElementById("canvas");
let infobar = document.getElementById("infobar");
let mainInput = document.getElementById("main-input");
let infoRight = document.getElementById("info-right");
let infoLeft = document.getElementById("info-left-text");
let searchResults = document.getElementById("search-list");
let infoIconsParent = document.getElementById("info-icons");
let toolIcon = document.getElementById("tool-icon");
let colorSelect = document.getElementById("color-select");
let colorSelectView = document.getElementById("color-view");
let colorSelectSlider = document.getElementById("color-slider");
let colorSelectAlphaSlider = document.getElementById("alpha-slider");
let colorSelectPreview = document.getElementById("color-preview");
let colorSelectHexInput = document.getElementById("hex-input");
let colorSelectHInput = document.getElementById("color-h-input");
let colorSelectSInput = document.getElementById("color-s-input");
let colorSelectVInput = document.getElementById("color-v-input");
let colorSelectAInput = document.getElementById("color-a-input");
let colorSelectKnob = document.getElementById("color-knob");
let exportPanel = document.getElementById("export-panel");
let exportButton = document.getElementById("export-btn");
let exportFormatSelect = document.getElementById("export-format");
let exportCropAlpha = document.getElementById("export-crop");
let exportTile = document.getElementById("export-tile");
let exportFilename = document.getElementById("export-name");
var Tool;
(function (Tool) {
    Tool[Tool["free"] = 0] = "free";
    Tool[Tool["line"] = 1] = "line";
    Tool[Tool["paintpot"] = 2] = "paintpot";
    Tool[Tool["rect"] = 3] = "rect";
    Tool[Tool["filledRect"] = 4] = "filledRect";
})(Tool || (Tool = {}));
const toolIcons = [
    "icons/tool_free.png",
    "icons/tool_line.png",
    "icons/tool_paintpot.png",
    "icons/tool_rect.png",
    "icons/tool_filledrect.png",
];
const infobarSize = 27; // px
let settings = {
    pixelSize: 16,
    bgColorA: Color.FromHSV(0, 0, .10),
    bgColorB: Color.FromHSV(0, 0, .05),
    bgColorAlight: Color.FromHSV(0, 0, 1),
    bgColorBlight: Color.FromHSV(0, 0, .9),
    maxSearchResults: 10,
};
let ctx = canvas.getContext("2d");
let imageSizeX;
let imageSizeY;
let imageData; // From top-left
let canvasPixelSizeX; // In pixels
let canvasPixelSizeY;
let cornerPosX; // On screen
let cornerPosY;
let mouseX;
let mouseY;
let lastMouseX;
let lastMouseY;
let mouseLeft = false;
let mouseRight = false;
let mouseMiddle = false;
let mouseStartPosX; // In pixels
let mouseStartPosY;
let currentColor;
let currentAltColor = Color.FromRGB(0, 0, 0, 0);
let currentTool = Tool.free;
let usePicker = false;
let commandHistory = [];
let useGrid = false;
let gridSizeX = 16;
let gridSizeY = 16;
let mainColorUI;
let altColorUI;
let toolSize = 1;
let toolSizeChangeTime = -1;
const toolSizeDisplayDuration = 500; // ms
// Initial theme
let isDarkTheme = window.matchMedia("(prefers-color-scheme: dark)").matches;
document.body.setAttribute("theme", isDarkTheme ? "dark" : "light");
if (isDarkTheme)
    currentColor = Color.FromRGB(1, 1, 1);
else
    currentColor = Color.FromRGB(0, 0, 0);
canvas.addEventListener("contextmenu", event => event.preventDefault());
OnColorChanged();
InitUndo();
SetTool(Tool.free);
CreateImage(50, 50);
addEventListener("resize", OnResize);
addEventListener("mousemove", OnMouseMove);
addEventListener("mousedown", OnMouseDown);
addEventListener("mouseup", OnMouseUp);
canvas.addEventListener("mousedown", () => OnMouseDownCanvas());
canvas.addEventListener("mousemove", () => OnMouseMoveCanvas());
canvas.addEventListener("mouseup", () => OnMouseUpCanvas());
canvas.addEventListener("wheel", (ev) => OnWheel(ev));
// search.ts
addEventListener("keydown", OnKeyPressed);
mainInput.addEventListener("keydown", OnSearchKey);
mainInput.addEventListener("focus", OnSearchFocus);
mainInput.addEventListener("blur", OnSearchBlur);
mainInput.addEventListener("input", OnSearchChange);
// colorSelect.ts
colorSelectHInput.addEventListener("input", () => SetColor(color.SetH(parseFloat(colorSelectHInput.value))));
colorSelectSInput.addEventListener("input", () => SetColor(color.SetS(parseFloat(colorSelectSInput.value))));
colorSelectVInput.addEventListener("input", () => SetColor(color.SetV(parseFloat(colorSelectVInput.value))));
colorSelectAInput.addEventListener("input", () => {
    color.a = parseFloat(colorSelectAInput.value);
    SetColor(color);
});
colorSelectSlider.addEventListener("change", () => SetColor(color.SetV(parseFloat(colorSelectSlider.value))));
colorSelectSlider.addEventListener("mousemove", () => SetColor(color.SetV(parseFloat(colorSelectSlider.value))));
colorSelectAlphaSlider.addEventListener("change", () => {
    color.a = parseFloat(colorSelectAlphaSlider.value);
    SetColor(color);
});
colorSelectAlphaSlider.addEventListener("mousemove", () => {
    color.a = parseFloat(colorSelectAlphaSlider.value);
    SetColor(color);
});
colorSelectView.addEventListener("mousemove", (ev) => OnSelectViewClick(ev));
colorSelectView.addEventListener("mouseup", (ev) => OnSelectViewClick(ev));
colorSelectHexInput.addEventListener("input", (ev) => {
    let res = Color.FromHex(colorSelectHexInput.value);
    if (res != null) {
        SetColor(res);
    }
});
// Export.ts
exportButton.addEventListener("click", () => {
    ExportImage();
});
exportPanel.addEventListener("mousemove", () => {
    UpdateExportInputs();
});
OnResize();
function CreateImage(sizeX, sizeY, keepOldData = false, recordUndo = true) {
    let oldData;
    if (keepOldData)
        oldData = [...imageData];
    let oldSizeX = imageSizeX;
    let oldSizeY = imageSizeY;
    imageSizeX = sizeX;
    imageSizeY = sizeY;
    imageData = new Array(imageSizeX * imageSizeY);
    imageData.fill(Color.FromRGB(0, 0, 0, 0));
    if (keepOldData) {
        let startX = Math.round(Math.abs(oldSizeX - sizeX) / 2);
        let endX = startX + Math.min(oldSizeX, sizeX);
        let oldSmallerX = oldSizeX < sizeX;
        let startY = Math.round(Math.abs(oldSizeY - sizeY) / 2);
        let endY = startY + Math.min(oldSizeY, sizeY);
        let oldSmallerY = oldSizeY < sizeY;
        for (let x = startX; x < endX; x++) {
            for (let y = startY; y < endY; y++) {
                let oldX = oldSmallerX ? x - startX : x;
                let oldY = oldSmallerY ? y - startY : y;
                let newX = oldSmallerX ? x : x - startX;
                let newY = oldSmallerY ? y : y - startY;
                imageData[newX + newY * imageSizeX] = oldData[oldX + oldY * oldSizeX];
            }
        }
    }
    OnResize();
    if (recordUndo)
        RecordUndo();
}
function OnResize() {
    let width = window.innerWidth;
    let height = window.innerHeight - infobarSize;
    canvas.setAttribute("width", width.toString());
    canvas.setAttribute("height", height.toString());
    canvasPixelSizeX = Math.floor(width / settings.pixelSize);
    canvasPixelSizeY = Math.floor(height / settings.pixelSize);
    Draw();
}
function OnMouseMove(event) {
    [lastMouseX, lastMouseY] = [mouseX, mouseY];
    [mouseX, mouseY] = ScreenToPixel(event.pageX, event.pageY);
    infoRight.innerHTML = `${mouseX}, ${mouseY}`;
}
function OnMouseDown(event) {
    if (event.button == 0)
        mouseLeft = true;
    else if (event.button == 1)
        mouseMiddle = true;
    else if (event.button == 2)
        mouseRight = true;
    [mouseStartPosX, mouseStartPosY] = ScreenToPixel(event.pageX, event.pageY);
}
function OnMouseUp(event) {
    if (event.button == 0)
        mouseLeft = false;
    else if (event.button == 1)
        mouseMiddle = false;
    else if (event.button == 2)
        mouseRight = false;
}
function OnMouseMoveCanvas() {
    if (lastMouseX != mouseX || lastMouseY != mouseY)
        Draw();
    ApplyMouseTools(true);
}
function OnMouseDownCanvas() {
    CloseColorSelector();
    if (usePicker) {
        if (IsInImage(mouseX, mouseY))
            currentColor = imageData[mouseX + imageSizeX * mouseY];
        usePicker = false;
        Draw();
    }
    else {
        setTimeout(() => ApplyMouseTools(true), 0);
    }
}
function OnMouseUpCanvas() {
    ApplyMouseTools(false);
}
function OnWheel(event) {
    if (event.ctrlKey) // Handle zoom
     {
        const zoomSpeed = .2;
        if (event.deltaY < 0) {
            settings.pixelSize = Math.ceil(settings.pixelSize * (1 + zoomSpeed));
        }
        else {
            if (settings.pixelSize > 2)
                settings.pixelSize = Math.floor(settings.pixelSize * (1 - zoomSpeed));
        }
        OnResize();
        event.preventDefault(); // Prevent page zoom
    }
    else // Change tool size
     {
        if (event.deltaY > 0) {
            if (toolSize > 1)
                toolSize--;
        }
        else {
            toolSize++;
        }
        toolSizeChangeTime = Date.now();
        Draw();
        setTimeout(() => {
            if (Date.now() - toolSizeChangeTime > toolSizeDisplayDuration)
                Draw();
        }, toolSizeDisplayDuration + 10); // Draw again to make sure it's erased
    }
}
function ApplyMouseTools(preview) {
    if (!mouseLeft && !mouseRight)
        return;
    let color = mouseLeft ? currentColor : currentAltColor;
    if (preview)
        Draw();
    if (currentTool == Tool.free) {
        SetLine(lastMouseX, lastMouseY, mouseX, mouseY, color);
    }
    else if (currentTool == Tool.line) {
        SetLine(mouseStartPosX, mouseStartPosY, mouseX, mouseY, color, preview);
    }
    else if (currentTool == Tool.paintpot) {
        PaintPot(mouseX, mouseY, color, preview);
    }
    else if (currentTool == Tool.rect) {
        SetLine(mouseStartPosX, mouseStartPosY, mouseX, mouseStartPosY, color, preview);
        SetLine(mouseX, mouseStartPosY, mouseX, mouseY, color, preview);
        SetLine(mouseX, mouseY, mouseStartPosX, mouseY, color, preview);
        SetLine(mouseStartPosX, mouseY, mouseStartPosX, mouseStartPosY, color, preview);
    }
    else if (currentTool == Tool.filledRect) {
        let [minX, minY, maxX, maxY] = GetToolRectWithSize(mouseX, mouseY);
        let [minStartX, minStartY, maxStartX, maxStartY] = GetToolRectWithSize(mouseStartPosX, mouseStartPosY);
        let startX = Math.min(minStartX, minX);
        let startY = Math.min(minStartY, minY);
        let sizeX = Math.max(maxStartX, maxX) - startX;
        let sizeY = Math.max(maxStartY, maxY) - startY;
        SetRect(startX, startY, sizeX, sizeY, color, preview);
    }
    if (!preview) {
        RecordUndo();
        Draw();
    }
}
function SetTool(tool) {
    currentTool = tool;
    toolIcon.style.setProperty("background-image", `url(${toolIcons[tool]})`);
}
function OnColorChanged() {
    mainColorUI?.remove();
    altColorUI?.remove();
    mainColorUI = currentColor.GetColorUI();
    altColorUI = currentAltColor.GetColorUI();
    infoIconsParent.appendChild(altColorUI);
    infoIconsParent.appendChild(mainColorUI);
}
function SetToolSizeRect(x, y, color, temp = false) {
    let [minX, minY, maxX, maxY] = GetToolRectWithSize(x, y);
    SetRect(minX, minY, maxX - minX, maxY - minY, color, temp);
}
function SetPixel(x, y, color, temp = false) {
    if (!IsInImage(x, y))
        return;
    if (temp) {
        DrawPixel(x, y, color);
    }
    else {
        imageData[x + y * imageSizeX] = color.Copy();
    }
}
function SetLine(startX, startY, endX, endY, color, temp = false) {
    if (startX == endX && startY == endY) {
        SetToolSizeRect(startX, startY, color, temp);
        return;
    }
    let ax = (endY - startY) / (endX - startX);
    let ay = (endX - startX) / (endY - startY);
    if (Math.abs(ay) < Math.abs(ax)) {
        if (startY > endY) {
            [startX, endX] = [endX, startX];
            [startY, endY] = [endY, startY];
        }
        for (let y = startY; y <= endY; y++) {
            let x = startX + ay * (y - startY);
            SetToolSizeRect(Math.round(x), y, color, temp);
        }
    }
    else {
        if (startX > endX) {
            [startX, endX] = [endX, startX];
            [startY, endY] = [endY, startY];
        }
        for (let x = startX; x <= endX; x++) {
            let y = startY + ax * (x - startX);
            SetToolSizeRect(x, Math.round(y), color, temp);
        }
    }
}
function PaintPot(startX, startY, color, temp = false) {
    let active = [[startX, startY]];
    let done = new Array(imageSizeX * imageSizeY).fill(false);
    let startColor = imageData[startX + imageSizeX * startY];
    while (active.length > 0) {
        let x = active[0][0];
        let y = active[0][1];
        SetPixel(x, y, color, temp);
        active.shift();
        AddNeighbor(x + 1, y, startColor, done);
        AddNeighbor(x - 1, y, startColor, done);
        AddNeighbor(x, y + 1, startColor, done);
        AddNeighbor(x, y - 1, startColor, done);
    }
    function AddNeighbor(x, y, compColor, doneList) {
        if (IsInImage(x, y) && !doneList[x + imageSizeX * y] && imageData[x + imageSizeX * y].Equals(compColor)) {
            active.push([x, y]);
            done[x + imageSizeX * y] = true;
        }
    }
}
function SetRect(x, y, sizeX, sizeY, color, preview = false) {
    for (let xx = x; xx <= x + sizeX; xx++) {
        for (let yy = y; yy <= y + sizeY; yy++) {
            SetPixel(xx, yy, color, preview);
        }
    }
}
function GetPixel(x, y) {
    return imageData[x + y * imageSizeX];
}
function IsInImage(x, y) {
    return x >= 0 && y >= 0 && x < imageSizeX && y < imageSizeY;
}
// Top left of the pixel
function PixelToScreen(x, y) {
    return [
        cornerPosX + (x * settings.pixelSize),
        cornerPosY + (y * settings.pixelSize),
    ];
}
function ScreenToPixel(x, y) {
    return [
        Math.floor((x - cornerPosX) / settings.pixelSize),
        Math.floor((y - cornerPosY) / settings.pixelSize),
    ];
}
function Draw() {
    console.log("Drawing");
    cornerPosX = window.innerWidth / 2 - imageSizeX * settings.pixelSize / 2;
    cornerPosY = (window.innerHeight - infobarSize) / 2 - imageSizeY * settings.pixelSize / 2;
    let startX = Math.floor(-(canvasPixelSizeX - imageSizeX) / 2 - 1);
    let startY = Math.floor(-(canvasPixelSizeY - imageSizeY) / 2 - 1);
    for (let x = startX; x < startX + canvasPixelSizeX + 2; x++) {
        for (let y = startY; y < startY + canvasPixelSizeY + 2; y++) {
            if (IsInImage(x, y)) {
                DrawPixel(x, y, GetPixel(x, y));
            }
            else {
                DrawPixel(x, y, Color.FromRGB(0, 0, 0, .5));
            }
        }
    }
    if (usePicker && IsInImage(mouseX, mouseY)) {
        let [screenX, screenY] = PixelToScreen(mouseX, mouseY);
        ctx.strokeStyle = "#FF03F5";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.rect(screenX, screenY, settings.pixelSize, settings.pixelSize);
        ctx.stroke();
    }
    if (useGrid) {
        ctx.strokeStyle = "#8885";
        ctx.lineWidth = 2;
        for (let x = gridSizeX; x < imageSizeX; x += gridSizeX) {
            ctx.beginPath();
            ctx.moveTo(cornerPosX + x * settings.pixelSize - 1, cornerPosY - 1);
            ctx.lineTo(cornerPosX + x * settings.pixelSize - 1, cornerPosY + imageSizeY * settings.pixelSize - 1);
            ctx.stroke();
        }
        for (let y = gridSizeY; y < imageSizeY; y += gridSizeY) {
            ctx.beginPath();
            ctx.moveTo(cornerPosX - 1, cornerPosY + y * settings.pixelSize - 1);
            ctx.lineTo(cornerPosX + imageSizeX * settings.pixelSize - 1, cornerPosY + y * settings.pixelSize - 1);
            ctx.stroke();
        }
    }
    // Draw tool size preview
    let showSize = false;
    if (Date.now() - toolSizeChangeTime < toolSizeDisplayDuration) {
        ctx.strokeStyle = "#FF03F5";
        showSize = true;
    }
    else if (toolSize > 1) {
        ctx.strokeStyle = "#8885";
        showSize = true;
    }
    if (showSize) {
        let [minXPixel, minYPixel, maxXPixel, maxYPixel] = GetToolRectWithSize(mouseX, mouseY);
        let [minX, minY] = PixelToScreen(minXPixel, minYPixel);
        let [maxX, maxY] = PixelToScreen(maxXPixel + 1, maxYPixel + 1);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(minX, minY);
        ctx.lineTo(minX, maxY);
        ctx.lineTo(maxX, maxY);
        ctx.lineTo(maxX, minY);
        ctx.lineTo(minX, minY);
        ctx.stroke();
    }
}
function DrawPixel(x, y, color) {
    let bgColor;
    if ((x + y) % 2 == 0)
        bgColor = isDarkTheme ? settings.bgColorA : settings.bgColorAlight;
    else
        bgColor = isDarkTheme ? settings.bgColorB : settings.bgColorBlight;
    let drawColor = color.AlphaBlendWith(bgColor);
    let [screenX, screenY] = PixelToScreen(x, y);
    ctx.fillStyle = drawColor.GetHex();
    ctx.fillRect(screenX, screenY, settings.pixelSize, settings.pixelSize);
}
function SwitchTheme() {
    if (isDarkTheme) {
        document.body.setAttribute("theme", "light");
        isDarkTheme = false;
    }
    else {
        document.body.setAttribute("theme", "dark");
        isDarkTheme = true;
    }
    Draw();
}
function LoadFile() {
    // Ask for file
    var input = document.createElement("input");
    input.type = "file";
    input.onchange = () => {
        if (input.files == null)
            return;
        let reader = new FileReader();
        reader.onload = () => {
            let image = new Image();
            image.src = reader.result;
            let loadCanvas = document.createElement("canvas");
            let loadCtx = loadCanvas.getContext("2d");
            setTimeout(() => {
                loadCanvas.width = image.naturalWidth;
                loadCanvas.height = image.naturalHeight;
                loadCtx.drawImage(image, 0, 0);
                let fileData = loadCtx.getImageData(0, 0, loadCanvas.width, loadCanvas.height).data;
                console.log(fileData);
                CreateImage(loadCanvas.width, loadCanvas.height, false, false);
                for (let x = 0; x < loadCanvas.width; x++) {
                    for (let y = 0; y < loadCanvas.height; y++) {
                        imageData[x + y * imageSizeX] = Color.FromRGB(fileData[x * 4 + y * 4 * imageSizeX] / 255, fileData[x * 4 + y * 4 * imageSizeX + 1] / 255, fileData[x * 4 + y * 4 * imageSizeX + 2] / 255, fileData[x * 4 + y * 4 * imageSizeX + 3] / 255);
                    }
                }
                Draw();
                RecordUndo();
            }, 1);
        };
        reader.readAsDataURL(input.files[0]);
    };
    input.click();
}
function GetToolRectWithSize(x, y) {
    let minX = x - Math.floor(toolSize / 2);
    let minY = y - Math.floor(toolSize / 2);
    return [minX, minY, minX + toolSize - 1, minY + toolSize - 1];
}
//# sourceMappingURL=index.js.map