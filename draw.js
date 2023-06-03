function Draw() {
    DrawPixels();
    if (IsInImage(mouseX, mouseY)) // Draw square around current pixel
     {
        if (clickAction == ClickAction.picker || selectState == SelectState.firstPoint) {
            let [screenX, screenY] = PixelToScreen(mouseX, mouseY);
            ctx.strokeStyle = lineColor;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.rect(screenX, screenY, settings.pixelSize, settings.pixelSize);
            ctx.stroke();
        }
    }
    // Draw measures
    if (selectState == SelectState.secondPoint) {
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
        if (selectAction == SelectAction.measure) {
            ctx.fillStyle = lineColor;
            ctx.font = "20px munro";
            ctx.textBaseline = "top";
            ctx.textAlign = "center";
            ctx.fillText(sizeX.toString(), middleX, screenEndY + settings.pixelSize / 2);
            ctx.textBaseline = "middle";
            ctx.textAlign = "left";
            ctx.fillText(sizeY.toString(), screenEndX + settings.pixelSize / 2, middleY);
        }
    }
    if (useGrid) // Draw grid
     {
        ctx.strokeStyle = grayLineColor;
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
        ctx.strokeStyle = lineColor;
        showSize = true;
    }
    else if (toolSize > 1) {
        ctx.strokeStyle = grayLineColor;
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
function DrawPixels() {
    let data = new Uint8ClampedArray(window.innerWidth * window.innerHeight * 4);
    cornerPosX = window.innerWidth / 2 - imageSizeX * settings.pixelSize / 2; // Update corner
    cornerPosY = (window.innerHeight - infobarSize) / 2 - imageSizeY * settings.pixelSize / 2;
    ctx.putImageData(new ImageData(data, window.innerWidth, window.innerHeight), 0, 0);
}
function UpdateAll() {
    IterateThroughRect((x, y) => {
        let id = x + y * window.innerWidth;
        let [px, py] = ScreenToPixel(x, y);
        let color;
        if (IsInImage(px, py))
            color = imageData[px + py * imageSizeX];
        else
            color = Color.FromRGB(0, 0, 0, .5);
        // Get pixel color
        let bgColor;
        if ((px + py) % 2 == 0)
            bgColor = isDarkTheme ? settings.bgColorA : settings.bgColorAlight;
        else
            bgColor = isDarkTheme ? settings.bgColorB : settings.bgColorBlight;
        let drawColor = color.AlphaBlendWith(bgColor);
        data[id * 4] = drawColor.r * 255;
        data[id * 4 + 1] = drawColor.g * 255;
        data[id * 4 + 2] = drawColor.b * 255;
        data[id * 4 + 3] = drawColor.a * 255;
    }, 0, 0, window.innerWidth, window.innerHeight);
}
function UpdatePixel(px, py) {
    let [cornerX, cornerY] = PixelToScreen(px, py);
    IterateThroughRect((x, y) => {
        let id = x + y * window.innerWidth;
        let color;
        if (IsInImage(px, py))
            color = imageData[px + py * imageSizeX];
        else
            color = Color.FromRGB(0, 0, 0, .5);
        // Get pixel color
        let bgColor;
        if ((px + py) % 2 == 0)
            bgColor = isDarkTheme ? settings.bgColorA : settings.bgColorAlight;
        else
            bgColor = isDarkTheme ? settings.bgColorB : settings.bgColorBlight;
        let drawColor = color.AlphaBlendWith(bgColor);
        drawData[id * 4] = drawColor.r * 255;
        drawData[id * 4 + 1] = drawColor.g * 255;
        drawData[id * 4 + 2] = drawColor.b * 255;
        drawData[id * 4 + 3] = drawColor.a * 255;
    }, cornerX, cornerY, cornerX + settings.pixelSize, cornerY + settings.pixelSize);
}
//# sourceMappingURL=draw.js.map