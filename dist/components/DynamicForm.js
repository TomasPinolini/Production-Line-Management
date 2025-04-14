"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DynamicForm = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const react_hot_toast_1 = __importDefault(require("react-hot-toast"));
function DynamicForm({ participantTypeId, attributes, onSubmit, title }) {
    const [formData, setFormData] = (0, react_1.useState)({
        participant_name: '',
        attributes: {},
    });
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await onSubmit(formData);
            setFormData({ participant_name: '', attributes: {} });
            react_hot_toast_1.default.success('Data saved successfully!');
        }
        catch (error) {
            react_hot_toast_1.default.error('Error saving data');
            console.error('Error:', error);
        }
    };
    const validateField = (value, formatData) => {
        try {
            const regex = new RegExp(formatData);
            return regex.test(value);
        }
        catch {
            // If regex is invalid, return true to avoid blocking submission
            return true;
        }
    };
    return ((0, jsx_runtime_1.jsxs)("form", { onSubmit: handleSubmit, className: "space-y-6", children: [(0, jsx_runtime_1.jsxs)("div", { className: "grid grid-cols-1 gap-6 sm:grid-cols-2", children: [(0, jsx_runtime_1.jsxs)("div", { className: "sm:col-span-2", children: [(0, jsx_runtime_1.jsx)("label", { htmlFor: "participant_name", className: "block text-sm font-medium text-gray-700", children: "Name" }), (0, jsx_runtime_1.jsx)("input", { type: "text", id: "participant_name", value: formData.participant_name, onChange: (e) => setFormData({ ...formData, participant_name: e.target.value }), className: "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm", required: true })] }), attributes.map((attr) => ((0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { htmlFor: `attr_${attr.id}`, className: "block text-sm font-medium text-gray-700", children: attr.name }), (0, jsx_runtime_1.jsx)("input", { type: "text", id: `attr_${attr.id}`, value: formData.attributes[attr.id] || '', onChange: (e) => {
                                    const newValue = e.target.value;
                                    const isValid = validateField(newValue, attr.format_data || '');
                                    setFormData({
                                        ...formData,
                                        attributes: {
                                            ...formData.attributes,
                                            [attr.id]: newValue,
                                        },
                                    });
                                    if (!isValid) {
                                        react_hot_toast_1.default.error(`Invalid format for ${attr.name}`);
                                    }
                                }, className: "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm", required: true })] }, attr.id)))] }), (0, jsx_runtime_1.jsx)("div", { className: "flex justify-end", children: (0, jsx_runtime_1.jsxs)("button", { type: "submit", className: "inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2", children: ["Save ", title] }) })] }));
}
exports.DynamicForm = DynamicForm;
//# sourceMappingURL=DynamicForm.js.map