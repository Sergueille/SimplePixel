
let undoStack: UndoEntry[];
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

    undoStack.push(UndoEntry.Get());
    undoPosition++;
}

function Undo()
{
    if (undoPosition <= 0) return;

    undoPosition--;
    undoStack[undoPosition].Set();
}

function Redo()
{
    if (undoPosition >= undoStack.length - 1) return;

    undoPosition++;
    undoStack[undoPosition].Set();
}

class UndoEntry
{
    public data: Color[];
    public sizeX: number;
    public sizeY: number;

    public static Get() : UndoEntry
    {
        let res = new UndoEntry();
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
