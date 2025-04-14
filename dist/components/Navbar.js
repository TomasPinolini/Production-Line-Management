"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Navbar = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_router_dom_1 = require("react-router-dom");
const Navbar = () => {
    const location = (0, react_router_dom_1.useLocation)();
    const isActive = (path) => {
        return location.pathname === path;
    };
    return ((0, jsx_runtime_1.jsx)("nav", { className: "bg-white shadow-md", children: (0, jsx_runtime_1.jsx)("div", { className: "max-w-7xl mx-auto px-4", children: (0, jsx_runtime_1.jsx)("div", { className: "flex justify-between h-16", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex", children: [(0, jsx_runtime_1.jsx)("div", { className: "flex-shrink-0 flex items-center", children: (0, jsx_runtime_1.jsx)("span", { className: "text-xl font-bold text-gray-800", children: "Asset Management" }) }), (0, jsx_runtime_1.jsxs)("div", { className: "hidden sm:ml-6 sm:flex sm:space-x-8", children: [(0, jsx_runtime_1.jsx)(react_router_dom_1.Link, { to: "/", className: `${isActive('/')
                                        ? 'border-blue-500 text-gray-900'
                                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`, children: "Asset Categories" }), (0, jsx_runtime_1.jsx)(react_router_dom_1.Link, { to: "/instances", className: `${isActive('/instances')
                                        ? 'border-blue-500 text-gray-900'
                                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`, children: "Asset Instances" })] })] }) }) }) }));
};
exports.Navbar = Navbar;
//# sourceMappingURL=Navbar.js.map