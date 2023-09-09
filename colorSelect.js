const decimals = 2;
let colorSelectCallback;
let color;
let viewContext;
function OpenColorSelector(colorCallback, auto = null) {
    colorSelect.classList.remove("hidden");
    colorSelectCallback = colorCallback;
    viewContext = colorSelectView.getContext("2d");
    if (auto == null)
        color = Color.FromRGB(1, 1, 1);
    else
        color = auto.Copy();
    SetColor(color);
    setTimeout(() => {
        if (!colorSelect.classList.contains("hidden")) {
            colorSelectHexInput.focus();
            colorSelectHexInput.select();
        }
    }, 200);
    ToggleTabindexRecursive(colorSelect, true);
}
function CloseColorSelector() {
    document.activeElement.blur();
    colorSelect.classList.add("hidden");
    ToggleTabindexRecursive(colorSelect, false);
}
function OnSelectViewClick(event) {
    if (!mouseLeft)
        return;
    let rect = colorSelectView.getBoundingClientRect();
    let hue = (event.clientX - rect.x) / rect.width;
    let saturation = (event.clientY - rect.y) / rect.height;
    SetColor(Color.FromHSV(hue, saturation, color.GetV(), color.a));
}
function SetColor(newColor) {
    color = newColor;
    colorSelectCallback(color);
    if (colorSelectHexInput != document.activeElement)
        colorSelectHexInput.value = color.GetHex(false, false);
    let setInput = (input, value) => {
        if (document.activeElement == input)
            return; // User is writing
        if (parseFloat(input.value) == value)
            return; // Already same value in a different format, don't need to change
        input.value = GetFloatText(value);
    };
    setInput(colorSelectHInput, color.GetH());
    setInput(colorSelectSInput, color.GetS());
    setInput(colorSelectVInput, color.GetV());
    setInput(colorSelectAInput, color.a);
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
    // Update knob position
    colorSelectKnob.style.left = (color.GetH() * 300 - 3).toString();
    colorSelectKnob.style.top = (color.GetS() * 300 - 3).toString();
    DrawView();
}
function GetFloatText(value) {
    return (Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals)).toString();
}
function DrawView() {
    let value = color.GetV();
    const pixelSize = 3;
    for (let s = 0; s < 1; s += pixelSize / 300) {
        for (let h = 0; h < 1; h += pixelSize / 300) {
            viewContext.fillStyle = Color.FromHSV(h, s, value).GetHex();
            viewContext.fillRect(h * 300, s * 300, pixelSize, pixelSize);
        }
    }
}
function HandleColorInput(event, setFunc) {
    let input = (event.target);
    let value = parseFloat(input.value);
    if (isNaN(value))
        return;
    if (value < 0 || value > 1)
        return;
    setFunc(value);
    SetColor(color);
}
//# sourceMappingURL=colorSelect.js.map