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
class Stockfish {
    constructor() {
        this.worker = new Worker(typeof WebAssembly == "object"
            ? "/static/scripts/stockfish-nnue-16.js"
            : "/static/scripts/stockfish.js");
        this.depth = 0;
        this.worker.postMessage("uci");
        this.worker.postMessage("setoption name MultiPV value 2");
    }
    evaluate(fen_1, targetDepth_1) {
        return __awaiter(this, arguments, void 0, function* (fen, targetDepth, verbose = false) {
            this.worker.postMessage("position fen " + fen);
            this.worker.postMessage("go depth " + targetDepth);
            const messages = [];
            const lines = [];
            return new Promise(res => {
                this.worker.addEventListener("message", event => {
                    var _a, _b, _c, _d, _e;
                    let message = event.data;
                    messages.unshift(message);
                    if (verbose)
                        console.log(message);
                    let latestDepth = parseInt(((_a = message.match(/(?:depth )(\d+)/)) === null || _a === void 0 ? void 0 : _a[1]) || "0");
                    this.depth = Math.max(latestDepth, this.depth);
                    if (message.startsWith("bestmove") || message.includes("depth 0")) {
                        let searchMessages = messages.filter(msg => msg.startsWith("info depth"));
                        for (let searchMessage of searchMessages) {
                            let idString = (_b = searchMessage.match(/(?:multipv )(\d+)/)) === null || _b === void 0 ? void 0 : _b[1];
                            let depthString = (_c = searchMessage.match(/(?:depth )(\d+)/)) === null || _c === void 0 ? void 0 : _c[1];
                            let moveUCI = (_d = searchMessage.match(/(?: pv )(.+?)(?= |$)/)) === null || _d === void 0 ? void 0 : _d[1];
                            let evaluation = {
                                type: searchMessage.includes(" cp ") ? "cp" : "mate",
                                value: parseInt(((_e = searchMessage.match(/(?:(?:cp )|(?:mate ))([\d-]+)/)) === null || _e === void 0 ? void 0 : _e[1]) || "0")
                            };
                            if (fen.includes(" b ")) {
                                evaluation.value *= -1;
                            }
                            if (!idString || !depthString || !moveUCI)
                                continue;
                            let id = parseInt(idString);
                            let depth = parseInt(depthString);
                            if (depth != targetDepth || lines.some(line => line.id == id))
                                continue;
                            lines.push({
                                id,
                                depth,
                                evaluation,
                                moveUCI
                            });
                        }
                        this.worker.terminate();
                        res(lines);
                    }
                });
                this.worker.addEventListener("error", () => {
                    this.worker.terminate();
                    this.worker = new Worker("/static/scripts/stockfish.js");
                    this.worker.postMessage("uci");
                    this.worker.postMessage("setoption name MultiPV value 2");
                    this.evaluate(fen, targetDepth, verbose).then(res);
                });
            });
        });
    }
}
