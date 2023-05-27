function GetRectSize(minX, minY, maxX, maxY) {
    return [Math.abs(minX - maxX), Math.abs(minY - maxY)];
}
function IterateThroughRect(func, minX, minY, maxX, maxY) {
    let [sx, sy] = GetRectSize(minX, minY, maxX, maxY);
    let actualMinX = Math.min(minX, maxX);
    let actualMinY = Math.min(minY, maxY);
    for (let x = 0; x < sx; x++) {
        for (let y = 0; y < sy; y++) {
            func(x, y, x + actualMinX, y + actualMinY);
        }
    }
}
//# sourceMappingURL=util.js.map