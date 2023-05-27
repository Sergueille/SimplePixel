
function GetRectSize(minX: number, minY: number, maxX: number, maxY: number)
{
    return [Math.abs(minX - maxX), Math.abs(minY - maxY)];
}

type RectFunction = (x: number, y: number, coordX: number, coordY: number) => void;
function IterateThroughRect(func: RectFunction, minX: number, minY: number, maxX: number, maxY: number)
{
    let [sx, sy] = GetRectSize(minX, minY, maxX, maxY);
    let actualMinX = Math.min(minX, maxX);
    let actualMinY = Math.min(minY, maxY);

    for (let x = 0; x < sx; x++)
    {
        for (let y = 0; y < sy; y++)
        {
            func(x, y, x + actualMinX, y + actualMinY);
        }
    }
}
