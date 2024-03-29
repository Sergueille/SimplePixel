let currentSearchResultUIs = [];
let currentSearchResultCommands = [];
let selectedSearchEntryIndex = -1;
function OnSearchFocus() {
    UpdateSearchResults();
    mainInput.select();
    searchResults.classList.remove("hidden");
    ToggleTabindexRecursive(searchResults, true);
}
function OnSearchBlur() {
    setTimeout(() => {
        if (mainInput == document.activeElement)
            return;
        searchResults.classList.add("hidden");
    }, 200);
    ToggleTabindexRecursive(searchResults, false);
}
function OnSearchChange() {
    UpdateSearchResults();
    selectedSearchEntryIndex = -1; // Reset selection
}
function OnSearchKey(event) {
    if (selectedSearchEntryIndex > -1) {
        currentSearchResultUIs[selectedSearchEntryIndex].classList.remove("selected");
    }
    // Move selected
    if (event.key == "ArrowUp" && selectedSearchEntryIndex < currentSearchResultUIs.length - 1)
        selectedSearchEntryIndex++;
    if (event.key == "ArrowDown" && selectedSearchEntryIndex > -1)
        selectedSearchEntryIndex--;
    if (selectedSearchEntryIndex > -1) {
        currentSearchResultUIs[selectedSearchEntryIndex].classList.add("selected");
        mainInput.value = currentSearchResultCommands[selectedSearchEntryIndex].name + " ";
        // Using setTimeout because cursor will be displayed incorrectly otherwise
        setTimeout(() => mainInput.setSelectionRange(mainInput.value.length, mainInput.value.length), 0);
    }
    if (event.key == "Enter") {
        ParseCommand(mainInput.value);
    }
}
function ParseCommand(content) {
    let values = content.split(" ");
    let command = GetCommandByName(values[0]);
    if (command == null) {
        infoLeft.textContent = "Invalid command name!";
    }
    else {
        let ok = true;
        let parameter = null;
        if (command.type != CommandType.function) {
            if (values.length < 2) {
                infoLeft.textContent = "You need to specify an argument for this command! Example: commandname [argument]";
                ok = false;
            }
            else {
                if (command.type == CommandType.int)
                    [parameter, ok] = TryParseInt(values[1]);
                if (command.type == CommandType.float)
                    [parameter, ok] = TryParseFloat(values[1]);
                if (command.type == CommandType.vec2) {
                    if (values.length == 2) {
                        let val;
                        [val, ok] = TryParseInt(values[1]);
                        parameter = new vec2(val, val);
                    }
                    else if (values.length == 3) {
                        let x, y;
                        [x, ok] = TryParseInt(values[1]);
                        [y, ok] = TryParseInt(values[2]);
                        parameter = new vec2(x, y);
                    }
                    else {
                        infoLeft.textContent = "You need to specify a vector 2 argument for this command! Example: commandname [x] [y]";
                        ok = false;
                    }
                }
            }
        }
        if (ok) {
            command.Execute(parameter);
        }
    }
    mainInput.blur();
}
function OnKeyPressed(event) {
    let modifier = (event.altKey ? 1 : 0) * alt
        + (event.ctrlKey ? 1 : 0) * control
        + (event.shiftKey ? 1 : 0) * shift;
    let focusedOnInput = document.activeElement instanceof HTMLInputElement;
    if (modifier == 0 && focusedOnInput && event.key != "Escape")
        return;
    let command = GetCommandByHotkey(modifier, event.key.toLowerCase());
    if (command != null) {
        if (command.type == CommandType.function) {
            command.Execute(null);
        }
        else {
            mainInput.value = command.name + " ";
            mainInput.focus();
            setTimeout(() => mainInput.selectionStart = mainInput.value.length, 0);
        }
        event.preventDefault();
    }
}
function UpdateSearchResults() {
    searchResults.innerHTML = "";
    let sortList;
    if (mainInput.value.trim().length == 0) {
        sortList = commandHistory;
        sortList.reverse();
    }
    else {
        sortList = [...Command.commands];
        sortList.sort((a, b) => b.GetScore(mainInput.value) - a.GetScore(mainInput.value));
        sortList = sortList.filter(command => command.GetScore(mainInput.value) > 0);
        if (sortList.length == 0) {
            searchResults.innerHTML = `
                <div class="search-entry">There are no commands matching this query :(</div>
            `;
        }
    }
    currentSearchResultUIs = [];
    currentSearchResultCommands = [];
    for (let i = settings.maxSearchResults - 1; i >= 0; i--) {
        if (i < sortList.length) {
            let ui = sortList[i].GetUI(i == 0);
            searchResults.appendChild(ui);
            currentSearchResultUIs.unshift(ui);
            currentSearchResultCommands.unshift(sortList[i]);
        }
    }
}
function GetCommandByName(searchName) {
    for (let command of Command.commands) {
        if (command.name == searchName)
            return command;
    }
    return null;
}
function GetCommandByHotkey(modifier, key) {
    for (let command of Command.commands) {
        if (command.modifier == modifier && command.key.toLowerCase() == key.toLowerCase())
            return command;
    }
    return null;
}
function TryParseInt(text) {
    let res = parseInt(text, 10);
    if (isNaN(res))
        infoLeft.textContent = "Invalid integer!";
    return [res, !isNaN(res)];
}
function TryParseFloat(text) {
    let res = parseFloat(text);
    if (isNaN(res))
        infoLeft.textContent = "Invalid float!";
    return [res, !isNaN(res)];
}
//# sourceMappingURL=search.js.map