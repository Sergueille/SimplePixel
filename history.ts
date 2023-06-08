let fileHistory: HistoryEntry[];
let currentEntry: HistoryEntry;
let registerNewEntry = false;

function InitHistory()
{
    if (localStorage.getItem("history") == null)
    {
        fileHistory = [];
    }
    else
    {
        fileHistory = JSON.parse(localStorage.getItem("history")!!);

        for (let i = 0; i < fileHistory.length; i++)
        {
            Object.setPrototypeOf(fileHistory[i], HistoryEntry.prototype);

            for (let j = 0; j < fileHistory[i].data.length; j++)
            {   
                Object.setPrototypeOf(fileHistory[i].data[j], Color.prototype);
            }
        }
    }

    registerNewEntry = true;
}

function SaveHistory()
{
    currentEntry = HistoryEntry.Get();

    // Don't save if image is empty
    if (currentEntry.data.every(color => color.a < 0.01)) return;

    if (registerNewEntry || fileHistory.length == 0) // Add new entry
    {
        fileHistory.push(currentEntry);
        registerNewEntry = false;
    }
    else // Replace last entry
    {
        fileHistory[fileHistory.length - 1] = currentEntry;
    }

    if (fileHistory.length > maxHistoryEntries)
    {
        fileHistory.shift();
    }

    localStorage.setItem("history", JSON.stringify(fileHistory));
}

function CreateNewHistoryEntry()
{
    registerNewEntry = true;
    SaveHistory();
}

function OpenRecentPanel()
{
    recentPanel.classList.remove("hidden");
    ToggleTabindexRecursive(recentPanel, true);

    UpdateRecentFilesUI();
}

function CloseRecentPanel()
{
    recentPanel.classList.add("hidden");
    ToggleTabindexRecursive(recentPanel, false);
}

function UpdateRecentFilesUI()
{
    recentList.innerText = "";

    if (fileHistory.length == 0)
    {
        recentList.innerText = "No files here :("
        return;
    }

    for (let entry of fileHistory)
    {
        let ui = document.createElement("div");
        ui.classList.add("recent-entry");
        
        let closureEntry = entry;
        ui.addEventListener("click", () => {
            closureEntry.Set();
            CreateNewHistoryEntry();
            CloseRecentPanel();
        });

        let date = document.createElement("span");
        date.innerText = new Date(entry.date).toLocaleString();

        let canvas = document.createElement("canvas");
        canvas.classList.add("alpha-bg");
        canvas.width = 100;
        canvas.height = 100;

        let ctx = canvas.getContext("2d")!!;
        let pxSize = Math.min(canvas.width / entry.sizeX, canvas.height / entry.sizeY);
        let cornerX = (canvas.width - entry.sizeX * pxSize) / 2;
        let cornerY = (canvas.height - entry.sizeY * pxSize) / 2;

        IterateThroughRect((x, y) => {
            ctx.fillStyle = entry.data[x + y * entry.sizeX].GetHex();
            ctx.fillRect(cornerX + x * pxSize, cornerY + y * pxSize, pxSize, pxSize);
        }, 0, 0, entry.sizeX - 1, entry.sizeY - 1)

        ui.appendChild(canvas);
        ui.appendChild(date);

        recentList.appendChild(ui);
    }
}

function ClearHistory()
{
    fileHistory = [];
    SaveHistory();
}
