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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chess_js_1 = require("chess.js");
const classification_1 = require("./classification");
const board_1 = require("./board");
const openings_json_1 = __importDefault(require("../resources/openings.json"));
function analyse(positions) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c;
        let positionIndex = 0;
        for (let position of positions.slice(1)) {
            positionIndex++;
            let board = new chess_js_1.Chess(position.fen);
            let lastPosition = positions[positionIndex - 1];
            let topMove = lastPosition.topLines.find(line => line.id == 1);
            let secondTopMove = lastPosition.topLines.find(line => line.id == 2);
            if (!topMove)
                continue;
            let previousEvaluation = topMove.evaluation;
            let evaluation = (_a = position.topLines.find(line => line.id == 1)) === null || _a === void 0 ? void 0 : _a.evaluation;
            if (!previousEvaluation)
                continue;
            let moveColour = position.fen.includes(" b ") ? "white" : "black";
            if (!evaluation) {
                evaluation = { type: board.isCheckmate() ? "mate" : "cp", value: 0 };
                position.topLines.push({
                    id: 1,
                    depth: 0,
                    evaluation: evaluation,
                    moveUCI: ""
                });
            }
            let absoluteEvaluation = evaluation.value * (moveColour == "white" ? 1 : -1);
            let previousAbsoluteEvaluation = previousEvaluation.value * (moveColour == "white" ? 1 : -1);
            let absoluteSecondEvaluation = ((_b = secondTopMove === null || secondTopMove === void 0 ? void 0 : secondTopMove.evaluation.value) !== null && _b !== void 0 ? _b : 0) * (moveColour == "white" ? 1 : -1);
            let evalLoss = Infinity;
            let cutoffEvalLoss = Infinity;
            let lastLineEvalLoss = Infinity;
            let matchingTopLine = lastPosition.topLines.find(line => line.moveUCI == position.move.uci);
            if (matchingTopLine) {
                if (moveColour == "white") {
                    lastLineEvalLoss = previousEvaluation.value - matchingTopLine.evaluation.value;
                }
                else {
                    lastLineEvalLoss = matchingTopLine.evaluation.value - previousEvaluation.value;
                }
            }
            if (lastPosition.cutoffEvaluation) {
                if (moveColour == "white") {
                    cutoffEvalLoss = lastPosition.cutoffEvaluation.value - evaluation.value;
                }
                else {
                    cutoffEvalLoss = evaluation.value - lastPosition.cutoffEvaluation.value;
                }
            }
            if (moveColour == "white") {
                evalLoss = previousEvaluation.value - evaluation.value;
            }
            else {
                evalLoss = evaluation.value - previousEvaluation.value;
            }
            evalLoss = Math.min(evalLoss, cutoffEvalLoss, lastLineEvalLoss);
            if (!secondTopMove) {
                position.classification = classification_1.Classification.FORCED;
                continue;
            }
            let noMate = previousEvaluation.type == "cp" && evaluation.type == "cp";
            if (topMove.moveUCI == position.move.uci) {
                position.classification = classification_1.Classification.BEST;
            }
            else {
                if (noMate) {
                    for (let classif of classification_1.centipawnClassifications) {
                        if (evalLoss <= (0, classification_1.getEvaluationLossThreshold)(classif, previousEvaluation.value)) {
                            position.classification = classif;
                            break;
                        }
                    }
                }
                else if (previousEvaluation.type == "cp" && evaluation.type == "mate") {
                    if (absoluteEvaluation > 0) {
                        position.classification = classification_1.Classification.BEST;
                    }
                    else if (absoluteEvaluation >= -2) {
                        position.classification = classification_1.Classification.BLUNDER;
                    }
                    else if (absoluteEvaluation >= -5) {
                        position.classification = classification_1.Classification.MISTAKE;
                    }
                    else {
                        position.classification = classification_1.Classification.INACCURACY;
                    }
                }
                else if (previousEvaluation.type == "mate" && evaluation.type == "cp") {
                    if (previousAbsoluteEvaluation < 0 && absoluteEvaluation < 0) {
                        position.classification = classification_1.Classification.BEST;
                    }
                    else if (absoluteEvaluation >= 400) {
                        position.classification = classification_1.Classification.GOOD;
                    }
                    else if (absoluteEvaluation >= 150) {
                        position.classification = classification_1.Classification.INACCURACY;
                    }
                    else if (absoluteEvaluation >= -100) {
                        position.classification = classification_1.Classification.MISTAKE;
                    }
                    else {
                        position.classification = classification_1.Classification.BLUNDER;
                    }
                }
                else if (previousEvaluation.type == "mate" && evaluation.type == "mate") {
                    if (previousAbsoluteEvaluation > 0) {
                        if (absoluteEvaluation <= -4) {
                            position.classification = classification_1.Classification.MISTAKE;
                        }
                        else if (absoluteEvaluation < 0) {
                            position.classification = classification_1.Classification.BLUNDER;
                        }
                        else if (absoluteEvaluation < previousAbsoluteEvaluation) {
                            position.classification = classification_1.Classification.BEST;
                        }
                        else if (absoluteEvaluation <= previousAbsoluteEvaluation + 2) {
                            position.classification = classification_1.Classification.EXCELLENT;
                        }
                        else {
                            position.classification = classification_1.Classification.GOOD;
                        }
                    }
                    else {
                        if (absoluteEvaluation == previousAbsoluteEvaluation) {
                            position.classification = classification_1.Classification.BEST;
                        }
                        else {
                            position.classification = classification_1.Classification.GOOD;
                        }
                    }
                }
            }
            if (position.classification == classification_1.Classification.BEST) {
                let winningAnyways = (absoluteSecondEvaluation >= 700 && topMove.evaluation.type == "cp"
                    || (topMove.evaluation.type == "mate" && secondTopMove.evaluation.type == "mate"));
                if (absoluteEvaluation >= 0 && !winningAnyways && !position.move.san.includes("=")) {
                    let lastBoard = new chess_js_1.Chess(lastPosition.fen);
                    let currentBoard = new chess_js_1.Chess(position.fen);
                    if (lastBoard.isCheck())
                        continue;
                    let lastPiece = lastBoard.get(position.move.uci.slice(2, 4)) || { type: "m" };
                    let sacrificedPieces = [];
                    for (let row of currentBoard.board()) {
                        for (let piece of row) {
                            if (!piece)
                                continue;
                            if (piece.color != moveColour.charAt(0))
                                continue;
                            if (piece.type == "k" || piece.type == "p")
                                continue;
                            if (board_1.pieceValues[lastPiece.type] >= board_1.pieceValues[piece.type]) {
                                continue;
                            }
                            if ((0, board_1.isPieceHanging)(lastPosition.fen, position.fen, piece.square)) {
                                position.classification = classification_1.Classification.BRILLIANT;
                                sacrificedPieces.push(piece);
                            }
                        }
                    }
                    let anyPieceViablyCapturable = false;
                    let captureTestBoard = new chess_js_1.Chess(position.fen);
                    for (let piece of sacrificedPieces) {
                        let attackers = (0, board_1.getAttackers)(position.fen, piece.square);
                        for (let attacker of attackers) {
                            for (let promotion of board_1.promotions) {
                                try {
                                    captureTestBoard.move({
                                        from: attacker.square,
                                        to: piece.square,
                                        promotion: promotion
                                    });
                                    let attackerPinned = false;
                                    for (let row of captureTestBoard.board()) {
                                        for (let enemyPiece of row) {
                                            if (!enemyPiece)
                                                continue;
                                            if (enemyPiece.color == captureTestBoard.turn())
                                                continue;
                                            if (enemyPiece.type == "k" || enemyPiece.type == "p")
                                                continue;
                                            if ((0, board_1.isPieceHanging)(position.fen, captureTestBoard.fen(), enemyPiece.square)
                                                && board_1.pieceValues[enemyPiece.type] >= Math.max(...sacrificedPieces.map(sack => board_1.pieceValues[sack.type]))) {
                                                attackerPinned = true;
                                                break;
                                            }
                                        }
                                        if (attackerPinned)
                                            break;
                                    }
                                    if (board_1.pieceValues[piece.type] >= 5) {
                                        if (!attackerPinned) {
                                            anyPieceViablyCapturable = true;
                                            break;
                                        }
                                    }
                                    else if (!attackerPinned
                                        && !captureTestBoard.moves().some(move => move.endsWith("#"))) {
                                        anyPieceViablyCapturable = true;
                                        break;
                                    }
                                    captureTestBoard.undo();
                                }
                                catch (_d) { }
                            }
                            if (anyPieceViablyCapturable)
                                break;
                        }
                        if (anyPieceViablyCapturable)
                            break;
                    }
                    if (!anyPieceViablyCapturable) {
                        position.classification = classification_1.Classification.BEST;
                    }
                }
                try {
                    if (noMate
                        && position.classification != classification_1.Classification.BRILLIANT
                        && lastPosition.classification == classification_1.Classification.BLUNDER
                        && Math.abs(topMove.evaluation.value - secondTopMove.evaluation.value) >= 150
                        && !(0, board_1.isPieceHanging)(lastPosition.fen, position.fen, position.move.uci.slice(2, 4))) {
                        position.classification = classification_1.Classification.GREAT;
                    }
                }
                catch (_e) { }
            }
            if (position.classification == classification_1.Classification.BLUNDER && absoluteEvaluation >= 600) {
                position.classification = classification_1.Classification.GOOD;
            }
            if (position.classification == classification_1.Classification.BLUNDER
                && previousAbsoluteEvaluation <= -600
                && previousEvaluation.type == "cp"
                && evaluation.type == "cp") {
                position.classification = classification_1.Classification.GOOD;
            }
            (_c = position.classification) !== null && _c !== void 0 ? _c : (position.classification = classification_1.Classification.BOOK);
        }
        for (let position of positions) {
            let opening = openings_json_1.default.find(opening => position.fen.includes(opening.fen));
            position.opening = opening === null || opening === void 0 ? void 0 : opening.name;
        }
        let positiveClassifs = Object.keys(classification_1.classificationValues).slice(4, 8);
        for (let position of positions.slice(1)) {
            if ((position.worker == "cloud" && positiveClassifs.includes(position.classification))
                || position.opening) {
                position.classification = classification_1.Classification.BOOK;
            }
            else {
                break;
            }
        }
        for (let position of positions) {
            for (let line of position.topLines) {
                if (line.evaluation.type == "mate" && line.evaluation.value == 0)
                    continue;
                let board = new chess_js_1.Chess(position.fen);
                try {
                    line.moveSAN = board.move({
                        from: line.moveUCI.slice(0, 2),
                        to: line.moveUCI.slice(2, 4),
                        promotion: line.moveUCI.slice(4) || undefined
                    }).san;
                }
                catch (_f) {
                    line.moveSAN = "";
                }
            }
        }
        let accuracies = {
            white: {
                current: 0,
                maximum: 0
            },
            black: {
                current: 0,
                maximum: 0
            }
        };
        for (let position of positions.slice(1)) {
            const moveColour = position.fen.includes(" b ") ? "white" : "black";
            accuracies[moveColour].current += classification_1.classificationValues[position.classification];
            accuracies[moveColour].maximum++;
        }
        return {
            accuracies: {
                white: accuracies.white.current / accuracies.white.maximum * 100,
                black: accuracies.black.current / accuracies.black.maximum * 100
            },
            positions: positions
        };
    });
}
exports.default = analyse;
