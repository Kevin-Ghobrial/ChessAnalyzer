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
const fs_1 = require("fs");
const analysis_1 = __importDefault(require("../lib/analysis"));
const evaluations_json_1 = __importDefault(require("./evaluations.json"));
const reports = [];
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("Running report generation test...");
        let before = Date.now();
        if (!(0, fs_1.existsSync)("src/test/reports")) {
            (0, fs_1.mkdirSync)("src/test/reports");
        }
        if ((0, fs_1.existsSync)("src/test/reports/failed.json")) {
            (0, fs_1.rmSync)("src/test/reports/failed.json");
        }
        let gameIndex = 0;
        for (let game of evaluations_json_1.default) {
            gameIndex++;
            try {
                let report = yield (0, analysis_1.default)(game);
                reports.push(report);
                (0, fs_1.writeFileSync)(`src/test/reports/report${gameIndex}.json`, JSON.stringify({
                    players: {
                        white: {
                            username: "White Player",
                            rating: "0"
                        },
                        black: {
                            username: "Black Player",
                            rating: "0"
                        }
                    },
                    results: report
                }));
                console.log(`Generated report from game ${gameIndex}...`);
            }
            catch (err) {
                console.log(`Report generation from game ${gameIndex} failed.`);
                console.log(`Failed evaluations written to failed${gameIndex}.json`);
                console.log(err);
                (0, fs_1.writeFileSync)(`src/test/reports/failed${gameIndex}.json`, JSON.stringify(game));
            }
        }
        let elapsedTime = ((Date.now() - before) / 1000).toFixed(2);
        console.log(`Report generation test completed successfully. (${elapsedTime}s)`);
    });
}
main();
