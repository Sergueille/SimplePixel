let fileHistory;
let currentEntry;
let registerNewEntry = false;
function InitHistory() {
    if (localStorage.getItem("history") == null) {
        fileHistory = [];
    }
    else {
        fileHistory = JSON.parse(localStorage.getItem("history"));
        for (let i = 0; i < fileHistory.length; i++) {
            Object.setPrototypeOf(fileHistory[i], HistoryEntry.prototype);
            for (let j = 0; j < fileHistory[i].data.length; j++) {
                Object.setPrototypeOf(fileHistory[i].data[j], Color.prototype);
            }
        }
    }
    registerNewEntry = true;
}
function SaveHistory() {
    currentEntry = HistoryEntry.Get();
    // Don't save if image is empty
    if (currentEntry.data.every(color => color.a < 0.01))
        return;
    if (registerNewEntry || fileHistory.length == 0) // Add new entry
     {
        fileHistory.push(currentEntry);
        registerNewEntry = false;
    }
    else // Replace last entry
     {
        fileHistory[fileHistory.length - 1] = currentEntry;
    }
    localStorage.setItem("history", JSON.stringify(fileHistory));
}
function CreateNewEntry() {
    registerNewEntry = true;
    SaveHistory();
}
function OpenRecentPanel() {
    recentPanel.classList.remove("hidden");
    UpdateRecentFilesUI();
}
function CloseRecentPanel() {
    recentPanel.classList.add("hidden");
}
function UpdateRecentFilesUI() {
    recentList.innerText = "";
    for (let entry of fileHistory) {
        let ui = document.createElement("div");
        ui.classList.add("recent-entry");
        let closureEntry = entry;
        ui.addEventListener("click", () => {
            closureEntry.Set();
            CreateNewEntry();
            CloseRecentPanel();
        });
        let date = document.createElement("span");
        date.innerText = entry.date.toLocaleString();
        let canvas = document.createElement("canvas");
        canvas.classList.add("alpha-bg");
        // TODO: draw canvas
        ui.appendChild(canvas);
        ui.appendChild(date);
        recentList.appendChild(ui);
    }
}
function ClearHistory() {
    fileHistory = [];
    SaveHistory();
}
//# sourceMappingURL=history.js.map