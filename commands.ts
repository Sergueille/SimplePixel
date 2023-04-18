enum CommandType
{
    function, int, float, color, vec2
}

const control = 1;
const alt = 2;
const shift = 4;

class Command
{
    public static commands = [
        new Command("commandbar", 0, " ", CommandType.function, null, "Focus on command bar", (_) => {
            if (mainInput != document.activeElement)
                mainInput.focus();
            else
                mainInput.value += " "; // Add a space manually, because the shortcut prevents it
        }),
        new Command("hide", 0, "Escape", CommandType.function, null, "Loose focus on command bar, hide panels", (_) => {
            mainInput.blur();
            CloseColorSelector();
            CloseExportPanel();
        }),
        new Command("clear", shift | alt, "N", CommandType.function, null, "Clear image", (_) => {
            CreateImage(imageSizeX, imageSizeY);
        }),
        new Command("imgsize", 0, "", CommandType.vec2, new vec2(50, 50), "Set size of image", (vec) => {
            CreateImage(vec.x, vec.y);
        }),
        new Command("color", 0, "c", CommandType.function, null, "Set the current color", (_) => {
            OpenColorSelector((newColor) => {currentColor = newColor}, currentColor);
        }),
        new Command("altcolor", alt, "c", CommandType.function, null, "Set the alternative color (right click color)", (_) => {
            OpenColorSelector((newColor) => {currentAltColor = newColor}, currentAltColor);
        }),
        new Command("free", 0, "f", CommandType.function, null, "Select free draw tool", (_) => {
            currentTool = Tool.free;
        }),
        new Command("line", 0, "l", CommandType.function, null, "Select line tool", (_) => {
            currentTool = Tool.line;
        }),
        new Command("paintpot", 0, "p", CommandType.function, null, "Select paintpot tool", (_) => {
            currentTool = Tool.paintpot;
        }),
        new Command("pxsize", 0, "", CommandType.int, 16, "Set the screen size of one pixel", (val) => {
            settings.pixelSize = val;
            OnResize();
        }),
        new Command("seth", alt, "h", CommandType.float, 1, "Set the hue of the current color (0 - 1)", (val) => {
            currentColor.SetH(val);
        }),
        new Command("sets", alt, "s", CommandType.float, 1, "Set the saturation of the current color (0 - 1)", (val) => {
            currentColor.SetS(val);
        }),
        new Command("setv", alt, "v", CommandType.float, 1, "Set the value of the current color (0 - 1)", (val) => {
            currentColor.SetV(val);
        }),
        new Command("setr", alt, "r", CommandType.float, 1, "Set the red value of the current color (0 - 1)", (val) => {
            currentColor.r = val;
        }),
        new Command("setg", alt, "g", CommandType.float, 1, "Set the green value of the current color (0 - 1)", (val) => {
            currentColor.g = val;
        }),
        new Command("setb", alt, "b", CommandType.float, 1, "Set the blue value of the current color (0 - 1)", (val) => {
            currentColor.b = val;
        }),
        new Command("seta", alt, "a", CommandType.float, 1, "Set the alpha value of the current color (0 - 1)", (val) => {
            currentColor.a = val;
        }),
        new Command("undo", control, "z", CommandType.function, null, "Undo last action", (_) => {
            Undo();
        }),
        new Command("redo", control, "y", CommandType.function, null, "Redo last action", (_) => {
            Redo();
        }),
        new Command("redoshiftz", control | shift, "Z", CommandType.function, null, "Redo last action, but with ctrl+shift+Z", (_) => {
            Redo();
        }),
        new Command("theme", alt, "t", CommandType.function, null, "Switch between light and dark themes", (_) => {
            SwitchTheme();
        }),
        new Command("export", control, "e", CommandType.function, null, "Export image as a file", (_) => {
            OpenExportPanel();
        }),
    ]

    public name: string;
    public description: string;
    public type: CommandType;
    public modifier: number;
    public key: string;
    public default: any;
    public func: Function;

    public constructor(name, modifier, key, type, defaultValue, description, func)
    {
        this.name = name;
        this.modifier = modifier;
        this.key = key;
        this.type = type;
        this.default = defaultValue;
        this.description = description;
        this.func = func;
    }

    public GetUI(highlight = false) : HTMLElement
    {
        let main = document.createElement("div");
        
        main.classList.add("search-entry");
        if (highlight)        
            main.classList.add("highlight");

        main.innerHTML = `
            <span>${this.name} <span class='command-type'>${this.GetTypeString()}</span></span>
            <span>${this.description}</span>
            ${this.GetHotkeyString()}
        `
        main.addEventListener("click", () => {
            if (this.type == CommandType.function)
            {
                this.Execute(null);
            }
            else 
            {
                mainInput.value = this.name + " ";
                mainInput.focus();
            } 
        });

        return main;
    }

    public Execute(value: any)
    {
        if (value == null) 
            value = this.default 
            
        infoLeft.textContent = `Executing command: ${this.name}`

        this.func(value);

        commandHistory = commandHistory.filter(c => c != this);
        commandHistory.push(this);
    }

    // TODO: better search
    public GetScore(query: string): number
    {
        let words = query.toLowerCase().split(" ");

        let res = 0;
        for (let word of words)
        {
            let trimword = word.trim();
            if (trimword.length == 0) continue;

            if (this.name.includes(trimword))
                res += 10;
            if (this.description.toLowerCase().includes(trimword))
                res += 1;
        }

        return res;
    }

    private GetHotkeyString() : string
    {
        if (this.key == "") return "";

        let res = "";
        if ((this.modifier & control) != 0)
            res += "<span class='key'>Ctrl</span> + "
        if ((this.modifier & shift) != 0)
            res += "<span class='key'>Maj</span> + "
        if ((this.modifier & alt) != 0)
            res += "<span class='key'>Alt</span> + "

        let keyName;
        if (this.key == " ")
            keyName = "Space";
        else if (this.key == "Escape")
            keyName = "Esc";
        else
            keyName = this.key.toUpperCase();

        return `<div class="command-hotkey">${res}<span class='key'>${keyName}</span></div>`
    }

    private GetTypeString() : string
    {
        if (this.type == CommandType.color) return "(Color)";
        if (this.type == CommandType.float) return "(Float)";
        if (this.type == CommandType.int) return "(Int)";
        if (this.type == CommandType.vec2) return "(Vector2)";
        
        return "";
    }
}
