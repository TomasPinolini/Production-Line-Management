"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const client_1 = require("react-dom/client");
const App_tsx_1 = __importDefault(require("./App.tsx"));
require("./index.css");
console.log('Main.tsx is executing');
const rootElement = document.getElementById('root');
console.log('Root element found:', rootElement);
if (!rootElement) {
    throw new Error('Failed to find the root element');
}
const root = (0, client_1.createRoot)(rootElement);
console.log('Root created successfully');
root.render((0, jsx_runtime_1.jsx)(react_1.StrictMode, { children: (0, jsx_runtime_1.jsx)(App_tsx_1.default, {}) }));
//# sourceMappingURL=main.js.map