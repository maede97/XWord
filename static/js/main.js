var socket = io();

var puzzleSize;
var direction = 0; // left to rigth, 1 for top-down

// SOCKET IO STUFF
// Connect
socket.on('connect', function () {
    socket.emit('connection');
});

// Disconnect
socket.on('disconnect', function () {
    socket.emit('disconnection')
});

// num. users
socket.on('get-online-people', function (data) {
    $("#online-users").text(data["online-users"])
});

var serverStore = function () {
    socket.emit('server-store');
}

var serverLoad = function () {
    socket.emit('server-load');
}

var getID = function (i, j) {
    return i + "-" + j;
}

var deleteAllFocusAddThis = function (e) {
    $(".puzzle-field.selected").each(function (index) { $(this).removeClass("selected"); });
    $(e).addClass("selected");
}

var getDivString = function (i, j) {
    return "<div class='puzzle-field col-md-auto justify-content-md-center grid-item' id='" +
        getID(i, j) + "'\
        contenteditable='true' src-row='" + i + "' src-col='" + j + "' src-circl='0' tabindex='" + (i * puzzleSize + j) + "' style='grid-column:"
        + j + "; grid-row:" + i + "' onfocusin='deleteAllFocusAddThis(this)'><span class='char'> </span></div>";
}

var focusSelected = function () {
    $(".puzzle-field.selected").each(function (index) {
        $(this).focus();
    });
}

var keyPressFunc = function (event) {
    var keyCode = event.keyCode || event.which;
    if (keyCode >= 96 && keyCode <= 105) {
        // Numpad keys
        keyCode -= 48;
    }
    let key = String.fromCharCode(keyCode);

    let i = parseInt($(event.currentTarget).attr("src-row"));
    let j = parseInt($(event.currentTarget).attr("src-col"));
    if (key.match(/[0-9]/)) {
        // add small number to cell
        var attr = $("#" + getID(i, j)).attr("src-number");
        if (attr) {
            var length = attr.length;
            if (length > 0) {
                let number = attr.split("-")[1];
                number += key;
                $(event.currentTarget).removeClass(attr);
                $(event.currentTarget).addClass("number-" + number);
                $(event.currentTarget).attr("src-number", "number-" + number);
            }
        } else {
            let number = key;
            $(event.currentTarget).addClass("number-" + number);
            $(event.currentTarget).attr("src-number", "number-" + number);
        }

        sendBoard();

        event.preventDefault();
        return;
    }
    if (key.match(/[a-zA-Z#\s]/)) {
        $(event.currentTarget).children(".char").text(key.toUpperCase());

        event.preventDefault();
        // move one in direction and call focus.

        sendBoard();
        if (direction == 0) {
            // horizontal, keep i
            if (j == puzzleSize) {
                return;
            } else {
                $("#" + getID(i, (j + 1))).focus();
            }
        } else {
            if (i == puzzleSize) {
                return;
            } else {
                $("#" + getID((i + 1), j)).focus();
            }
        }
    } else {
        event.preventDefault();
        // check event key for arrow key and move focus
        switch (event.keyCode) {
            case 37:
                if (j == 1) {
                    return;
                } else {
                    $("#" + getID(i, (j - 1))).focus();
                }
                break;
            case 38:
                if (i == 1) {
                    return;
                } else {
                    $("#" + getID((i - 1), j)).focus();
                }
                break;
            case 39:
                if (j == puzzleSize) {
                    return;
                } else {
                    $("#" + getID(i, (j + 1))).focus();
                }
                break;
            case 40:
                if (i == puzzleSize) {
                    return;
                } else {
                    $("#" + getID((i + 1), j)).focus();
                }
                break;
        }
    }
}

var getClickString = function (i, j) {
    return "$('#" + getID(i, j) + "').on('keydown',keyPressFunc);";
}

var fillBlack = function () {
    // search all selected pieces
    $(".puzzle-field.selected").each(function (index) {
        $(this).children(".char").text("#");
        $(this).addClass("black");
        sendBoard();
    });
}

var removeBlack = function () {
    $(".puzzle-field.selected").each(function (index) {
        $(this).children(".char").text(" ");
        $(this).removeClass("black");
        sendBoard();
    });
}

socket.on('puzzlesize', function (data) {
    puzzleSize = parseInt(data["size"]);

    let content = "";
    let onclickJS = "";
    for (let i = 1; i < puzzleSize + 1; i++) {
        for (let j = 1; j < puzzleSize + 1; j++) {
            // build new board
            content += getDivString(i, j);
            onclickJS += getClickString(i, j);
        }
    }

    $("#board").html(content); // clear old board
    $("#key-checker").html(onclickJS);
    createNumberCSS();
});

// OTHER STUFF
var getNumUsers = function () {
    socket.emit('get-online-people');
}

var getBoard = function () {
    socket.emit('board');
}

var createBoardString = function () {
    let result = "";
    for (let i = 1; i < puzzleSize + 1; i++) {
        for (let j = 1; j < puzzleSize + 1; j++) {
            result += $("#" + i + "-" + j).children(".char").text();
        }
    }
    return result;
}

var createNumberString = function () {
    let result = "";
    for (let i = 1; i < puzzleSize + 1; i++) {
        for (let j = 1; j < puzzleSize + 1; j++) {
            result += $("#" + i + "-" + j).attr("src-number") + ",";
        }
    }
    return result;
}

var createCircleString = function () {
    let result = "";
    for (let i = 1; i < puzzleSize + 1; i++) {
        for (let j = 1; j < puzzleSize + 1; j++) {
            result += $("#" + i + "-" + j).attr("src-circle") + ",";
        }
    }
    return result;
}

var parseBoardString = function (boardString) {
    let index = 0;
    for (let i = 1; i < puzzleSize + 1; i++) {
        for (let j = 1; j < puzzleSize + 1; j++) {
            $("#" + i + "-" + j).children(".char").text(boardString[index]);
            if (boardString[index] === "#") {
                $("#" + i + "-" + j).addClass("black");
            }
            index++;
        }
    }
}

var parseNumbers = function (numbers) {
    let index = 0;
    for (let i = 1; i < puzzleSize + 1; i++) {
        for (let j = 1; j < puzzleSize + 1; j++) {
            $("#" + i + "-" + j).addClass("number-" + numbers[index]);
            $("#" + i + "-" + j).attr("src-number", "number-" + numbers[index]);
            index++;
        }
    }
}

var removeNumber = function () {
    $(".puzzle-field.selected").each(function (index) {
        if ($(this).attr("src-number")) {
            $(this).removeClass($(this).attr("src-number"));
            $(this).attr("src-number", "number-0");
            sendBoard();
            focusSelected();
        } else {
            focusSelected();
        }
    });
}

var sendBoard = function () {
    socket.emit('update-board', { 'board': createBoardString(), "numbers": createNumberString(), "circles": createCircleString() });
};

var createNumberCSS = function () {
    for (let i = 0; i < puzzleSize; i++) {
        let css = "<style type='text/css'>";
        for (let j = 1; j < puzzleSize + 1; j++) {
            css += "div.puzzle-field.number-" + (i * puzzleSize + j) + "::after {\
            content: '"+ (i * puzzleSize + j) + "';\
            font-size: 50%;\
        }\
        div.hide-char.number-"+ (i * puzzleSize + j) + "::after {\
            color: black;\
            position: relative;\
            vertical-align: middle;\
            text-align: center;\
        }";
        }
        css += "</style>";
        $(css).appendTo("head");
    }
}

var parseCircles = function (circles) {
    let index = 0;
    for (let i = 1; i < puzzleSize + 1; i++) {
        for (let j = 1; j < puzzleSize + 1; j++) {
            if (circles[index]) {
                $("#" + i + "-" + j).addClass("solution-circle");
                $("#" + i + "-" + j).attr("src-circle", circles[index]);
            } else {
                $("#" + i + "-" + j).removeClass("solution-circle");
                $("#" + i + "-" + j).attr("src-circle", circles[index]);
            }
            index++;
        }
    }
}

var addSolutionCircle = function () {
    $(".puzzle-field.selected").each(function (index) {
        $(this).addClass("solution-circle");
        $(this).attr("src-circle", 1);
    });
    sendBoard();
}
var removeSolutionCircle = function () {
    $(".puzzle-field.selected").each(function (index) {
        $(this).removeClass("solution-circle");
        $(this).attr("src-circle", 0);
    });
    sendBoard();
}

var printDialog = function (showChars) {
    if (!showChars) {
        $("div.puzzle-field").each(function (index) { $(this).addClass("hide-char") });
    }

    var w = window.open();

    var headers = $("#headers").html();
    var field = $("#print").html();

    var html = "<!DOCTYPE HTML>";
    html += '<html lang="en-us">';
    html += headers;
    html += "<body>";

    //check to see if they are null so "undefined" doesnt print on the page. <br>s optional, just to give space
    if (field != null) html += field + "<br/><br/>";

    html += "</body>";
    w.document.write(html);
    w.window.print();
    w.document.close();

    if (!showChars) {
        $("div.puzzle-field").each(function (index) { $(this).removeClass("hide-char") });
    }
}

socket.on('board', function (data) {
    parseBoardString(data["board"]);
    parseNumbers(data["numbers"]);
    parseCircles(data["circles"]);
});

// Send question for num users
$(document).ready(function () {
    getNumUsers();
    getBoard();
});