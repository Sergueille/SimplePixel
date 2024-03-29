let canvas = document.getElementById("canvas") as HTMLCanvasElement;
let infobar = document.getElementById("infobar")!!;
let mainInput = document.getElementById("main-input") as HTMLInputElement;
let infoRight = document.getElementById("info-right")!!;
let infoLeft = document.getElementById("info-left-text")!!;
let searchResults = document.getElementById("search-list")!!;
let infoIconsParent = document.getElementById("info-icons")!!;
let toolIcon = document.getElementById("tool-icon")!!;

let colorSelect = document.getElementById("color-select")!!;
let colorSelectView = document.getElementById("color-view") as HTMLCanvasElement;
let colorSelectSlider = document.getElementById("color-slider") as HTMLInputElement;
let colorSelectAlphaSlider = document.getElementById("alpha-slider") as HTMLInputElement;
let colorSelectPreview = document.getElementById("color-preview")!!;
let colorSelectHexInput = document.getElementById("hex-input") as HTMLInputElement;
let colorSelectHInput = document.getElementById("color-h-input") as HTMLInputElement;
let colorSelectSInput = document.getElementById("color-s-input") as HTMLInputElement;
let colorSelectVInput = document.getElementById("color-v-input") as HTMLInputElement;
let colorSelectAInput = document.getElementById("color-a-input") as HTMLInputElement;
let colorSelectKnob = document.getElementById("color-knob")!!;

let exportPanel = document.getElementById("export-panel")!!;
let exportButton = document.getElementById("export-btn")!!;
let exportFormatSelect = document.getElementById("export-format") as HTMLSelectElement;
let exportCropAlpha = document.getElementById("export-crop") as HTMLInputElement;
let exportTile = document.getElementById("export-tile") as HTMLInputElement;
let exportFilename = document.getElementById("export-name") as HTMLInputElement;
let exportUpscaleInput = document.getElementById("export-upscale") as HTMLInputElement;

let recentPanel = document.getElementById("recent-panel")!!;
let recentList = document.getElementById("recent-list")!!;
let clearBtn = document.getElementById("clear-history-btn")!!;

let tutoPanel = document.getElementById("tutorial")!!;
let tutoTitle = document.getElementById("tuto-title")!!;
let tutoText = document.getElementById("tuto-text")!!;
let tutoProgressFill = document.querySelector("#tuto-progress > .bar-fill") as HTMLElement;
let tutoButtonsContainer = document.getElementById("tuto-btns")!!;
let tutoHighlight = document.getElementById("tuto-highlight")!!;
let closeTutoBtn = document.getElementById("close-tutorial")!!;

class ImageState
{
    public data: Color[];
    public sizeX: number;
    public sizeY: number;

    public static Get() : ImageState
    {
        let res = new ImageState();
        res.data = [...imageData];
        res.sizeX = imageSizeX;
        res.sizeY = imageSizeY;
        return res;
    }

    public Set()
    {
        imageData = [...this.data];
        imageSizeX = this.sizeX;
        imageSizeY = this.sizeY;
        Draw();
    }
}

class HistoryEntry extends ImageState {
    public date: number;

    public static Get() : HistoryEntry
    {
        let entry = super.Get() as HistoryEntry;
        entry.date = Date.now();
        return entry;
    }
    
    public Set()
    {
        super.Set();
    }
}

enum Tool {
    free, line, paintpot, rect, filledRect
}

enum SelectState {
    disabled, firstPoint, secondPoint
}

enum SelectAction {
    none, measure, copy, cut
}

enum ClickAction {
    none, picker, altpicker, paste, pasteTransparent
}

const toolIcons = [
    "icons/tool_free.png",
    "icons/tool_line.png",
    "icons/tool_paintpot.png",
    "icons/tool_rect.png",
    "icons/tool_filledrect.png",
]

const clickIcons = [
    "",
    "icons/click_picker.png",
    "icons/click_picker.png",
    "icons/select_copy.png",
    "icons/click_pastetransparent.png",
]

const selectIcons = [
    "",
    "icons/select_measure.png",
    "icons/select_copy.png",
    "icons/select_copy.png",
]

const infobarSize = 27; // px
const lineColor = "#FF03F5";
const grayLineColor = "#8885";
const imageBorderCheckerSize = 35; // pixels
const borderAlpha = 0.5;
const maxHistoryEntries = 10;

let settings = {
    pixelSize: 20,
    bgColorA: Color.FromHSV(0, 0, .10),
    bgColorB: Color.FromHSV(0, 0, .05),
    bgColorAlight: Color.FromHSV(0, 0, 1),
    bgColorBlight: Color.FromHSV(0, 0, .9),
    maxSearchResults: 10,
    maxUndoEntries: 200,
}

let ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

let imageSizeX: number;
let imageSizeY: number;
let imageData: Color[]; // From top-left

let canvasPixelSizeX: number; // In pixels
let canvasPixelSizeY: number;

let cornerPosX: number; // On screen
let cornerPosY: number;

let mouseX: number; // In pixel
let mouseY: number;
let lastMouseX: number; // In pixel
let lastMouseY: number;

let mouseLeft = false;
let mouseRight = false;
let mouseMiddle = false;
let mouseStartPosX: number; // In pixels
let mouseStartPosY: number;

let currentColor: Color;
let currentAltColor = Color.FromRGB(0, 0, 0, 0);
let currentTool = Tool.free;

let clickAction = ClickAction.none;

let commandHistory: Command[] = [];

let useGrid = false;
let gridSizeX = 16;
let gridSizeY = 16;

let mainColorUI : HTMLElement;
let altColorUI : HTMLElement;

let toolSize = 1;
let toolSizeChangeTime = -1;
const toolSizeDisplayDuration = 500; // ms

let selectState = SelectState.disabled;
let selectAction = SelectAction.none;
let selectStartX = 0;
let selectStartY = 0;

let copyData: Color[];
let copySizeX: number;
let copySizeY: number;


// Initial theme
let isDarkTheme = window.matchMedia("(prefers-color-scheme: dark)").matches;
document.body.setAttribute("theme", isDarkTheme ? "dark" : "light");

if (isDarkTheme)
    currentColor = Color.FromRGB(1, 1, 1);
else
    currentColor = Color.FromRGB(0, 0, 0);

canvas.addEventListener("contextmenu", event => event.preventDefault());

// Setup

ctx.imageSmoothingEnabled = false;

InitHistory();
UpdateToolbarIcons();
InitUndo();
SetTool(Tool.free);
CreateImage(32, 32);
InitTutorial();

OnSearchBlur();
CloseColorSelector();
CloseExportPanel();
CloseRecentPanel();

// Events
addEventListener("resize", OnResize);
addEventListener("mousemove", OnMouseMove);
addEventListener("mousedown", OnMouseDown);
addEventListener("mouseup", OnMouseUp);
canvas.addEventListener("mousedown", () => OnMouseDownCanvas())
canvas.addEventListener("mousemove", () => OnMouseMoveCanvas())
canvas.addEventListener("mouseup", () => OnMouseUpCanvas())
canvas.addEventListener("wheel", (ev) => OnWheel(ev as WheelEvent))

// search.ts
addEventListener("keydown", OnKeyPressed);
mainInput.addEventListener("keydown", OnSearchKey);
mainInput.addEventListener("focus", OnSearchFocus);
mainInput.addEventListener("blur", OnSearchBlur);
mainInput.addEventListener("input", OnSearchChange);

// colorSelect.ts
colorSelectHInput.addEventListener("input", (e) => HandleColorInput(e, h => color.SetH(h)));
colorSelectSInput.addEventListener("input", (e) => HandleColorInput(e, s => color.SetS(s)));
colorSelectVInput.addEventListener("input", (e) => HandleColorInput(e, v => color.SetV(v)));
colorSelectAInput.addEventListener("input", (e) => HandleColorInput(e, a => color.SetA(a)));
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
    if (res != null)
    {
        SetColor(res);
    }
});

// Export.ts
exportButton.addEventListener("click", () => {
    ExportImage();
});
exportPanel.addEventListener("mousemove", () => {
    UpdateExportInputs();
})

exportUpscaleInput.addEventListener("input", ev => {
    let val = parseInt(exportUpscaleInput.value);
    exportUpscaleInput.classList.toggle("invalid", isNaN(val) || val < 1);
});

// History.ts
clearBtn.addEventListener("click", () => {
    ClearHistory();
    CloseRecentPanel();
})

closeTutoBtn.addEventListener("click", () => {
    CloseTutorial();
})

OnResize();

function CreateImage(sizeX: number, sizeY: number, keepOldData = false, recordUndo = true)
{
    let oldData;
    if (keepOldData)
        oldData = [...imageData];
    let oldSizeX = imageSizeX;
    let oldSizeY = imageSizeY;

    imageSizeX = sizeX;
    imageSizeY = sizeY;
    imageData = new Array(imageSizeX * imageSizeY);
    imageData.fill(Color.FromRGB(0, 0, 0, 0));

    if (keepOldData)
    {
        let startX = Math.round(Math.abs(oldSizeX - sizeX) / 2);
        let endX = startX + Math.min(oldSizeX, sizeX);
        let oldSmallerX = oldSizeX < sizeX;

        let startY = Math.round(Math.abs(oldSizeY - sizeY) / 2);
        let endY = startY + Math.min(oldSizeY, sizeY);
        let oldSmallerY = oldSizeY < sizeY;

        for (let x = startX; x < endX; x++)
        {
            for (let y = startY; y < endY; y++)
            {
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

function OnResize()
{
    let width = window.innerWidth;
    let height = window.innerHeight - infobarSize;
    canvas.setAttribute("width", width.toString());
    canvas.setAttribute("height", height.toString());
    canvasPixelSizeX = Math.floor(width / settings.pixelSize);
    canvasPixelSizeY = Math.floor(height / settings.pixelSize);

    Draw();
}

function OnMouseMove(event: MouseEvent)
{
    [lastMouseX, lastMouseY] = [mouseX, mouseY];
    [mouseX, mouseY] = ScreenToPixel(event.pageX, event.pageY);
    infoRight.innerHTML = `${mouseX}, ${mouseY}`;
}

function OnMouseDown(event: MouseEvent) 
{
    if (event.button == 0)
        mouseLeft = true;
    else if (event.button == 1)
        mouseMiddle = true;
    else if (event.button == 2)
        mouseRight = true;

    [mouseStartPosX, mouseStartPosY] = ScreenToPixel(event.pageX, event.pageY)
}

function OnMouseUp(event) 
{
    if (event.button == 0)
        mouseLeft = false;
    else if (event.button == 1)
        mouseMiddle = false;
    else if (event.button == 2)
        mouseRight = false;
}

function OnMouseMoveCanvas()
{    
    if (lastMouseX != mouseX || lastMouseY != mouseY)
        Draw();

    if (clickAction == ClickAction.paste)
    {
        Paste(false, true);
    }
    else if (clickAction == ClickAction.pasteTransparent)
    {
        Paste(true, true);
    }

    ApplyMouseTools(true);
}

function OnMouseDownCanvas() 
{
    CloseColorSelector();
    CloseExportPanel();
    CloseRecentPanel();

    setTimeout(() => ApplyMouseTools(true), 0); // HACK: why timeout?
}

function OnMouseUpCanvas() 
{
    ApplyMouseTools(false);

    if (selectState == SelectState.firstPoint)
    {
        selectState = SelectState.secondPoint;
        selectStartX = mouseX;
        selectStartY = mouseY;
    }
    else if (selectState == SelectState.secondPoint)
    {
        if (selectAction == SelectAction.copy || selectAction == SelectAction.cut) // copy
        {
            [copySizeX, copySizeY] = GetRectSize(mouseX, mouseY, selectStartX, selectStartY);
            copyData = [];

            IterateThroughRect((x, y, coordX, coordY) => { // Copy
                copyData.push(imageData[coordX + coordY * imageSizeX].Copy());

                if (selectAction == SelectAction.cut)
                    imageData[coordX + coordY * imageSizeX] = currentAltColor.Copy();

            }, mouseX, mouseY, selectStartX, selectStartY);
        }

        SetSelectAction(SelectAction.none);
    }     
    else if (clickAction == ClickAction.picker || clickAction == ClickAction.altpicker)
    {
        if (IsInImage(mouseX, mouseY))
        {
            if (clickAction == ClickAction.picker)
                currentColor = imageData[mouseX + imageSizeX * mouseY];
            else
                currentAltColor = imageData[mouseX + imageSizeX * mouseY];
        }

        UpdateToolbarIcons();

        SetClickAction(ClickAction.none);
        Draw();
    }
    else if (clickAction == ClickAction.paste)
    {
        Paste(false, false);
        Draw();
        SetClickAction(ClickAction.none);
    }
    else if (clickAction == ClickAction.pasteTransparent)
    {
        Paste(true, false);
        Draw();
        SetClickAction(ClickAction.none);
    }
}

function OnWheel(event: WheelEvent)
{
    if (event.ctrlKey) // Handle zoom
    {
        const zoomSpeed = .2;

        if (event.deltaY < 0)
        {
            settings.pixelSize = Math.ceil(settings.pixelSize * (1 + zoomSpeed));
        }
        else
        {
            if (settings.pixelSize > 2)
            settings.pixelSize = Math.floor(settings.pixelSize * (1 - zoomSpeed));
        }

        OnResize();

        event.preventDefault(); // Prevent page zoom
    }
    else // Change tool size
    {
        if (event.deltaY > 0)
        {
            if (toolSize > 1)
                toolSize--;
        }
        else
        {
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

function ApplyMouseTools(preview: boolean)
{
    if (!mouseLeft && !mouseRight) return;

    if (clickAction != ClickAction.none || selectState != SelectState.disabled) return;

    let color = mouseLeft ? currentColor : currentAltColor;

    if (preview)
        Draw();

    if (currentTool == Tool.free)
    {
        SetLine(lastMouseX, lastMouseY, mouseX, mouseY, color);
    }
    else if (currentTool == Tool.line)
    {
        SetLine(mouseStartPosX, mouseStartPosY, mouseX, mouseY, color, preview);
    }
    else if (currentTool == Tool.paintpot)
    {
        PaintPot(mouseX, mouseY, color, preview);
    }
    else if (currentTool == Tool.rect)
    {
        SetLine(mouseStartPosX, mouseStartPosY, mouseX, mouseStartPosY, color, preview);
        SetLine(mouseX, mouseStartPosY, mouseX, mouseY, color, preview);
        SetLine(mouseX, mouseY, mouseStartPosX, mouseY, color, preview);
        SetLine(mouseStartPosX, mouseY, mouseStartPosX, mouseStartPosY, color, preview);
    }
    else if (currentTool == Tool.filledRect)
    {
        let [minX, minY, maxX, maxY] = GetToolRectWithSize(mouseX, mouseY);
        let [minStartX, minStartY, maxStartX, maxStartY] = GetToolRectWithSize(mouseStartPosX, mouseStartPosY);

        let startX = Math.min(minStartX, minX);
        let startY = Math.min(minStartY, minY);
        let sizeX = Math.max(maxStartX, maxX) - startX;
        let sizeY = Math.max(maxStartY, maxY) - startY;

        SetRect(startX, startY, sizeX, sizeY, color, preview);
    }

    if (!preview)
    {
        RecordUndo();
        Draw();
    }
}

function SetTool(tool: Tool)
{
    currentTool = tool;
    UpdateToolbarIcons();
}

function SetClickAction(newClickAction: ClickAction)
{
    clickAction = newClickAction;
    UpdateToolbarIcons();
}

function SetSelectAction(newSelectAction: SelectAction)
{
    selectAction = newSelectAction;

    if (selectAction == SelectAction.none)
        selectState = SelectState.disabled;
    else
        selectState = SelectState.firstPoint;
    
    UpdateToolbarIcons();
}

function UpdateToolbarIcons()
{
    mainColorUI?.remove();
    altColorUI?.remove();
    mainColorUI = currentColor.GetColorUI();
    altColorUI = currentAltColor.GetColorUI();

    infoIconsParent.appendChild(mainColorUI);
    infoIconsParent.appendChild(altColorUI);
    
    let imageName = "";

    if (selectState != SelectState.disabled)
    {
        imageName = selectIcons[selectAction];
    }
    else if (clickAction != ClickAction.none)
    {
        imageName = clickIcons[clickAction];
    }
    else
    {
        imageName = toolIcons[currentTool];
    }

    toolIcon.style.setProperty("background-image", `url(${imageName})`);
}

function SetToolSizeRect(x: number, y: number, color: Color, temp = false)
{
    let [minX, minY, maxX, maxY] = GetToolRectWithSize(x, y);
    SetRect(minX, minY, maxX - minX, maxY - minY, color, temp);
}

function SetPixel(x: number, y: number, color: Color, temp = false)
{
    if (!IsInImage(x, y)) return;

    if (temp)
    {
        DrawPixel(x, y, color);
    }
    else
    {
        imageData[x + y * imageSizeX] = color.Copy();
    }
}

function SetLine(startX: number, startY: number, endX: number, endY: number, color: Color, temp = false)
{
    if (startX == endX && startY == endY)
    {
        SetToolSizeRect(startX, startY, color, temp);
        return;
    }

    let ax = (endY - startY) / (endX - startX);
    let ay = (endX - startX) / (endY - startY);

    if (Math.abs(ay) < Math.abs(ax))
    {
        if (startY > endY)
        {
            [startX, endX] = [endX, startX];
            [startY, endY] = [endY, startY];
        }

        for (let y = startY; y <= endY; y++)
        {
            let x = startX + ay * (y - startY);
            SetToolSizeRect(Math.round(x), y, color, temp);
        }
    }
    else
    {
        if (startX > endX)
        {
            [startX, endX] = [endX, startX];
            [startY, endY] = [endY, startY];
        }

        for (let x = startX; x <= endX; x++)
        {
            let y = startY + ax * (x - startX);
            SetToolSizeRect(x, Math.round(y), color, temp);
        }
    }
}

function PaintPot(startX: number, startY: number, color: Color, temp = false)
{
    let active: [number, number][] = [[startX, startY]];
    let done: boolean[] = new Array(imageSizeX * imageSizeY).fill(false);
    let startColor = imageData[startX + imageSizeX * startY];

    while (active.length > 0)
    {
        let x = active[0][0];
        let y = active[0][1];

        SetPixel(x, y, color, temp);
        active.shift();

        AddNeighbor(x + 1, y, startColor, done);
        AddNeighbor(x - 1, y, startColor, done);
        AddNeighbor(x, y + 1, startColor, done);
        AddNeighbor(x, y - 1, startColor, done);
    }

    function AddNeighbor(x: number, y: number, compColor: Color, doneList: boolean[])
    {
        if (IsInImage(x, y) && !doneList[x + imageSizeX * y] && imageData[x + imageSizeX * y].Equals(compColor))
        {
            active.push([x, y]);
            done[x + imageSizeX * y] = true;
        }
    }   
}

function SetRect(x: number, y: number, sizeX: number, sizeY: number, color: Color, preview = false)
{
    for (let xx = x; xx <= x + sizeX; xx++)
    {
        for (let yy = y; yy <= y + sizeY; yy++)
        {
            SetPixel(xx, yy, color, preview);
        }
    }
}

function GetPixel(x: number, y: number) : Color
{
    return imageData[x + y * imageSizeX];
}

function IsInImage(x, y)
{
    return x >= 0 && y >= 0 && x < imageSizeX && y < imageSizeY;
}

// Top left of the pixel
function PixelToScreen(x, y) : [number, number]
{
    return [
        cornerPosX + (x * settings.pixelSize),
        cornerPosY + (y * settings.pixelSize),
    ]
}

function ScreenToPixel(x, y) : number[]
{
    return [
        Math.floor((x - cornerPosX) / settings.pixelSize),
        Math.floor((y - cornerPosY) / settings.pixelSize),
    ];
}

function Paste(transparent: boolean, temp = false)
{
    if (!copyData || copyData.length == 0) return;

    let posX = mouseX - Math.floor(copySizeX / 2);
    let posY = mouseY - Math.floor(copySizeY / 2);

    IterateThroughRect((x, y, coordX, coordY) => {
        if (!IsInImage(coordX, coordY)) return;

        let color: Color;
        if (transparent)
            color = copyData[x + y * copySizeX].AlphaBlendWith(GetPixel(coordX, coordY));
        else
            color = copyData[x + y * copySizeX];

        SetPixel(coordX, coordY, color, temp);
    }, posX, posY, posX + copySizeX - 1, posY + copySizeY - 1);
}

function Draw()
{
    // Clear
    let clearColor = (isDarkTheme ? settings.bgColorA : settings.bgColorAlight).BlendWith(Color.FromRGB(0, 0, 0, borderAlpha));
    clearColor.a = 1;
    ctx.fillStyle = clearColor.GetHex();
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    cornerPosX = window.innerWidth / 2 - imageSizeX * settings.pixelSize / 2;
    cornerPosY = (window.innerHeight - infobarSize) / 2 - imageSizeY * settings.pixelSize / 2;

    let startX = Math.floor(-(canvasPixelSizeX - imageSizeX) / 2 - 1);
    let startY = Math.floor(-(canvasPixelSizeY - imageSizeY) / 2 - 1);

    for (let x = startX; x < startX + canvasPixelSizeX + 2; x++)
    {
        for (let y = startY; y < startY + canvasPixelSizeY + 2; y++)
        {
            if (IsInImage(x, y)) 
            {
                DrawPixel(x, y, GetPixel(x, y));
            }
            else
            {
                DrawPixel(x, y, Color.FromRGB(0, 0, 0, borderAlpha));
            }
        }
    }

    if (IsInImage(mouseX, mouseY)) // Draw square around current pixel
    {
        if (clickAction == ClickAction.picker || clickAction == ClickAction.altpicker || selectState == SelectState.firstPoint)
        {
            let [screenX, screenY] = PixelToScreen(mouseX, mouseY);

            ctx.strokeStyle = lineColor;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.rect(screenX, screenY, settings.pixelSize, settings.pixelSize);
            ctx.stroke();
        }
    }
    
    // Draw measures
    if (selectState == SelectState.secondPoint)
    {
        let minX = Math.min(selectStartX, mouseX);
        let minY = Math.min(selectStartY, mouseY);
        let maxX = Math.max(selectStartX, mouseX) + 1;
        let maxY = Math.max(selectStartY, mouseY) + 1;

        let [screenStartX, screenStartY] = PixelToScreen(minX, minY);
        let [screenEndX, screenEndY] = PixelToScreen(maxX, maxY);

        ctx.strokeStyle = lineColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.rect(screenStartX, screenStartY, screenEndX - screenStartX, screenEndY - screenStartY);
        ctx.stroke();

        let middleX = (screenStartX + screenEndX) / 2;
        let middleY = (screenStartY + screenEndY) / 2;
        let sizeX = maxX - minX;
        let sizeY = maxY - minY;

        // Draw numbers if measuring

        if (selectAction == SelectAction.measure)
        {
            ctx.fillStyle = lineColor;
            ctx.font = "20px munro";
            ctx.textBaseline = "top";
            ctx.textAlign = "center"
            ctx.fillText(sizeX.toString(), middleX, screenEndY + settings.pixelSize / 2);
            ctx.textBaseline = "middle";
            ctx.textAlign = "left"
            ctx.fillText(sizeY.toString(), screenEndX + settings.pixelSize / 2, middleY);
        }
    }

    if (useGrid) // Draw grid
    {
        ctx.strokeStyle = grayLineColor;
        ctx.lineWidth = 2;

        for (let x = gridSizeX; x < imageSizeX; x += gridSizeX)
        {
            ctx.beginPath();
            ctx.moveTo(cornerPosX + x * settings.pixelSize - 1, cornerPosY - 1);
            ctx.lineTo(cornerPosX + x * settings.pixelSize - 1, cornerPosY + imageSizeY * settings.pixelSize - 1);
            ctx.stroke();
        }
        
        for (let y = gridSizeY; y < imageSizeY; y += gridSizeY)
        {
            ctx.beginPath();
            ctx.moveTo(cornerPosX - 1, cornerPosY + y * settings.pixelSize - 1);
            ctx.lineTo(cornerPosX + imageSizeX * settings.pixelSize - 1, cornerPosY + y * settings.pixelSize - 1);
            ctx.stroke();
        }
    }

    // Draw tool size preview
    let showSize = false;
    if (Date.now() - toolSizeChangeTime < toolSizeDisplayDuration) 
    {
        ctx.strokeStyle = lineColor;
        showSize = true;
    }
    else if (toolSize > 1)
    {
        ctx.strokeStyle = grayLineColor;
        showSize = true;
    }

    if (showSize)
    {
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

function DrawPixel(x: number, y: number, color: Color)
{
    let distX = 0;
    let distY = 0;
    if (x < 0) 
        distX = -x;
    else if (x >= imageSizeX) 
        distX = x - imageSizeX + 1;
    if (y < 0) 
        distY = -y;
    else if (y >= imageSizeY) 
        distY = y - imageSizeY + 1;
    let distFromImage = distX + distY;

    if (distFromImage > imageBorderCheckerSize) return;

    let bgColor: Color;
    if ((x + y) % 2 == 0)
        bgColor = isDarkTheme ? settings.bgColorA : settings.bgColorAlight;
    else
        bgColor = isDarkTheme ? settings.bgColorB : settings.bgColorBlight;

    if (distFromImage > 0)
        bgColor = bgColor.BlendWith(isDarkTheme ? settings.bgColorA : settings.bgColorAlight, 1 - distFromImage / imageBorderCheckerSize);

    let drawColor = color.AlphaBlendWith(bgColor);

    let delta = 0.5;

    let [screenX, screenY] = PixelToScreen(x, y);
    ctx.fillStyle = drawColor.GetHex();
    ctx.fillRect(screenX - delta, screenY - delta, settings.pixelSize + delta, settings.pixelSize + delta);
}

function SwitchTheme()
{
    if (isDarkTheme)
    {
        document.body.setAttribute("theme", "light");
        isDarkTheme = false;
    }
    else
    {
        document.body.setAttribute("theme", "dark");
        isDarkTheme = true;
    }

    Draw();
}

function LoadFile()
{
    // Ask for file
    var input = document.createElement("input");
    input.type = "file";

    input.onchange = () => {
        if (input.files == null) return;

        let reader = new FileReader();
        reader.onload = () => {
            let image = new Image();
            image.src = reader.result as string;

            let loadCanvas = document.createElement("canvas");
            let loadCtx = loadCanvas.getContext("2d") as CanvasRenderingContext2D;

            setTimeout(() => {
                loadCanvas.width = image.naturalWidth;
                loadCanvas.height = image.naturalHeight;
                loadCtx.drawImage(image, 0, 0);

                let fileData = loadCtx.getImageData(0, 0, loadCanvas.width, loadCanvas.height).data;
                CreateImage(loadCanvas.width, loadCanvas.height, false, false);

                for (let x = 0; x < loadCanvas.width; x++)
                {
                    for (let y = 0; y < loadCanvas.height; y++)
                    {
                        imageData[x + y * imageSizeX] = Color.FromRGB(
                            fileData[x * 4 + y * 4 * imageSizeX] / 255,
                            fileData[x * 4 + y * 4 * imageSizeX + 1] / 255,
                            fileData[x * 4 + y * 4 * imageSizeX + 2] / 255,
                            fileData[x * 4 + y * 4 * imageSizeX + 3] / 255,
                        );
                    }
                }

                Draw();
                RecordUndo();
            }, 1)
        };
        
        reader.readAsDataURL(input.files[0]);
    };

    input.click();
}

function GetToolRectWithSize(x: number, y: number) : [number, number, number, number] // minX, minY, maxX, maxY
{
    let minX = x - Math.floor(toolSize / 2);
    let minY = y - Math.floor(toolSize / 2);
    return [minX, minY, minX + toolSize - 1, minY + toolSize - 1];
}

function RotateImage()
{
    let copy: Color[] = new Array(imageSizeX * imageSizeY);

    IterateThroughRect((x, y) => {
        let newX = y;
        let newY = imageSizeX - x - 1;

        copy[newX + newY * imageSizeY] = imageData[x + y * imageSizeX];
    }, 0, 0, imageSizeX - 1, imageSizeY - 1);

    imageData = copy;
    [imageSizeX, imageSizeY] = [imageSizeY, imageSizeX];

    Draw();
    RecordUndo();
}

function Mirror(isX: boolean) // false: y, true: x
{
    let copy: Color[] = new Array(imageSizeX * imageSizeY);

    IterateThroughRect((x, y) => {
        let newX = isX? imageSizeX - x - 1 : x;
        let newY = isX? y : imageSizeY - y - 1;

        copy[newX + newY * imageSizeX] = imageData[x + y * imageSizeX];
    }, 0, 0, imageSizeX - 1, imageSizeY - 1);

    imageData = copy;

    Draw();
    RecordUndo();
}
