"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssetInstances = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const lucide_react_1 = require("lucide-react");
const react_hot_toast_1 = __importDefault(require("react-hot-toast"));
const API_BASE_URL = 'http://localhost:3000/api';
const AssetInstances = () => {
    const [instances, setInstances] = (0, react_1.useState)([]);
    const [categories, setCategories] = (0, react_1.useState)([]);
    const [selectedCategory, setSelectedCategory] = (0, react_1.useState)(null);
    const [isAddModalOpen, setIsAddModalOpen] = (0, react_1.useState)(false);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [error, setError] = (0, react_1.useState)(null);
    // Form state
    const [formData, setFormData] = (0, react_1.useState)({
        name: '',
        attributeValues: {}
    });
    (0, react_1.useEffect)(() => {
        fetchCategories();
    }, []);
    (0, react_1.useEffect)(() => {
        if (selectedCategory) {
            fetchInstances(selectedCategory.id);
        }
    }, [selectedCategory]);
    const fetchCategories = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_BASE_URL}/assets/categories`);
            if (!response.ok) {
                throw new Error('Failed to load categories');
            }
            const data = await response.json();
            // Ensure data is an array
            setCategories(Array.isArray(data) ? data : []);
            setError(null);
        }
        catch (err) {
            console.error('Error fetching categories:', err);
            setError('Failed to load categories');
            react_hot_toast_1.default.error('Failed to load categories');
            setCategories([]);
        }
        finally {
            setLoading(false);
        }
    };
    const fetchInstances = async (categoryId) => {
        try {
            setLoading(true);
            const response = await fetch(`${API_BASE_URL}/assets/instances/${categoryId}`);
            if (!response.ok) {
                throw new Error('Failed to load instances');
            }
            const data = await response.json();
            setInstances(data);
            setError(null);
        }
        catch (err) {
            setError('Failed to load instances');
            react_hot_toast_1.default.error('Failed to load instances');
        }
        finally {
            setLoading(false);
        }
    };
    const validateAttributeValue = (value, format) => {
        try {
            const regex = new RegExp(format);
            return regex.test(value);
        }
        catch (err) {
            console.error('Invalid regex pattern:', err);
            return false;
        }
    };
    const handleAttributeChange = (attributeId, value) => {
        setFormData(prev => ({
            ...prev,
            attributeValues: {
                ...prev.attributeValues,
                [attributeId]: value
            }
        }));
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedCategory)
            return;
        // Validate all attributes
        const invalidAttributes = selectedCategory.attributes.filter(attr => {
            const value = formData.attributeValues[attr.id] || '';
            return attr.format_data && !validateAttributeValue(value, attr.format_data);
        });
        if (invalidAttributes.length > 0) {
            react_hot_toast_1.default.error('Please fix the invalid attribute values');
            return;
        }
        try {
            const response = await fetch(`${API_BASE_URL}/assets/instances`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: formData.name,
                    id_parent: selectedCategory.id,
                    attributeValues: Object.entries(formData.attributeValues).map(([id, value]) => ({
                        attribute_id: parseInt(id),
                        value
                    }))
                }),
            });
            if (!response.ok)
                throw new Error('Failed to create instance');
            react_hot_toast_1.default.success('Instance created successfully');
            setIsAddModalOpen(false);
            setFormData({ name: '', attributeValues: {} });
            fetchInstances(selectedCategory.id);
        }
        catch (err) {
            react_hot_toast_1.default.error('Failed to create instance');
        }
    };
    const renderAttributeInput = (attribute) => {
        const value = formData.attributeValues[attribute.id] || '';
        const isValid = !attribute.format_data || validateAttributeValue(value, attribute.format_data);
        return ((0, jsx_runtime_1.jsxs)("div", { className: "mb-4", children: [(0, jsx_runtime_1.jsxs)("label", { className: "block text-sm font-medium text-gray-700", children: [attribute.name, attribute.description && ((0, jsx_runtime_1.jsxs)("span", { className: "ml-1 text-sm text-gray-500", children: ["(", attribute.description, ")"] }))] }), (0, jsx_runtime_1.jsx)("input", { type: "text", value: value, onChange: (e) => handleAttributeChange(attribute.id, e.target.value), className: `mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm
            ${!isValid && value ? 'border-red-300' : ''}` }), attribute.format_data && ((0, jsx_runtime_1.jsxs)("p", { className: "mt-1 text-sm text-gray-500", children: ["Format: ", attribute.format_data] })), !isValid && value && ((0, jsx_runtime_1.jsx)("p", { className: "mt-1 text-sm text-red-600", children: "Value does not match the required format" }))] }, attribute.id));
    };
    if (loading) {
        return ((0, jsx_runtime_1.jsx)("div", { className: "container mx-auto px-4 py-8", children: (0, jsx_runtime_1.jsxs)("div", { className: "animate-pulse", children: [(0, jsx_runtime_1.jsx)("div", { className: "h-8 bg-gray-200 rounded w-1/4 mb-4" }), (0, jsx_runtime_1.jsx)("div", { className: "h-4 bg-gray-200 rounded w-1/2 mb-4" }), (0, jsx_runtime_1.jsx)("div", { className: "h-4 bg-gray-200 rounded w-1/3" })] }) }));
    }
    if (error) {
        return ((0, jsx_runtime_1.jsx)("div", { className: "container mx-auto px-4 py-8", children: (0, jsx_runtime_1.jsx)("div", { className: "bg-red-50 border border-red-200 rounded-lg p-6", children: (0, jsx_runtime_1.jsx)("div", { className: "text-red-600", children: error }) }) }));
    }
    return ((0, jsx_runtime_1.jsxs)("div", { className: "container mx-auto px-4 py-8", children: [(0, jsx_runtime_1.jsxs)("div", { className: "mb-6", children: [(0, jsx_runtime_1.jsx)("label", { className: "block text-sm font-medium text-gray-700", children: "Select Category" }), (0, jsx_runtime_1.jsxs)("select", { className: "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm", value: selectedCategory?.id || '', onChange: (e) => {
                            const category = categories.find(c => c.id === parseInt(e.target.value));
                            setSelectedCategory(category || null);
                        }, children: [(0, jsx_runtime_1.jsx)("option", { value: "", children: "Select a category..." }), Array.isArray(categories) && categories.map(category => ((0, jsx_runtime_1.jsx)("option", { value: category.id, children: category.name }, category.id)))] })] }), selectedCategory && ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex justify-between items-center mb-6", children: [(0, jsx_runtime_1.jsxs)("h2", { className: "text-xl font-semibold text-gray-800", children: ["Instances of ", selectedCategory.name] }), (0, jsx_runtime_1.jsxs)("button", { onClick: () => setIsAddModalOpen(true), className: "bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 flex items-center", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Plus, { className: "h-4 w-4 mr-2" }), "Add Instance"] })] }), (0, jsx_runtime_1.jsx)("div", { className: "bg-white shadow-md rounded-lg overflow-hidden", children: (0, jsx_runtime_1.jsxs)("table", { className: "min-w-full divide-y divide-gray-200", children: [(0, jsx_runtime_1.jsx)("thead", { className: "bg-gray-50", children: (0, jsx_runtime_1.jsxs)("tr", { children: [(0, jsx_runtime_1.jsx)("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Name" }), selectedCategory.attributes.map(attr => ((0, jsx_runtime_1.jsx)("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: attr.name }, attr.id))), (0, jsx_runtime_1.jsx)("th", { className: "px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Actions" })] }) }), (0, jsx_runtime_1.jsx)("tbody", { className: "bg-white divide-y divide-gray-200", children: instances.map(instance => ((0, jsx_runtime_1.jsxs)("tr", { children: [(0, jsx_runtime_1.jsx)("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-900", children: instance.name }), selectedCategory.attributes.map(attr => ((0, jsx_runtime_1.jsx)("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-500", children: instance.attributeValues.find(v => v.attribute_id === attr.id)?.value || '-' }, attr.id))), (0, jsx_runtime_1.jsxs)("td", { className: "px-6 py-4 whitespace-nowrap text-right text-sm font-medium", children: [(0, jsx_runtime_1.jsx)("button", { onClick: () => { }, className: "text-blue-600 hover:text-blue-900 mr-4", children: (0, jsx_runtime_1.jsx)(lucide_react_1.Edit2, { className: "h-4 w-4" }) }), (0, jsx_runtime_1.jsx)("button", { onClick: () => { }, className: "text-red-600 hover:text-red-900", children: (0, jsx_runtime_1.jsx)(lucide_react_1.Trash2, { className: "h-4 w-4" }) })] })] }, instance.id))) })] }) })] })), isAddModalOpen && selectedCategory && ((0, jsx_runtime_1.jsx)("div", { className: "fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center", children: (0, jsx_runtime_1.jsxs)("div", { className: "bg-white rounded-lg p-6 max-w-2xl w-full mx-4", children: [(0, jsx_runtime_1.jsxs)("h3", { className: "text-lg font-medium text-gray-900 mb-4", children: ["Add New ", selectedCategory.name, " Instance"] }), (0, jsx_runtime_1.jsxs)("form", { onSubmit: handleSubmit, children: [(0, jsx_runtime_1.jsxs)("div", { className: "mb-4", children: [(0, jsx_runtime_1.jsx)("label", { className: "block text-sm font-medium text-gray-700", children: "Name" }), (0, jsx_runtime_1.jsx)("input", { type: "text", value: formData.name, onChange: (e) => setFormData(prev => ({ ...prev, name: e.target.value })), className: "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm", required: true })] }), selectedCategory.attributes.map(renderAttributeInput), (0, jsx_runtime_1.jsxs)("div", { className: "mt-6 flex justify-end space-x-3", children: [(0, jsx_runtime_1.jsx)("button", { type: "button", onClick: () => setIsAddModalOpen(false), className: "bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50", children: "Cancel" }), (0, jsx_runtime_1.jsx)("button", { type: "submit", className: "bg-blue-500 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-600", children: "Create Instance" })] })] })] }) }))] }));
};
exports.AssetInstances = AssetInstances;
//# sourceMappingURL=AssetInstances.js.map