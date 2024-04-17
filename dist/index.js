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
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const api_1 = __importDefault(require("./api"));
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use("/static", express_1.default.static("dist/public"), express_1.default.static("src/public"));
app.use("/api", api_1.default);
app.get("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.sendFile(path_1.default.resolve("src/public/pages/report/index.html"));
}));
app.get("/privacy", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.sendFile(path_1.default.resolve("src/public/pages/privacy/index.html"));
}));
app.listen(process.env.PORT, () => {
    console.log("Server running.");
});
