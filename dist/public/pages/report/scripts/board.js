"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const ctx = $("#board").get(0).getContext("2d");
const BOARD_SIZE = 1280;
const startingPositionFen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const classificationColours = {
    "brilliant": "#1baaa6",
    "great": "#5b8baf",
    "best": "#98bc49",
    "excellent": "#98bc49",
    "good": "#97af8b",
    "inaccuracy": "#f4bf44",
    "mistake": "#e28c28",
    "blunder": "#c93230",
    "forced": "#97af8b",
    "book": "#a88764"
};
let currentMoveIndex = 0;
let boardFlipped = false;
let lastEvaluation = {
    type: "cp",
    value: 0
};
let whitePlayer = {
    username: "White Player",
    rating: "?"
};
let blackPlayer = {
    username: "Black Player",
    rating: "?"
};
function getBoardCoordinates(square) {
    if (boardFlipped) {
        return {
            x: 7 - "abcdefgh".split("").indexOf(square.slice(0, 1)),
            y: parseInt(square.slice(1)) - 1
        };
    }
    else {
        return {
            x: "abcdefgh".split("").indexOf(square.slice(0, 1)),
            y: 8 - parseInt(square.slice(1))
        };
    }
}
function drawArrow(fromX, fromY, toX, toY, width) {
    var _a;
    let arrowCtx = (_a = $("<canvas>").get(0)) === null || _a === void 0 ? void 0 : _a.getContext("2d");
    if (!arrowCtx)
        return;
    arrowCtx.canvas.width = 1280;
    arrowCtx.canvas.height = 1280;
    let headlen = 15;
    let angle = Math.atan2(toY - fromY, toX - fromX);
    toX -= Math.cos(angle) * ((width * 1.15));
    toY -= Math.sin(angle) * ((width * 1.15));
    arrowCtx.beginPath();
    arrowCtx.moveTo(fromX, fromY);
    arrowCtx.lineTo(toX, toY);
    arrowCtx.strokeStyle = classificationColours.best;
    arrowCtx.lineWidth = width;
    arrowCtx.stroke();
    arrowCtx.beginPath();
    arrowCtx.moveTo(toX, toY);
    arrowCtx.lineTo(toX - headlen * Math.cos(angle - Math.PI / 7), toY - headlen * Math.sin(angle - Math.PI / 7));
    arrowCtx.lineTo(toX - headlen * Math.cos(angle + Math.PI / 7), toY - headlen * Math.sin(angle + Math.PI / 7));
    arrowCtx.lineTo(toX, toY);
    arrowCtx.lineTo(toX - headlen * Math.cos(angle - Math.PI / 7), toY - headlen * Math.sin(angle - Math.PI / 7));
    arrowCtx.strokeStyle = classificationColours.best;
    arrowCtx.lineWidth = width;
    arrowCtx.stroke();
    arrowCtx.fillStyle = classificationColours.best;
    arrowCtx.fill();
    return arrowCtx.canvas;
}
function drawBoard(fen) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e;
        let colours = ["#f6dfc0", "#b88767"];
        for (let y = 0; y < 8; y++) {
            for (let x = 0; x < 8; x++) {
                ctx.fillStyle = colours[(x + y) % 2];
                ctx.fillRect(x * (BOARD_SIZE / 8), y * (BOARD_SIZE / 8), (BOARD_SIZE / 8), (BOARD_SIZE / 8));
            }
        }
        ctx.font = "24px Arial";
        let files = "abcdefgh".split("");
        for (let x = 0; x < 8; x++) {
            ctx.fillStyle = colours[x % 2];
            ctx.fillText(boardFlipped ? files[7 - x] : files[x], x * (BOARD_SIZE / 8) + 5, BOARD_SIZE - 5);
        }
        for (let y = 0; y < 8; y++) {
            ctx.fillStyle = colours[(y + 1) % 2];
            ctx.fillText(boardFlipped ? (y + 1).toString() : (8 - y).toString(), 5, y * (BOARD_SIZE / 8) + 24);
        }
        let lastMove = reportResults === null || reportResults === void 0 ? void 0 : reportResults.positions[currentMoveIndex];
        let lastMoveCoordinates = {
            from: { x: 0, y: 0 },
            to: { x: 0, y: 0 }
        };
        if (currentMoveIndex > 0 && lastMove) {
            let lastMoveUCI = (_a = lastMove.move) === null || _a === void 0 ? void 0 : _a.uci;
            if (!lastMoveUCI)
                return;
            lastMoveCoordinates.from = getBoardCoordinates(lastMoveUCI.slice(0, 2));
            lastMoveCoordinates.to = getBoardCoordinates(lastMoveUCI.slice(2, 4));
            ctx.globalAlpha = 0.7;
            ctx.fillStyle = classificationColours[(_b = reportResults === null || reportResults === void 0 ? void 0 : reportResults.positions[currentMoveIndex].classification) !== null && _b !== void 0 ? _b : "book"];
            ctx.fillRect(lastMoveCoordinates.from.x * (BOARD_SIZE / 8), lastMoveCoordinates.from.y * (BOARD_SIZE / 8), (BOARD_SIZE / 8), (BOARD_SIZE / 8));
            ctx.fillRect(lastMoveCoordinates.to.x * (BOARD_SIZE / 8), lastMoveCoordinates.to.y * (BOARD_SIZE / 8), (BOARD_SIZE / 8), (BOARD_SIZE / 8));
            ctx.globalAlpha = 1;
        }
        let fenBoard = fen.split(" ")[0];
        let x = boardFlipped ? 7 : 0, y = x;
        for (let character of fenBoard) {
            if (character == "/") {
                x = boardFlipped ? 7 : 0;
                y += boardFlipped ? -1 : 1;
            }
            else if (/\d/g.test(character)) {
                x += parseInt(character) * (boardFlipped ? -1 : 1);
            }
            else {
                ctx.drawImage(pieceImages[character], x * (BOARD_SIZE / 8), y * (BOARD_SIZE / 8), (BOARD_SIZE / 8), (BOARD_SIZE / 8));
                x += boardFlipped ? -1 : 1;
            }
        }
        if (currentMoveIndex > 0 && reportResults) {
            let classification = (_c = reportResults === null || reportResults === void 0 ? void 0 : reportResults.positions[currentMoveIndex]) === null || _c === void 0 ? void 0 : _c.classification;
            if (!classification)
                return;
            ctx.drawImage(classificationIcons[classification], lastMoveCoordinates.to.x * (BOARD_SIZE / 8) + ((68 / 90) * (BOARD_SIZE / 8)), lastMoveCoordinates.to.y * (BOARD_SIZE / 8) - ((10 / 90) * (BOARD_SIZE / 8)), 56, 56);
        }
        if ((_d = $("#suggestion-arrows-setting").get(0)) === null || _d === void 0 ? void 0 : _d.checked) {
            let arrowAttributes = [
                {
                    width: 35,
                    opacity: 0.8
                },
                {
                    width: 21,
                    opacity: 0.55
                }
            ];
            let topLineIndex = -1;
            for (let topLine of (_e = lastMove === null || lastMove === void 0 ? void 0 : lastMove.topLines) !== null && _e !== void 0 ? _e : []) {
                topLineIndex++;
                let from = getBoardCoordinates(topLine.moveUCI.slice(0, 2));
                let to = getBoardCoordinates(topLine.moveUCI.slice(2, 4));
                let arrow = drawArrow(from.x * (BOARD_SIZE / 8) + (BOARD_SIZE / 16), from.y * (BOARD_SIZE / 8) + (BOARD_SIZE / 16), to.x * (BOARD_SIZE / 8) + (BOARD_SIZE / 16), to.y * (BOARD_SIZE / 8) + (BOARD_SIZE / 16), arrowAttributes[topLineIndex].width);
                if (!arrow)
                    continue;
                ctx.globalAlpha = arrowAttributes[topLineIndex].opacity;
                ctx.drawImage(arrow, 0, 0);
                ctx.globalAlpha = 1;
            }
        }
    });
}
function updateBoardPlayers() {
    let bottomPlayerProfile = boardFlipped ? blackPlayer : whitePlayer;
    let topPlayerProfile = boardFlipped ? whitePlayer : blackPlayer;
    topPlayerProfile.username = topPlayerProfile.username.replace(/[<>]/g, "");
    topPlayerProfile.rating = topPlayerProfile.rating.replace(/[<>]/g, "");
    bottomPlayerProfile.username = bottomPlayerProfile.username.replace(/[<>]/g, "");
    bottomPlayerProfile.rating = bottomPlayerProfile.rating.replace(/[<>]/g, "");
    $("#top-player-profile").html(`${topPlayerProfile.username} (${topPlayerProfile.rating})`);
    $("#bottom-player-profile").html(`${bottomPlayerProfile.username} (${bottomPlayerProfile.rating})`);
}
function traverseMoves(moveCount) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p;
    if (ongoingEvaluation || !reportResults)
        return;
    let positions = reportResults.positions;
    let previousMoveIndex = currentMoveIndex;
    currentMoveIndex = Math.max(Math.min(currentMoveIndex + moveCount, reportResults.positions.length - 1), 0);
    let currentPosition = positions[currentMoveIndex];
    drawBoard((_a = currentPosition === null || currentPosition === void 0 ? void 0 : currentPosition.fen) !== null && _a !== void 0 ? _a : startingPositionFen);
    let topLine = (_b = currentPosition === null || currentPosition === void 0 ? void 0 : currentPosition.topLines) === null || _b === void 0 ? void 0 : _b.find(line => line.id == 1);
    lastEvaluation = (_c = topLine === null || topLine === void 0 ? void 0 : topLine.evaluation) !== null && _c !== void 0 ? _c : { type: "cp", value: 0 };
    drawEvaluationBar((_d = topLine === null || topLine === void 0 ? void 0 : topLine.evaluation) !== null && _d !== void 0 ? _d : { type: "cp", value: 0 }, boardFlipped);
    updateClassificationMessage(positions[currentMoveIndex - 1], currentPosition);
    updateEngineSuggestions((_e = currentPosition.topLines) !== null && _e !== void 0 ? _e : []);
    if (currentPosition.opening) {
        $("#opening-name").html(currentPosition.opening);
    }
    if ((previousMoveIndex == 0 && moveCount < 0)
        || (previousMoveIndex == positions.length - 1 && moveCount > 0))
        return;
    for (let boardSound of $(".sound-fx-board").get()) {
        boardSound.pause();
        boardSound.currentTime = 0;
    }
    let moveSAN = (_g = (_f = positions[currentMoveIndex + (moveCount == -1 ? 1 : 0)].move) === null || _f === void 0 ? void 0 : _f.san) !== null && _g !== void 0 ? _g : "";
    if (moveSAN.endsWith("#")) {
        (_h = $("#sound-fx-check").get(0)) === null || _h === void 0 ? void 0 : _h.play();
        (_j = $("#sound-fx-game-end").get(0)) === null || _j === void 0 ? void 0 : _j.play();
    }
    else if (moveSAN.endsWith("+")) {
        (_k = $("#sound-fx-check").get(0)) === null || _k === void 0 ? void 0 : _k.play();
    }
    else if (/=[QRBN]/g.test(moveSAN)) {
        (_l = $("#sound-fx-promote").get(0)) === null || _l === void 0 ? void 0 : _l.play();
    }
    else if (moveSAN.includes("O-O")) {
        (_m = $("#sound-fx-castle").get(0)) === null || _m === void 0 ? void 0 : _m.play();
    }
    else if (moveSAN.includes("x")) {
        (_o = $("#sound-fx-capture").get(0)) === null || _o === void 0 ? void 0 : _o.play();
    }
    else {
        (_p = $("#sound-fx-move").get(0)) === null || _p === void 0 ? void 0 : _p.play();
    }
}
$("#back-start-move-button").on("click", () => {
    traverseMoves(-Infinity);
});
$("#back-move-button").on("click", () => {
    traverseMoves(-1);
});
$("#next-move-button").on("click", () => {
    traverseMoves(1);
});
$("#go-end-move-button").on("click", () => {
    traverseMoves(Infinity);
});
$(window).on("keydown", (event) => {
    let key = event.key;
    switch (key) {
        case "ArrowDown":
            traverseMoves(-Infinity);
            break;
        case "ArrowLeft":
            traverseMoves(-1);
            break;
        case "ArrowRight":
            traverseMoves(1);
            break;
        case "ArrowUp":
            traverseMoves(Infinity);
            break;
    }
});
$("#board").on("click", event => {
    var _a;
    let boardBoundingBox = (_a = $("#board").get(0)) === null || _a === void 0 ? void 0 : _a.getBoundingClientRect();
    if (!boardBoundingBox)
        return;
    traverseMoves(event.clientX > boardBoundingBox.left + boardBoundingBox.width / 2 ? 1 : -1);
});
$("#flip-board-button").on("click", () => {
    var _a, _b;
    boardFlipped = !boardFlipped;
    drawEvaluationBar(lastEvaluation, boardFlipped);
    drawBoard((_b = (_a = reportResults === null || reportResults === void 0 ? void 0 : reportResults.positions[currentMoveIndex]) === null || _a === void 0 ? void 0 : _a.fen) !== null && _b !== void 0 ? _b : startingPositionFen);
    updateBoardPlayers();
});
$("#suggestion-arrows-setting").on("input", () => {
    var _a, _b;
    drawBoard((_b = (_a = reportResults === null || reportResults === void 0 ? void 0 : reportResults.positions[currentMoveIndex]) === null || _a === void 0 ? void 0 : _a.fen) !== null && _b !== void 0 ? _b : startingPositionFen);
});
Promise.all(pieceLoaders).then(() => {
    drawBoard(startingPositionFen);
    drawEvaluationBar(lastEvaluation, boardFlipped);
});
