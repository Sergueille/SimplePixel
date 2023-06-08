let undoStack;
let undoPosition;
function InitUndo() {
    // First image is created by the first CreateImage()
    undoStack = [];
    undoPosition = -1;
    let saved = localStorage.getItem("undoMaxEntries");
    settings.maxUndoEntries = saved == null ? 200 : parseInt(saved);
}
function RecordUndo() {
    if (undoPosition + 1 < undoStack.length)
        undoStack = undoStack.slice(0, undoPosition + 1);
    undoStack.push(ImageState.Get());
    undoPosition++;
    while (undoStack.length > settings.maxUndoEntries) {
        undoStack.shift();
        undoPosition--;
    }
    SaveHistory();
}
function Undo() {
    if (undoPosition <= 0)
        return;
    undoPosition--;
    undoStack[undoPosition].Set();
}
function Redo() {
    if (undoPosition >= undoStack.length - 1)
        return;
    undoPosition++;
    undoStack[undoPosition].Set();
}
//# sourceMappingURL=undo.js.map