"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const AssetForm = ({ onSubmit, onCancel }) => {
    const [name, setName] = (0, react_1.useState)('');
    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit({ name });
    };
    return ((0, jsx_runtime_1.jsxs)("form", { onSubmit: handleSubmit, className: "space-y-6", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { htmlFor: "name", className: "block text-sm font-medium text-gray-700", children: "Name" }), (0, jsx_runtime_1.jsx)("input", { type: "text", id: "name", value: name, onChange: (e) => setName(e.target.value), className: "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm", required: true })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex justify-end space-x-3", children: [(0, jsx_runtime_1.jsx)("button", { type: "button", onClick: onCancel, className: "px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500", children: "Cancel" }), (0, jsx_runtime_1.jsx)("button", { type: "submit", className: "px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500", children: "Create Asset" })] })] }));
};
exports.default = AssetForm;
//# sourceMappingURL=AssetForm.js.map