"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
// Placeholder routes for standings
router.get('/', (req, res) => {
    res.json({ message: 'Standings endpoint not implemented yet' });
});
exports.default = router;
//# sourceMappingURL=standings.js.map