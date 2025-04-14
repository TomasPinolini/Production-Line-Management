"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const icons_1 = require("../../utils/icons");
const react_hot_toast_1 = __importDefault(require("react-hot-toast"));
const API_BASE_URL = 'http://localhost:3000/api';
const VariableAttributeManager = ({ participantTypeId, onAttributesChange }) => {
    const [attributes, setAttributes] = (0, react_1.useState)([]);
    const [newAttribute, setNewAttribute] = (0, react_1.useState)({
        name: '',
        description: '',
        format_data: ''
    });
    const [editingAttribute, setEditingAttribute] = (0, react_1.useState)(null);
    const [error, setError] = (0, react_1.useState)(null);
    const [loading, setLoading] = (0, react_1.useState)(true);
    (0, react_1.useEffect)(() => {
        if (participantTypeId) {
            fetchAttributes();
        }
    }, [participantTypeId]);
    const fetchAttributes = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_BASE_URL}/participant-types/${participantTypeId}/attributes`);
            if (!response.ok)
                throw new Error('Failed to fetch attributes');
            const data = await response.json();
            console.log('Fetched attributes:', data);
            setAttributes(data);
            onAttributesChange?.(data);
        }
        catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to load attributes';
            setError(message);
            console.error('Error fetching attributes:', err);
            react_hot_toast_1.default.error(message);
        }
        finally {
            setLoading(false);
        }
    };
    const handleAddAttribute = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(`${API_BASE_URL}/participant-types/${participantTypeId}/attributes`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newAttribute),
            });
            if (!response.ok)
                throw new Error('Failed to add attribute');
            const addedAttribute = await response.json();
            setAttributes([...attributes, addedAttribute]);
            setNewAttribute({ name: '', description: '', format_data: '' });
            onAttributesChange?.([...attributes, addedAttribute]);
            react_hot_toast_1.default.success('Attribute added successfully');
        }
        catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to add attribute';
            setError(message);
            console.error('Error adding attribute:', err);
            react_hot_toast_1.default.error(message);
        }
    };
    const handleDeleteAttribute = async (id) => {
        try {
            const response = await fetch(`${API_BASE_URL}/participant-types/${participantTypeId}/attributes/${id}`, {
                method: 'DELETE',
            });
            if (!response.ok)
                throw new Error('Failed to delete attribute');
            setAttributes(attributes.filter(attr => attr.id !== id));
            onAttributesChange?.(attributes.filter(attr => attr.id !== id));
            react_hot_toast_1.default.success('Attribute deleted successfully');
        }
        catch (err) {
            setError('Failed to delete attribute');
            console.error(err);
            react_hot_toast_1.default.error('Failed to delete attribute');
        }
    };
    const handleUpdateAttribute = async (e) => {
        e.preventDefault();
        if (!editingAttribute)
            return;
        try {
            const response = await fetch(`${API_BASE_URL}/participant-types/${participantTypeId}/attributes/${editingAttribute.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: editingAttribute.name,
                    description: editingAttribute.description,
                    format_data: editingAttribute.format_data,
                }),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to update attribute');
            }
            const updatedAttribute = await response.json();
            setAttributes(attributes.map(attr => attr.id === updatedAttribute.id ? updatedAttribute : attr));
            onAttributesChange?.(attributes.map(attr => attr.id === updatedAttribute.id ? updatedAttribute : attr));
            setEditingAttribute(null);
            react_hot_toast_1.default.success('Attribute updated successfully');
        }
        catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to update attribute';
            setError(message);
            console.error('Error updating attribute:', err);
            react_hot_toast_1.default.error(message);
        }
    };
    return ((0, jsx_runtime_1.jsxs)("div", { className: "space-y-4", children: [(0, jsx_runtime_1.jsx)("h3", { className: "text-lg font-medium", children: "Variable Attributes" }), error && ((0, jsx_runtime_1.jsx)("div", { className: "bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded", children: error })), loading ? ((0, jsx_runtime_1.jsx)("div", { className: "text-center py-4", children: "Loading attributes..." })) : ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsxs)("form", { onSubmit: handleAddAttribute, className: "space-y-4", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: "block text-sm font-medium text-gray-700", children: "Attribute Name" }), (0, jsx_runtime_1.jsx)("input", { type: "text", value: newAttribute.name, onChange: (e) => setNewAttribute({ ...newAttribute, name: e.target.value }), className: "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500", required: true })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: "block text-sm font-medium text-gray-700", children: "Description" }), (0, jsx_runtime_1.jsx)("textarea", { value: newAttribute.description, onChange: (e) => setNewAttribute({ ...newAttribute, description: e.target.value }), className: "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500", rows: 2, placeholder: "Explain what this attribute is for and how to use it" })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsxs)("label", { className: "block text-sm font-medium text-gray-700", children: ["Format (Regex) - ", 100 - (newAttribute.format_data?.length || 0), " characters remaining"] }), (0, jsx_runtime_1.jsx)("input", { type: "text", value: newAttribute.format_data, onChange: (e) => setNewAttribute({ ...newAttribute, format_data: e.target.value }), className: "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500", placeholder: "e.g., ^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$ for IPv4", maxLength: 100 }), (0, jsx_runtime_1.jsxs)("div", { className: "mt-1 space-y-1 text-sm text-gray-500", children: [(0, jsx_runtime_1.jsx)("p", { children: "Examples:" }), (0, jsx_runtime_1.jsxs)("p", { children: ["\u2022 IPv4: ", '^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$'] }), (0, jsx_runtime_1.jsxs)("p", { children: ["\u2022 MAC address: ", '^(?:[0-9A-Fa-f]{2}(?:[:-]|$)){6}$'] }), (0, jsx_runtime_1.jsxs)("p", { className: "text-xs", children: ["Note: For IPv6, use a simpler format like: ", '^([0-9A-Fa-f]{1,4}:){7}[0-9A-Fa-f]{1,4}$'] })] })] }), (0, jsx_runtime_1.jsx)("button", { type: "submit", className: "inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2", children: "Add Attribute" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "mt-4", children: [(0, jsx_runtime_1.jsx)("h4", { className: "text-sm font-medium text-gray-700", children: "Current Attributes" }), attributes.length === 0 ? ((0, jsx_runtime_1.jsx)("p", { className: "text-gray-500 text-center py-4", children: "No attributes found" })) : ((0, jsx_runtime_1.jsx)("ul", { className: "mt-2 divide-y divide-gray-200", children: attributes.map((attribute) => ((0, jsx_runtime_1.jsx)("li", { className: "py-3", children: editingAttribute?.id === attribute.id ? ((0, jsx_runtime_1.jsxs)("form", { onSubmit: handleUpdateAttribute, className: "space-y-3", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: "block text-sm font-medium text-gray-700", children: "Name" }), (0, jsx_runtime_1.jsx)("input", { type: "text", value: editingAttribute.name, onChange: (e) => setEditingAttribute({
                                                            ...editingAttribute,
                                                            name: e.target.value
                                                        }), className: "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500", required: true })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: "block text-sm font-medium text-gray-700", children: "Description" }), (0, jsx_runtime_1.jsx)("textarea", { value: editingAttribute.description, onChange: (e) => setEditingAttribute({
                                                            ...editingAttribute,
                                                            description: e.target.value
                                                        }), className: "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500", rows: 2 })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsxs)("label", { className: "block text-sm font-medium text-gray-700", children: ["Format (Regex) - ", 100 - (editingAttribute.format_data?.length || 0), " characters remaining"] }), (0, jsx_runtime_1.jsx)("input", { type: "text", value: editingAttribute.format_data, onChange: (e) => setEditingAttribute({
                                                            ...editingAttribute,
                                                            format_data: e.target.value
                                                        }), className: "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500", maxLength: 100 }), (0, jsx_runtime_1.jsxs)("div", { className: "mt-1 space-y-1 text-sm text-gray-500", children: [(0, jsx_runtime_1.jsx)("p", { children: "Examples:" }), (0, jsx_runtime_1.jsxs)("p", { children: ["\u2022 IPv4: ", '^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$'] }), (0, jsx_runtime_1.jsxs)("p", { children: ["\u2022 MAC address: ", '^(?:[0-9A-Fa-f]{2}(?:[:-]|$)){6}$'] }), (0, jsx_runtime_1.jsxs)("p", { className: "text-xs", children: ["Note: For IPv6, use a simpler format like: ", '^([0-9A-Fa-f]{1,4}:){7}[0-9A-Fa-f]{1,4}$'] })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex gap-2", children: [(0, jsx_runtime_1.jsx)("button", { type: "submit", className: "inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2", children: "Save" }), (0, jsx_runtime_1.jsx)("button", { type: "button", onClick: () => setEditingAttribute(null), className: "inline-flex justify-center rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2", children: "Cancel" })] })] })) : ((0, jsx_runtime_1.jsxs)("div", { className: "flex justify-between items-start", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("p", { className: "text-sm font-medium text-gray-900", children: attribute.name }), attribute.description && ((0, jsx_runtime_1.jsx)("p", { className: "text-sm text-gray-600 mt-1", children: attribute.description })), (0, jsx_runtime_1.jsxs)("p", { className: "text-xs text-gray-400 mt-1", children: ["Format: ", attribute.format_data] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex gap-2", children: [(0, jsx_runtime_1.jsx)("button", { onClick: () => setEditingAttribute(attribute), className: "text-blue-600 hover:text-blue-900", children: (0, jsx_runtime_1.jsx)(icons_1.EditIcon, { className: "h-4 w-4" }) }), (0, jsx_runtime_1.jsx)("button", { onClick: () => handleDeleteAttribute(attribute.id), className: "text-red-600 hover:text-red-900", children: (0, jsx_runtime_1.jsx)(icons_1.DeleteIcon, { className: "h-4 w-4" }) })] })] })) }, attribute.id))) }))] })] }))] }));
};
exports.default = VariableAttributeManager;
//# sourceMappingURL=VariableAttributeManager.js.map