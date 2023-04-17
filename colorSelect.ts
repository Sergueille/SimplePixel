const decimals = 2;

let colorSelectCallback: Function;
let color: Color;
let viewContext: CanvasRenderingContext2D ;

function OpenColorSelector(colorCallback: Function, auto: Color | null = null)
{
    colorSelect.classList.remove("hidden");
    colorSelectCallback = colorCallback;
    viewContext = colorSelectView.getContext("2d")!!;

    if (auto == null) color = Color.FromRGB(1, 1, 1);
    else color = auto!!;

    SetColor(color);

    colorSelectHexInput.focus();
    colorSelectHexInput.select();  
}

function CloseColorSelector()
{
    (document.activeElement as any).blur();
    colorSelect.classList.add("hidden");
}

function OnSelectViewClick(event: MouseEvent)
{
    if (!mouseLeft) return;

    let rect = colorSelectView.getBoundingClientRect();
    let hue = (event.clientX - rect.x) / rect.width;
    let saturation = (event.clientY - rect.y) / rect.height;
    SetColor(Color.FromHSV(hue, saturation, color.GetV(), color.a));

    colorSelectKnob.style.left = (hue * 300 - 3).toString();
    colorSelectKnob.style.top = (saturation * 300 - 3).toString();
}

function SetColor(newColor: Color)
{
    color = newColor;

    colorSelectCallback(color);

    if (colorSelectHexInput != document.activeElement)
        colorSelectHexInput.value = color.GetHex(false, false);

    colorSelectHInput.value = GetFloatText(color.GetH());
    colorSelectSInput.value = GetFloatText(color.GetS());
    colorSelectVInput.value = GetFloatText(color.GetV());
    colorSelectAInput.value = GetFloatText(color.a);
    colorSelectSlider.value = GetFloatText(color.GetV());
    colorSelectAlphaSlider.value = GetFloatText(color.a);
    colorSelectPreview.style.backgroundColor = color.GetHex();

    let value1color = color.Copy().SetV(1);
    let a1color = color.Copy();
    a1color.a = 1;
    let a0color = color.Copy();
    a0color.a = 0;
    let black = Color.FromRGB(0, 0, 0, color.a);

    colorSelectSlider.style.setProperty("--color-a", black.GetHex());
    colorSelectSlider.style.setProperty("--color-b", value1color.GetHex());
    colorSelectAlphaSlider.style.setProperty("--color-a", a0color.GetHex());
    colorSelectAlphaSlider.style.setProperty("--color-b", a1color.GetHex());

    DrawView();
}

function GetFloatText(value: number) : string
{
    return (Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals)).toString();
}

function DrawView()
{
    let value = color.GetV();
    const pixelSize = 3;

    for (let s = 0; s < 1; s += pixelSize / 300)
    {
        for (let h = 0; h < 1; h += pixelSize / 300)
        {
            viewContext.fillStyle = Color.FromHSV(h, s, value).GetHex();
            viewContext.fillRect(h * 300, s * 300, pixelSize, pixelSize);
        }
    }
}
