
class TutoralState
{
    public title: string;
    public text: string;
    public btnText: string;
    public btnFunc: Function | undefined;

    public anchorId: string;
    public position: number; // 0: up, 1: right, 2: down, 3: left

    public continueCommand: string;

    public constructor(title: string, text: string, anchorId: string, position: number, continueCommand = "", btnText = "", btnFunc: Function | undefined = undefined)
    {
        this.title = title;
        this.text = text;
        this.btnText = btnText;
        this.btnFunc = btnFunc;
        this.anchorId = anchorId;
        this.position = position;
        this.continueCommand = continueCommand;
    }
}

const tutorial = [
    new TutoralState(
        "Welcome!", 
        "Welcome to simplePixel. This tutorial will show you the basics of the editor.", 
        "tuto-left-anchor",
        1,
        "",
        "Ignore tutorial", () => CloseTutorial(),
    ),
    new TutoralState(
        "Drawing", 
        "Use the left mouse button to draw with your primary color, and the right mouse button to draw with your secondary color.<br>By default, the secondary color is transparent so that it can be used for erasing.<br>Try drawing something before you continue!", 
        "tuto-left-anchor",
        1,
    ),
    new TutoralState(
        "Drawing", 
        "The primary and secondary colors are shown here.", 
        "info-icons",
        0,
    ),
    new TutoralState(
        "Drawing", 
        "You can also change the size of the stroke with the mouse wheel.", 
        "tuto-right-anchor",
        3,
    ),
    new TutoralState(
        "Commands", 
        "To perform other actions, you will have to run a command, usually with a keyboard shortcut.<br>Try to execute [mirrorx].", 
        "tuto-right-anchor",
        3,
        "mirrorx"
    ),
    new TutoralState(
        "Commands", 
        "Your image has been mirrored!<br>But if you forgot the keyboard shortcut for your command, don't panic! Press <span class='key'>Space</span>!", 
        "tuto-right-anchor",
        3,
        "commandbar",
    ),
    new TutoralState(
        "Commands", 
        "Search \"turn\" and press <span class='key'>Enter</span>.", 
        "main-input",
        1,
        "turn",
    ),
    new TutoralState(
        "Tools", 
        "You can change the current tool with these commands:<br>- [free] Draw freely (default)<br>- [line] Draw line<br>- [rect] Draw rect<br>- [paintpot] Fill area with same color<br>", 
        "tuto-left-anchor",
        1,
    ),
    new TutoralState(
        "Colors", 
        "To change the color, use [color]", 
        "tuto-left-anchor",
        1,
        "color"
    ),
    new TutoralState(
        "Colors", 
        "Now select a nice color!", 
        "color-select",
        1,
    ),
    new TutoralState(
        "Colors", 
        "Complete this masterpiece!", 
        "tuto-left-anchor",
        1,
    ),
    new TutoralState(
        "Colors", 
        "To reuse a previous color, use the color picker, with [colorpicker].", 
        "tuto-left-anchor",
        1,
        "colorpicker"
    ),
    new TutoralState(
        "Colors", 
        "Select a color on the image with your mouse", 
        "tuto-left-anchor",
        1,
    ),
    new TutoralState(
        "Undo", 
        "Mmm... The last change you made doesn't seem right. Undo it with [undo]", 
        "tuto-left-anchor",
        1,
        "undo"
    ),
    new TutoralState(
        "Undo", 
        "No, it was not so bad after all, redo it with [redo]", 
        "tuto-left-anchor",
        1,
        "redo"
    ),
    new TutoralState(
        "Saving", 
        "This is beautiful! Save this masterpiece on your computer with [export].", 
        "tuto-left-anchor",
        1,
        "export"
    ),
    new TutoralState(
        "Saving", 
        "Select export options and click export.", 
        "tuto-left-anchor",
        1,
    ),
    new TutoralState(
        "Saving", 
        "To continue your work the next time you come, you can:<br>- Load a file with [open]<br>- Open a recent file in the editor with [recent]", 
        "tuto-left-anchor",
        1,
    ),
    new TutoralState(
        "Commands with parameters", 
        "Some commands needs a parameter.<br>Press <span class='key'>Space</span>", 
        "tuto-left-anchor",
        1,
        "commandbar",
    ),
    new TutoralState(
        "Commands with parameters", 
        "Search imgsize.<br>This commands needs one or two numbers, so enter 'imgsize 50' to get a larger canvas", 
        "main-input",
        1,
        "imgsize",
    ),
    new TutoralState(
        "Commands with parameters", 
        "Perfect! You can zoom out with <span class='key>Ctrl</span> + <span class='key>Mouse wheel</span>", 
        "tuto-left-anchor",
        1,
    ),
    new TutoralState(
        "Other commands", 
        "We're almost done!<br>Here are some other important commands to know:<br>- [copy] and [paste]<br>- [grid] and [nogrid] to display a grid<br>- [theme] to change the editor's theme", 
        "tuto-left-anchor",
        1,
    ),
    new TutoralState(
        "Congratulations", 
        "The tutorial is finished!", 
        "tuto-left-anchor",
        1,
    ),
]

const continueBtnTexts = [
    "Continue", "Next", "Okay", "Next step"
]

const tutorialMargin = 10; // Margin btw panel and anchor, in px

let tutorialActive = true;
let currentTutorialStateId = 0;
let currentTutorialState = tutorial[currentTutorialStateId];

let forceTutorialCommand = "";

setInterval(UpdateTutorialPosition, 20);

function InitTutorial() {
    // TODO: ignore if completed

    tutoHighlight.style.display = "none"; // Remove highlight
    UpdateTutoralPanel();
}

function UpdateTutoralPanel() {
    currentTutorialState = tutorial[currentTutorialStateId];

    tutoTitle.innerHTML = currentTutorialState.title;

    // Replace command names in text
    let newText = "";
    let match: RegExpExecArray | null = null;
    let lastMatch: any = null;
    let regex = /\[[^\[\]]+\]/gm;

    while (true)
    {
        match = regex.exec(currentTutorialState.text)!!;
        
        if (match == null) break;

        console.log(match, lastMatch);
        
        let command = GetCommandByName(match[0].slice(1, -1))!!;
        let commandText = `<span class="tuto-command">${command.name}<span> (${command.GetHotkeyString()})`;
        newText += currentTutorialState.text.slice(lastMatch == null ? 0 : lastMatch.index + lastMatch[0].length, match.index);
        newText += commandText;

        lastMatch = match;
    }

    if (lastMatch != null)
        newText += currentTutorialState.text.slice(lastMatch.index + lastMatch[0].length, currentTutorialState.text.length);
    else
        newText = currentTutorialState.text;
        
    tutoText.innerHTML = newText;

    // Progress bar
    let progress = currentTutorialStateId / (tutorial.length - 1);
    tutoProgressFill.style.width = `${Math.round(progress * 100)}%`;

    tutoButtonsContainer.innerHTML = "";
    if (currentTutorialState.continueCommand == "") // Continue button
    {
        let continueBtn = document.createElement("button");

        let text = currentTutorialStateId == tutorial.length - 1 
            ? "Close"
            : continueBtnTexts[Math.floor(Math.random() * continueBtnTexts.length)];

        continueBtn.innerText = text;
        continueBtn.addEventListener("click", NextTutorialStep);

        tutoButtonsContainer.appendChild(continueBtn);
    }
    else // Command to continue
    {
        // TODO        
    }

    if (currentTutorialState.btnText != "" && currentTutorialState.btnFunc != undefined) // Secondary button
    {
        let btn = document.createElement("button");
        btn.innerText = currentTutorialState.btnText;
        btn.addEventListener("click", () => currentTutorialState.btnFunc!());

        tutoButtonsContainer.appendChild(btn);
    }

    // Commands
    forceTutorialCommand = currentTutorialState.continueCommand;
}

function UpdateTutorialPosition()
{
    if (!tutorialActive) return;

    let anchor = document.getElementById(currentTutorialState.anchorId)!!;
    let rect = anchor.getBoundingClientRect();
    let sizeX = tutoPanel.clientWidth;
    let sizeY = tutoPanel.clientHeight

    let left = 0;
    let top = 0;
    if (currentTutorialState.position == 0) // Up
    {
        left = (rect.left + rect.right) / 2 - (sizeX / 2);
        top = rect.top - tutorialMargin - sizeY;
    }
    else if (currentTutorialState.position == 1) // Right
    {
        left = rect.right + tutorialMargin;
        top = (rect.bottom + rect.top) / 2 - (sizeY / 2);
    }
    else if (currentTutorialState.position == 2) // Down
    {
        left = (rect.left + rect.right) / 2 - (sizeX / 2);
        top = rect.bottom + tutorialMargin;
    }
    else if (currentTutorialState.position == 3) // Left
    {
        left = rect.left - tutorialMargin - sizeX;
        top = (rect.bottom + rect.top) / 2 - (sizeY / 2);
    }

    left = Math.max(tutorialMargin, left);
    left = Math.min(window.innerWidth - sizeX - tutorialMargin, left);
    top = Math.max(tutorialMargin, top);
    top = Math.min(window.innerHeight - sizeY - tutorialMargin, top);

    tutoPanel.style.left = left + "px";
    tutoPanel.style.top = top + "px";

    if (rect.width != 0 || rect.height != 0)
    {
        tutoHighlight.style.display = "block";
        tutoHighlight.style.left = rect.left + "px";
        tutoHighlight.style.top = rect.top + "px";
        tutoHighlight.style.width = rect.width + "px";
        tutoHighlight.style.height = rect.height + "px";
    }
    else
    {
        tutoHighlight.style.display = "none";
    }
}

function NextTutorialStep() {
    currentTutorialStateId++;

    if (currentTutorialStateId == tutorial.length) 
        CloseTutorial();
    else
        UpdateTutoralPanel();
}

function CloseTutorial() {
    tutoPanel.classList.add("hidden");
    tutorialActive = false;
}
