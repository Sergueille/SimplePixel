function OpenExportPanel() {
    exportPanel.classList.remove("hidden");
}
function CloseExportPanel() {
    exportPanel.classList.add("hidden");
}
function ExportImage() {
    let canvas = document.createElement("canvas");
    canvas.width = imageSizeX;
    canvas.height = imageSizeY;
    let ctx = canvas.getContext("2d");
    for (let x = 0; x < imageSizeX; x++) {
        for (let y = 0; y < imageSizeY; y++) {
            ctx.fillStyle = imageData[x + imageSizeX * y].GetHex();
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
    a.download = "pixel";
    a.href = url;
    a.click();
    a.remove();
    canvas.remove();
    CloseExportPanel();
}
//# sourceMappingURL=export.js.map