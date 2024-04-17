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
function loadSprite(filename) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise(res => {
            let image = new Image();
            image.src = "/static/media/" + filename;
            image.addEventListener("load", () => {
                res(image);
            });
        });
    });
}
const pieceIds = {
    "white_pawn": "P",
    "white_knight": "N",
    "white_bishop": "B",
    "white_rook": "R",
    "white_queen": "Q",
    "white_king": "K",
    "black_pawn": "p",
    "black_knight": "n",
    "black_bishop": "b",
    "black_rook": "r",
    "black_queen": "q",
    "black_king": "k"
};
let pieceImages = {};
let pieceLoaders = [];
for (let [pieceId, pieceFenCharacter] of Object.entries(pieceIds)) {
    let pieceLoader = loadSprite(pieceId + ".svg");
    pieceLoader.then(image => {
        pieceImages[pieceFenCharacter] = image;
    });
    pieceLoaders.push(pieceLoader);
}
const classificationIcons = {
    "brilliant": null,
    "great": null,
    "best": null,
    "excellent": null,
    "good": null,
    "inaccuracy": null,
    "mistake": null,
    "blunder": null,
    "forced": null,
    "book": null
};
for (let classification in classificationIcons) {
    loadSprite(classification + ".png").then(image => {
        classificationIcons[classification] = image;
    });
}
