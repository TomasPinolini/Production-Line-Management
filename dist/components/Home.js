"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const AssetList_1 = require("./assets/AssetList");
const Home = () => {
    return ((0, jsx_runtime_1.jsxs)("div", { className: "space-y-8", children: [(0, jsx_runtime_1.jsxs)("div", { className: "text-center", children: [(0, jsx_runtime_1.jsx)("h1", { className: "text-3xl font-bold text-gray-900", children: "Production Line Management System" }), (0, jsx_runtime_1.jsx)("p", { className: "mt-4 text-lg text-gray-600", children: "Track and manage all assets and resources in your production process efficiently." })] }), (0, jsx_runtime_1.jsxs)("div", { className: "bg-white rounded-lg shadow p-6", children: [(0, jsx_runtime_1.jsx)("h2", { className: "text-2xl font-semibold text-gray-900 mb-6", children: "Asset Management" }), (0, jsx_runtime_1.jsx)("p", { className: "text-gray-600 mb-6", children: "Manage your production assets, their attributes, and hierarchical relationships." }), (0, jsx_runtime_1.jsx)(AssetList_1.AssetList, {})] })] }));
};
exports.default = Home;
//# sourceMappingURL=Home.js.map