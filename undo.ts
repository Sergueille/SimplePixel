
let undoStack: Color[][];
let undoPosition: number

function InitUndo()
{
    // First image is created by the first CreateImage()
    undoStack = [];
    undoPosition = -1;
}

function RecordUndo()
{
    if (undoPosition + 1 < undoStack.length)
        undoStack = undoStack.slice(0, undoPosition + 1);

    undoStack.push([...imageData]);
    undoPosition++;
}

function Undo()
{
    if (undoPosition <= 0) return;

    undoPosition--;
    imageData = [...undoStack[undoPosition]];

    Draw();
}

function Redo()
{
    if (undoPosition >= undoStack.length - 1) return;

    undoPosition++;
    imageData = [...undoStack[undoPosition]];

    Draw();
}
