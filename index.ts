let canvas = document.getElementById("canvas") as HTMLCanvasElement;
let infobar = document.getElementById("infobar")!!;
let mainInput = document.getElementById("main-input") as HTMLInputElement;
let infoRight = document.getElementById("info-right")!!;
let infoLeft = document.getElementById("info-left-text")!!;
let searchResults = document.getElementById("search-list")!!;

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

enum Tool {
    free, line, paintpot
}

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

let currentColor = Color.FromRGB(1, 1, 1);
let currentAltColor = Color.FromRGB(0, 0, 0, 0);
let currentTool = Tool.free;

let usePicker = false;

let commandHistory: Command[] = [];

// Initial theme
let isDarkTheme = window.matchMedia("(prefers-color-scheme: dark)").matches;
document.body.setAttribute("theme", isDarkTheme ? "dark" : "light");

canvas.addEventListener("contextmenu", event => event.preventDefault());

InitUndo();

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
})

OnResize();

function CreateImage(sizeX: number, sizeY: number, keepOldData = false)
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

    if (!preview)
    {
        RecordUndo();
        Draw();
    }
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

function DrawRect(x: number, y: number, sizeX: number, sizeY: number, color: Color)
{
    for (let xx = x; xx < sizeX; xx++)
    {
        for (let yy = y; yy < sizeY; yy++)
        {
            SetPixel(xx, yy, color);
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

    let startX = -(canvasPixelSizeX - imageSizeX) / 2 - 1;
    let startY = -(canvasPixelSizeX - imageSizeX) / 2 - 1;

    for (let x = startX; x < canvasPixelSizeX + 1; x++)
    {
        for (let y = startY; y < canvasPixelSizeY + 1; y++)
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
        ctx.beginPath();
        ctx.rect(screenX, screenY, settings.pixelSize, settings.pixelSize);
        ctx.stroke();
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
    ctx.fillRect(screenX - 0.5, screenY - 0.5, settings.pixelSize + 1, settings.pixelSize + 1);
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
