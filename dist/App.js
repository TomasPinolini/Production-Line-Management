"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_router_dom_1 = require("react-router-dom");
const Home_1 = __importDefault(require("./components/Home"));
const Navbar_1 = require("./components/Navbar");
const AssetInstances_1 = require("./components/assets/AssetInstances");
const react_hot_toast_1 = require("react-hot-toast");
function App() {
    return ((0, jsx_runtime_1.jsx)(react_router_dom_1.BrowserRouter, { children: (0, jsx_runtime_1.jsxs)("div", { className: "min-h-screen bg-gray-100", children: [(0, jsx_runtime_1.jsx)(Navbar_1.Navbar, {}), (0, jsx_runtime_1.jsx)("div", { className: "container mx-auto px-4 py-8", children: (0, jsx_runtime_1.jsxs)(react_router_dom_1.Routes, { children: [(0, jsx_runtime_1.jsx)(react_router_dom_1.Route, { path: "/", element: (0, jsx_runtime_1.jsx)(Home_1.default, {}) }), (0, jsx_runtime_1.jsx)(react_router_dom_1.Route, { path: "/instances", element: (0, jsx_runtime_1.jsx)(AssetInstances_1.AssetInstances, {}) })] }) }), (0, jsx_runtime_1.jsx)(react_hot_toast_1.Toaster, { position: "bottom-right" })] }) }));
}
exports.default = App;
//# sourceMappingURL=App.js.map