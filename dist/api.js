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
const express_1 = require("express");
const chess_js_1 = require("chess.js");
const pgn_parser_1 = __importDefault(require("pgn-parser"));
const analysis_1 = __importDefault(require("./lib/analysis"));
const router = (0, express_1.Router)();
router.post("/parse", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let { pgn } = req.body;
    if (!pgn) {
        return res.status(400).json({ message: "Enter a PGN to analyse." });
    }
    try {
        var [parsedPGN] = pgn_parser_1.default.parse(pgn);
        if (!parsedPGN) {
            return res.status(400).json({ message: "Enter a PGN to analyse." });
        }
    }
    catch (err) {
        return res.status(500).json({ message: "Failed to parse invalid PGN." });
    }
    let board = new chess_js_1.Chess();
    let positions = [];
    positions.push({ fen: board.fen() });
    for (let pgnMove of parsedPGN.moves) {
        let moveSAN = pgnMove.move;
        let virtualBoardMove;
        try {
            virtualBoardMove = board.move(moveSAN);
        }
        catch (err) {
            return res.status(400).json({ message: "PGN contains illegal moves." });
        }
        let moveUCI = virtualBoardMove.from + virtualBoardMove.to;
        positions.push({
            fen: board.fen(),
            move: {
                san: moveSAN,
                uci: moveUCI
            }
        });
    }
    res.json({ positions });
}));
router.post("/report", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let { positions, captchaToken } = req.body;
    if (!positions || !captchaToken) {
        return res.status(400).json({ message: "Missing parameters." });
    }
    try {
        var results = yield (0, analysis_1.default)(positions);
    }
    catch (err) {
        console.log(err);
        return res.status(500).json({ message: "Failed to generate report." });
    }
    res.json({ results });
}));
exports.default = router;
