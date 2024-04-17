"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEvaluationLossThreshold = exports.centipawnClassifications = exports.classificationValues = exports.Classification = void 0;
var Classification;
(function (Classification) {
    Classification["BRILLIANT"] = "brilliant";
    Classification["GREAT"] = "great";
    Classification["BEST"] = "best";
    Classification["EXCELLENT"] = "excellent";
    Classification["GOOD"] = "good";
    Classification["INACCURACY"] = "inaccuracy";
    Classification["MISTAKE"] = "mistake";
    Classification["BLUNDER"] = "blunder";
    Classification["BOOK"] = "book";
    Classification["FORCED"] = "forced";
})(Classification || (exports.Classification = Classification = {}));
exports.classificationValues = {
    "blunder": 0,
    "mistake": 0.2,
    "inaccuracy": 0.4,
    "good": 0.65,
    "excellent": 0.9,
    "best": 1,
    "great": 1,
    "brilliant": 1,
    "book": 1,
    "forced": 1
};
exports.centipawnClassifications = [
    Classification.BEST,
    Classification.EXCELLENT,
    Classification.GOOD,
    Classification.INACCURACY,
    Classification.MISTAKE,
    Classification.BLUNDER
];
function getEvaluationLossThreshold(classif, prevEval) {
    prevEval = Math.abs(prevEval);
    let threshold = 0;
    switch (classif) {
        case Classification.BEST:
            threshold = 0.0001 * Math.pow(prevEval, 2) + (0.0236 * prevEval) - 3.7143;
            break;
        case Classification.EXCELLENT:
            threshold = 0.0002 * Math.pow(prevEval, 2) + (0.1231 * prevEval) + 27.5455;
            break;
        case Classification.GOOD:
            threshold = 0.0002 * Math.pow(prevEval, 2) + (0.2643 * prevEval) + 60.5455;
            break;
        case Classification.INACCURACY:
            threshold = 0.0002 * Math.pow(prevEval, 2) + (0.3624 * prevEval) + 108.0909;
            break;
        case Classification.MISTAKE:
            threshold = 0.0003 * Math.pow(prevEval, 2) + (0.4027 * prevEval) + 225.8182;
            break;
        default:
            threshold = Infinity;
    }
    return Math.max(threshold, 0);
}
exports.getEvaluationLossThreshold = getEvaluationLossThreshold;
