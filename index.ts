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

enum Tool {
    free, line, paintpot, rect, filledRect
}

const toolIcons = [
    "icons/tool_free.png",
    "icons/tool_line.png",
    "icons/tool_paintpot.png",
    "icons/tool_rect.png",
    "icons/tool_filledrect.png",
]

const infobarSize = 27; // px

let settings = {
    pixelSize: 16,
    bgColorA: Color.FromHSV(0, 0, .10),
    bgColorB: Color.FromHSV(0, 0, .05),
    bgColorAlight: Color.FromHSV(0, 0, 1),
    bgColorBlight: Color.FromHSV(0, 0, .9),
    maxSearchResults: 10,
}

let ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

let imageSizeX: number;
let imageSizeY: number;
let imageData: Color[]; // From top-left

let canvasPixelSizeX: number; // In pixels
let canvasPixelSizeY: number;

let cornerPosX: number; // On screen
let cornerPosY: number;

let mouseX: number;
let mouseY: number;
let lastMouseX: number;
let lastMouseY: number;

let mouseLeft = false;
let mouseRight = false;
let mouseMiddle = false;
let mouseStartPosX: number; // In pixels
let mouseStartPosY: number;

let currentColor: Color;
let currentAltColor = Color.FromRGB(0, 0, 0, 0);
let currentTool = Tool.free;

let usePicker = false;

let commandHistory: Command[] = [];

let useGrid = false;
let gridSizeX = 16;
let gridSizeY = 16;

let mainColorUI : HTMLElement;
let altColorUI : HTMLElement;

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
canvas.addEventListener("mousedown", () => OnMouseDownCanvas())
canvas.addEventListener("mousemove", () => OnMouseMoveCanvas())
canvas.addEventListener("mouseup", () => OnMouseUpCanvas())

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

    if (usePicker)
    {
        Draw();
    }
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
    ApplyMouseTools(true);
}

function OnMouseDownCanvas() 
{
    CloseColorSelector();

    if (usePicker)
    {
        if (IsInImage(mouseX, mouseY))
            currentColor = imageData[mouseX + imageSizeX * mouseY];

        usePicker = false;
        Draw();
    }
    else
    {
        setTimeout(() => ApplyMouseTools(true), 0);
    }
}

function OnMouseUpCanvas() 
{
    ApplyMouseTools(false);
}

function ApplyMouseTools(preview: boolean)
{
    if (!mouseLeft && !mouseRight) return;

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
        let startX = Math.min(mouseStartPosX, mouseX);
        let startY = Math.min(mouseStartPosY, mouseY);
        let sizeX = Math.max(mouseStartPosX, mouseX) - startX;
        let sizeY = Math.max(mouseStartPosY, mouseY) - startY;

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
    toolIcon.style.setProperty("background-image", `url(${toolIcons[tool]})`);
}

function OnColorChanged()
{
    mainColorUI?.remove();
    altColorUI?.remove();
    mainColorUI = currentColor.GetColorUI();
    altColorUI = currentAltColor.GetColorUI();

    infoIconsParent.appendChild(altColorUI);
    infoIconsParent.appendChild(mainColorUI);
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
        SetPixel(startX, startY, color, temp);
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
            SetPixel(Math.round(x), y, color, temp);
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
            SetPixel(x, Math.round(y), color, temp);
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
    for (let xx = x; xx < x + sizeX; xx++)
    {
        for (let yy = y; yy < y + sizeY; yy++)
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

function Draw()
{
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
                DrawPixel(x, y, Color.FromRGB(0, 0, 0, .5));
            }
        }
    }

    if (usePicker && IsInImage(mouseX, mouseY))
    {
        let [screenX, screenY] = PixelToScreen(mouseX, mouseY);

        ctx.strokeStyle = "#FF03F5";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.rect(screenX, screenY, settings.pixelSize, settings.pixelSize);
        ctx.stroke();
    }

    if (useGrid)
    {
        ctx.strokeStyle = "#8885";
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
}

function DrawPixel(x: number, y: number, color: Color)
{
    let bgColor: Color;
    if ((x + y) % 2 == 0)
        bgColor = isDarkTheme ? settings.bgColorA : settings.bgColorAlight;
    else
        bgColor = isDarkTheme ? settings.bgColorB : settings.bgColorBlight;

    let drawColor = color.AlphaBlendWith(bgColor);

    let [screenX, screenY] = PixelToScreen(x, y);
    ctx.fillStyle = drawColor.GetHex();
    ctx.fillRect(screenX, screenY, settings.pixelSize, settings.pixelSize);
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
                console.log(fileData);
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
