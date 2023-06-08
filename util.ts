
function GetRectSize(minX: number, minY: number, maxX: number, maxY: number)
{
    return [Math.abs(minX - maxX) + 1, Math.abs(minY - maxY) + 1];
}

type RectFunction = (x: number, y: number, coordX: number, coordY: number) => void;
function IterateThroughRect(func: RectFunction, minX: number, minY: number, maxX: number, maxY: number)
{
    let [sx, sy] = GetRectSize(minX, minY, maxX, maxY);
    let actualMinX = Math.min(minX, maxX);
    let actualMinY = Math.min(minY, maxY);

    for (let y = 0; y < sy; y++)
    {
        for (let x = 0; x < sx; x++)
        {
            func(x, y, x + actualMinX, y + actualMinY);
        }
    }
}

function ToggleTabindexRecursive(parent: Element, value: boolean)
{
    if (value) {
        parent.removeAttribute("tabindex");
    }
    else {
        parent.setAttribute("tabindex", "-1");
    }

    console.log(value ? "enable" : "disable");

    for (let child of parent.children) {
        ToggleTabindexRecursive(child, value);
    }
}
