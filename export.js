function OpenExportPanel() {
    exportPanel.classList.remove("hidden");
    UpdateExportInputs();
}
function CloseExportPanel() {
    exportPanel.classList.add("hidden");
}
function UpdateExportInputs() {
    SetCheckboxEnabled(exportTile, useGrid, false);
    SetCheckboxEnabled(exportCropAlpha, !exportTile.checked, false);
}
function ExportImage() {
    // Alpha cropping
    let sizeX = imageSizeX;
    let sizeY = imageSizeY;
    let startX = 0;
    let startY = 0;
    if (exportCropAlpha.checked) {
        let minX = imageSizeX;
        let maxX = 0;
        let minY = imageSizeY;
        let maxY = 0;
        for (let x = 0; x < imageSizeX; x++) {
            for (let y = 0; y < imageSizeY; y++) {
                if (imageData[x + imageSizeX * y].a > 0.01) {
                    minX = Math.min(x, minX);
                    maxX = Math.max(x, maxX);
                    minY = Math.min(y, minY);
                    maxY = Math.max(y, maxY);
                }
            }
        }
        console.log(minX, maxX, minY, maxY);
        if (minX <= maxX && minY <= maxY) {
            startX = minX;
            startY = minY;
            sizeX = maxX - minX + 1;
            sizeY = maxY - minY + 1;
        }
    }
    // Grid tiles
    if (exportTile.checked) {
        let i = 0;
        for (let x = 0; x <= imageSizeX - gridSizeX; x += gridSizeX) {
            for (let y = 0; y <= imageSizeY - gridSizeY; y += gridSizeY) {
                if (!IsRectEmpty(x, gridSizeX, y, gridSizeY))
                    ExportRect(x, gridSizeX, y, gridSizeY, i);
                i++;
            }
        }
    }
    else {
        ExportRect(startX, sizeX, startY, sizeY);
    }
    CloseExportPanel();
}
function ExportRect(startX, sizeX, startY, sizeY, number = -1) {
    let canvas = document.createElement("canvas");
    canvas.width = sizeX;
    canvas.height = sizeY;
    let ctx = canvas.getContext("2d");
    for (let x = 0; x < sizeX; x++) {
        for (let y = 0; y < sizeY; y++) {
            ctx.fillStyle = imageData[(x + startX) + imageSizeX * (y + startY)].GetHex();
            ctx.fillRect(x, y, 1, 1);
        }
    }
    let mime = "";
    if (exportFormatSelect.value == "0")
        mime = "image/png";
    if (exportFormatSelect.value == "1")
        mime = "image/jpeg";
    if (exportFormatSelect.value == "2")
        mime = "image/webp";
    if (exportFormatSelect.value == "3")
        mime = "image/gif";
    let url = canvas.toDataURL(mime);
    var a = document.createElement('a');
    if (number < 0)
        a.download = exportFilename.value;
    else
        a.download = exportFilename.value + "_" + number.toString();
    a.href = url;
    a.click();
    a.remove();
    canvas.remove();
}
function IsRectEmpty(startX, sizeX, startY, sizeY) {
    for (let x = startX; x < startX + sizeX; x++) {
        for (let y = startY; y < startY + sizeY; y++) {
            if (imageData[x + y * imageSizeX].a > 0.005)
                return false;
        }
    }
    return true;
}
function SetInputEnabled(input, enabled, defaultValue) {
    input.readOnly = !enabled;
    input.classList.toggle("disabled", !enabled);
    input.parentElement?.classList.toggle("disabled", !enabled);
    if (!enabled) {
        input.value = defaultValue;
    }
}
function SetCheckboxEnabled(input, enabled, defaultValue) {
    input.disabled = !enabled;
    input.classList.toggle("disabled", !enabled);
    input.parentElement?.classList.toggle("disabled", !enabled);
    if (!enabled) {
        input.checked = defaultValue;
    }
}
//# sourceMappingURL=export.js.map