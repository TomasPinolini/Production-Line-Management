"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Header = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_router_dom_1 = require("react-router-dom");
const icons_1 = require("../utils/icons");
const Header = () => {
    return ((0, jsx_runtime_1.jsx)("header", { className: "bg-gray-800 text-white shadow-lg", children: (0, jsx_runtime_1.jsx)("nav", { className: "container mx-auto px-4 py-3", children: (0, jsx_runtime_1.jsx)("div", { className: "flex items-center justify-between", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center space-x-8", children: [(0, jsx_runtime_1.jsx)(react_router_dom_1.Link, { to: "/", className: "text-xl font-bold", children: "PLM System" }), (0, jsx_runtime_1.jsxs)("div", { className: "flex space-x-4", children: [(0, jsx_runtime_1.jsxs)(react_router_dom_1.Link, { to: "/", className: "flex items-center space-x-1 hover:text-blue-400", children: [(0, jsx_runtime_1.jsx)(icons_1.HomeIcon, { size: 20 }), (0, jsx_runtime_1.jsx)("span", { children: "Home" })] }), (0, jsx_runtime_1.jsxs)(react_router_dom_1.Link, { to: "/participants", className: "flex items-center space-x-1 hover:text-blue-400", children: [(0, jsx_runtime_1.jsx)(icons_1.UsersIcon, { size: 20 }), (0, jsx_runtime_1.jsx)("span", { children: "Participants" })] }), (0, jsx_runtime_1.jsxs)(react_router_dom_1.Link, { to: "/categories", className: "flex items-center space-x-1 hover:text-blue-400", children: [(0, jsx_runtime_1.jsx)(icons_1.SettingsIcon, { size: 20 }), (0, jsx_runtime_1.jsx)("span", { children: "Categories" })] })] })] }) }) }) }));
};
exports.Header = Header;
//# sourceMappingURL=Header.js.map