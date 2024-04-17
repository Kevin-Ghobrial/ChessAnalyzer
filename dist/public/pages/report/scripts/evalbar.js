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
const evaluationBarCtx = $("#evaluation-bar").get(0).getContext("2d");
function drawEvaluationBar(evaluation, boardFlipped) {
    return __awaiter(this, void 0, void 0, function* () {
        evaluationBarCtx.clearRect(0, 0, 30, 720);
        evaluationBarCtx.font = "16px Gill Sans";
        evaluationBarCtx.fillStyle = "#1e1f22";
        if (evaluation.type == "cp") {
            let height = Math.max(Math.min(360 - evaluation.value / 3, 680), 40);
            let evaluationText = Math.abs(evaluation.value / 100).toFixed(1);
            let evaluationTextWidth = evaluationBarCtx.measureText(evaluationText).width;
            let evaluationTextY = 0;
            if (boardFlipped) {
                evaluationTextY = evaluation.value >= 0 ? 20 : 710;
                evaluationBarCtx.fillRect(0, 720 - height, 30, height);
                evaluationBarCtx.fillStyle = evaluation.value >= 0 ? "#1e1e1e" : "#ffffff";
            }
            else {
                evaluationTextY = evaluation.value >= 0 ? 710 : 20;
                evaluationBarCtx.fillRect(0, 0, 30, height);
                evaluationBarCtx.fillStyle = evaluation.value >= 0 ? "#1e1e1e" : "#ffffff";
            }
            evaluationBarCtx.fillText(evaluationText, 15 - evaluationTextWidth / 2, evaluationTextY, 30);
        }
        else {
            let evaluationText = "M" + Math.abs(evaluation.value).toString();
            let evaluationTextWidth = evaluationBarCtx.measureText(evaluationText).width;
            if (evaluation.value > 0) {
                evaluationBarCtx.fillStyle = "#1e1e1e";
                evaluationBarCtx.fillText(evaluationText, 15 - evaluationTextWidth / 2, boardFlipped ? 20 : 710, 30);
            }
            else if (evaluation.value < 0) {
                evaluationBarCtx.fillRect(0, 0, 30, 720);
                evaluationBarCtx.fillStyle = "#ffffff";
                evaluationBarCtx.fillText(evaluationText, 15 - evaluationTextWidth / 2, boardFlipped ? 710 : 20, 30);
            }
            else if (evaluation.value == 0) {
                evaluationBarCtx.fillStyle = "#676767";
                evaluationBarCtx.fillRect(0, 0, 30, 720);
            }
        }
    });
}
