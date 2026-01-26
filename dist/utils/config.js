"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = exports.apiConfig = exports.ApiConfig = void 0;
exports.getApiConfig = getApiConfig;
exports.getApiKwargs = getApiKwargs;
exports.getApiProxyConfig = getApiProxyConfig;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Load environment variables
dotenv_1.default.config({ path: path_1.default.join(__dirname, '../../.env') });
class ApiConfig {
    constructor() {
        this.configList = [];
        const configEnv = process.env.NBA_API_CONFIG || process.env.NBA_API_PROXY || '';
        if (configEnv) {
            this.configList = configEnv.split(',').map(p => p.trim()).filter(p => p);
        }
    }
    getConfig() {
        if (!this.configList.length) {
            return null;
        }
        if (this.configList.length === 1) {
            return this.configList[0];
        }
        return this.configList[Math.floor(Math.random() * this.configList.length)];
    }
    getConfigDict() {
        const config = this.getConfig();
        if (!config) {
            return null;
        }
        return {
            http: config,
            https: config,
        };
    }
}
exports.ApiConfig = ApiConfig;
// Global configuration instance
exports.apiConfig = new ApiConfig();
function getApiConfig() {
    return exports.apiConfig;
}
function getApiKwargs() {
    const config = exports.apiConfig.getConfig();
    if (config) {
        return { proxy: config };
    }
    return {};
}
function getApiProxyConfig() {
    return exports.apiConfig.getConfig();
}
exports.config = {
    getApiProxyConfig,
};
//# sourceMappingURL=config.js.map