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
let ongoingEvaluation = false;
let evaluatedPositions = [];
let reportResults;
function logAnalysisInfo(message) {
    $("#status-message").css("display", "block");
    $("#status-message").css("background", "rgba(49, 51, 56, 255)");
    $("#status-message").css("color", "white");
    $("#status-message").html(message);
}
function logAnalysisError(message) {
    $("#evaluation-progress-bar").css("display", "none");
    $("#secondary-message").html('');
    $("#status-message").css("padding", "10px 3px 10px 3px");
    $("#status-message").css("display", "block");
    $("#status-message").css("background", "rgba(239, 65, 70, 0.4");
    $("#status-message").css("color", "white");
    $("#status-message").html(`<i class="fa-solid fa-circle-info" style="color: #ffffff;"></i>` + message);
    ongoingEvaluation = false;
}
function evaluate() {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
        $(".g-recaptcha").css("display", "none");
        grecaptcha.reset();
        $("#report-cards").css("display", "none");
        $("#evaluation-progress-bar").css("display", "none");
        if (ongoingEvaluation)
            return;
        ongoingEvaluation = true;
        let pgn = $("#pgn").val().toString();
        let depth = parseInt($("#depth-slider").val().toString());
        if (pgn.length == 0) {
            return logAnalysisError("Provide a game to analyse.");
        }
        $("#status-message").css("padding", "10px 3px 10px 3px");
        logAnalysisInfo("Parsing PGN...");
        try {
            let parseResponse = yield fetch("/api/parse", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ pgn }),
            });
            let parsedPGN = yield parseResponse.json();
            if (!parseResponse.ok) {
                return logAnalysisError((_a = parsedPGN.message) !== null && _a !== void 0 ? _a : "Failed to parse PGN.");
            }
            var positions = parsedPGN.positions;
        }
        catch (_l) {
            return logAnalysisError("Failed to parse PGN.");
        }
        whitePlayer.username =
            (_c = (_b = pgn.match(/(?:\[White ")(.+)(?="\])/)) === null || _b === void 0 ? void 0 : _b[1]) !== null && _c !== void 0 ? _c : "White Player";
        whitePlayer.rating = (_e = (_d = pgn.match(/(?:\[WhiteElo ")(.+)(?="\])/)) === null || _d === void 0 ? void 0 : _d[1]) !== null && _e !== void 0 ? _e : "?";
        blackPlayer.username =
            (_g = (_f = pgn.match(/(?:\[Black ")(.+)(?="\])/)) === null || _f === void 0 ? void 0 : _f[1]) !== null && _g !== void 0 ? _g : "Black Player";
        blackPlayer.rating = (_j = (_h = pgn.match(/(?:\[BlackElo ")(.+)(?="\])/)) === null || _h === void 0 ? void 0 : _h[1]) !== null && _j !== void 0 ? _j : "?";
        updateBoardPlayers();
        $("#secondary-message").html("It can take around a minute to process a full game.");
        for (let position of positions) {
            function placeCutoff() {
                let lastPosition = positions[positions.indexOf(position) - 1];
                if (!lastPosition)
                    return;
                let cutoffWorker = new Stockfish();
                cutoffWorker
                    .evaluate(lastPosition.fen, depth)
                    .then((engineLines) => {
                    var _a, _b;
                    lastPosition.cutoffEvaluation = (_b = (_a = engineLines.find((line) => line.id == 1)) === null || _a === void 0 ? void 0 : _a.evaluation) !== null && _b !== void 0 ? _b : { type: "cp", value: 0 };
                });
            }
            let queryFen = position.fen.replace(/\s/g, "%20");
            let cloudEvaluationResponse;
            try {
                cloudEvaluationResponse = yield fetch(`https://lichess.org/api/cloud-eval?fen=${queryFen}&multiPv=2`, {
                    method: "GET",
                });
                if (!cloudEvaluationResponse)
                    break;
            }
            catch (_m) {
                break;
            }
            if (!cloudEvaluationResponse.ok) {
                placeCutoff();
                break;
            }
            let cloudEvaluation = yield cloudEvaluationResponse.json();
            position.topLines = cloudEvaluation.pvs.map((pv, id) => {
                var _a, _b, _c, _d;
                const evaluationType = pv.cp == undefined ? "mate" : "cp";
                const evaluationScore = (_b = (_a = pv.cp) !== null && _a !== void 0 ? _a : pv.mate) !== null && _b !== void 0 ? _b : "cp";
                let line = {
                    id: id + 1,
                    depth: depth,
                    moveUCI: (_c = pv.moves.split(" ")[0]) !== null && _c !== void 0 ? _c : "",
                    evaluation: {
                        type: evaluationType,
                        value: evaluationScore,
                    },
                };
                let cloudUCIFixes = {
                    e8h8: "e8g8",
                    e1h1: "e1g1",
                    e8a8: "e8c8",
                    e1a1: "e1c1",
                };
                line.moveUCI = (_d = cloudUCIFixes[line.moveUCI]) !== null && _d !== void 0 ? _d : line.moveUCI;
                return line;
            });
            if (((_k = position.topLines) === null || _k === void 0 ? void 0 : _k.length) != 2) {
                placeCutoff();
                break;
            }
            position.worker = "cloud";
            let progress = ((positions.indexOf(position) + 1) / positions.length) * 100;
            $("#evaluation-progress-bar").attr("value", progress);
            logAnalysisInfo(`Evaluating positions... (${progress.toFixed(1)}%)`);
        }
        let workerCount = 0;
        const stockfishManager = setInterval(() => {
            if (!positions.some((pos) => !pos.topLines)) {
                clearInterval(stockfishManager);
                logAnalysisInfo("Evaluation complete.");
                $("#evaluation-progress-bar").val(100);
                $(".g-recaptcha").css("display", "inline");
                $("#secondary-message").html("Please complete the CAPTCHA to continue.");
                evaluatedPositions = positions;
                ongoingEvaluation = false;
                return;
            }
            for (let position of positions) {
                if (position.worker || workerCount >= 8)
                    continue;
                let worker = new Stockfish();
                worker.evaluate(position.fen, depth).then((engineLines) => {
                    position.topLines = engineLines;
                    workerCount--;
                });
                position.worker = worker;
                workerCount++;
            }
            let workerDepths = 0;
            for (let position of positions) {
                if (typeof position.worker == "object") {
                    workerDepths += position.worker.depth;
                }
                else if (typeof position.worker == "string") {
                    workerDepths += depth;
                }
            }
            let progress = (workerDepths / (positions.length * depth)) * 100;
            $("#evaluation-progress-bar").attr("value", progress);
            logAnalysisInfo(`Evaluating positions... (${progress.toFixed(1)}%)`);
        }, 10);
    });
}
function loadReportCards() {
    var _a, _b;
    $("#status-message").css("display", "none");
    $("#status-message").css("padding", "0px");
    traverseMoves(-Infinity);
    $("#report-cards").css("display", "flex");
    $("#white-accuracy").html(`${(_a = reportResults === null || reportResults === void 0 ? void 0 : reportResults.accuracies.white.toFixed(1)) !== null && _a !== void 0 ? _a : "100"}%`);
    $("#black-accuracy").html(`${(_b = reportResults === null || reportResults === void 0 ? void 0 : reportResults.accuracies.black.toFixed(1)) !== null && _b !== void 0 ? _b : "100"}%`);
    $("#evaluation-progress-bar").css("display", "none");
    $("#status-message").css("display", "none");
    logAnalysisInfo("");
}
function report() {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        $(".g-recaptcha").css("display", "none");
        $("#secondary-message").html("");
        $("#evaluation-progress-bar").attr("value", null);
        logAnalysisInfo("Generating report...");
        $("#status-message").css("display", "none");
        try {
            let reportResponse = yield fetch("/api/report", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    positions: evaluatedPositions.map((pos) => {
                        if (pos.worker != "cloud") {
                            pos.worker = "local";
                        }
                        return pos;
                    }),
                    captchaToken: grecaptcha.getResponse() || "none",
                }),
            });
            let report = yield reportResponse.json();
            if (!reportResponse.ok) {
                return logAnalysisError((_a = report.message) !== null && _a !== void 0 ? _a : "Failed to generate report.");
            }
            reportResults = report.results;
            $("#status-message").css("display", "none");
            loadReportCards();
        }
        catch (_b) {
            return logAnalysisError("Failed to generate report.");
        }
    });
}
$("#review-button").on("click", () => {
    var _a;
    if ($("#load-type-dropdown").val() == "json") {
        try {
            let savedAnalysis = JSON.parse((_a = $("#pgn").val()) === null || _a === void 0 ? void 0 : _a.toString());
            whitePlayer = savedAnalysis.players.white;
            blackPlayer = savedAnalysis.players.black;
            updateBoardPlayers();
            reportResults = savedAnalysis.results;
            loadReportCards();
        }
        catch (_b) {
            logAnalysisError("Invalid savefile.");
        }
    }
    else {
        evaluate();
    }
});
$("#depth-slider").on("input", () => {
    var _a;
    let depth = parseInt((_a = $("#depth-slider").val()) === null || _a === void 0 ? void 0 : _a.toString());
    if (depth <= 14) {
        $("#depth-counter").html(depth + `|<i class="fa-solid fa-bolt" style="color: #ffffff;"></i>`);
    }
    else if (depth <= 17) {
        $("#depth-counter").html(depth + `|<i class="fa-solid fa-wind" style="color: #ffffff;"></i>`);
    }
    else {
        $("#depth-counter").html(depth + `|<i class="fa-solid fa-hourglass-half" style="color: #ffffff;"></i>`);
    }
});
