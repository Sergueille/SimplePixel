function GetRectSize(minX, minY, maxX, maxY) {
    return [Math.abs(minX - maxX) + 1, Math.abs(minY - maxY) + 1];
}
function IterateThroughRect(func, minX, minY, maxX, maxY) {
    let [sx, sy] = GetRectSize(minX, minY, maxX, maxY);
    let actualMinX = Math.min(minX, maxX);
    let actualMinY = Math.min(minY, maxY);
    for (let y = 0; y < sy; y++) {
        for (let x = 0; x < sx; x++) {
            func(x, y, x + actualMinX, y + actualMinY);
        }
    }
}
function ToggleTabindexRecursive(parent, value) {
    if (value) {
        parent.removeAttribute("tabindex");
    }
    else {
        parent.setAttribute("tabindex", "-1");
    }
    for (let child of parent.children) {
        ToggleTabindexRecursive(child, value);
    }
}
//# sourceMappingURL=util.js.map