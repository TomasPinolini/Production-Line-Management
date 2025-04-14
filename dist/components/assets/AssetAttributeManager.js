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
const AssetAttributeManager = ({ assetId, onAttributesChange }) => {
    const [attributeGroups, setAttributeGroups] = (0, react_1.useState)([]);
    const [isAddModalOpen, setIsAddModalOpen] = (0, react_1.useState)(false);
    const [editingAttribute, setEditingAttribute] = (0, react_1.useState)(null);
    const [newAttribute, setNewAttribute] = (0, react_1.useState)({
        name: '',
        description: '',
        format_data: ''
    });
    (0, react_1.useEffect)(() => {
        if (assetId) {
            loadAttributes();
        }
    }, [assetId]);
    const loadAttributes = async () => {
        try {
            // First, get the current asset and build the parent chain
            const assetResponse = await fetch(`${API_BASE_URL}/assets/${assetId}`);
            if (!assetResponse.ok)
                throw new Error('Failed to fetch asset details');
            const asset = await assetResponse.json();
            // Build the parent chain
            const parentChain = [];
            let currentAsset = asset;
            while (currentAsset) {
                parentChain.unshift(currentAsset); // Add to start of array
                if (currentAsset.id_parent) {
                    const parentResponse = await fetch(`${API_BASE_URL}/assets/${currentAsset.id_parent}`);
                    if (parentResponse.ok) {
                        currentAsset = await parentResponse.json();
                    }
                    else {
                        currentAsset = null;
                    }
                }
                else {
                    currentAsset = null;
                }
            }
            // Now fetch attributes for each asset in the chain
            const groups = [];
            // Get inherited attributes from parents
            for (const p of parentChain.slice(0, -1)) {
                const attributesResponse = await fetch(`${API_BASE_URL}/assets/${p.id}/attributes`);
                if (attributesResponse.ok) {
                    const attributes = await attributesResponse.json();
                    if (attributes.length > 0) {
                        groups.push({
                            assetId: p.id,
                            assetName: `Inherited from ${p.name}`,
                            attributes
                        });
                    }
                }
            }
            // Get own attributes
            const ownAttributesResponse = await fetch(`${API_BASE_URL}/assets/${assetId}/attributes`);
            if (ownAttributesResponse.ok) {
                const ownAttributes = await ownAttributesResponse.json();
                groups.push({
                    assetId,
                    assetName: 'Own Attributes',
                    attributes: ownAttributes
                });
            }
            setAttributeGroups(groups);
        }
        catch (error) {
            console.error('Error loading attributes:', error);
            react_hot_toast_1.default.error('Failed to load attributes');
        }
    };
    const handleAddAttribute = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/assets/${assetId}/attributes`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newAttribute),
            });
            if (!response.ok)
                throw new Error('Failed to add attribute');
            const addedAttribute = await response.json();
            // Update the state
            setAttributeGroups(prev => prev.map(group => {
                if (group.assetId === assetId) {
                    return {
                        ...group,
                        attributes: [...group.attributes, addedAttribute]
                    };
                }
                return group;
            }));
            setIsAddModalOpen(false);
            setNewAttribute({ name: '', description: '', format_data: '' });
            react_hot_toast_1.default.success('Attribute added successfully');
            if (onAttributesChange)
                onAttributesChange();
        }
        catch (error) {
            console.error('Error adding attribute:', error);
            react_hot_toast_1.default.error('Failed to add attribute');
        }
    };
    const handleDeleteAttribute = async (id) => {
        try {
            const response = await fetch(`${API_BASE_URL}/assets/${assetId}/attributes/${id}`, {
                method: 'DELETE',
            });
            if (!response.ok)
                throw new Error('Failed to delete attribute');
            // Update the state
            setAttributeGroups(prev => prev.map(group => {
                if (group.assetId === assetId) {
                    return {
                        ...group,
                        attributes: group.attributes.filter(attr => attr.id !== id)
                    };
                }
                return group;
            }));
            react_hot_toast_1.default.success('Attribute deleted successfully');
            if (onAttributesChange)
                onAttributesChange();
        }
        catch (error) {
            console.error('Error deleting attribute:', error);
            react_hot_toast_1.default.error('Failed to delete attribute');
        }
    };
    const handleUpdateAttribute = async () => {
        if (!editingAttribute)
            return;
        try {
            const response = await fetch(`${API_BASE_URL}/assets/${assetId}/attributes/${editingAttribute.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(editingAttribute),
            });
            if (!response.ok)
                throw new Error('Failed to update attribute');
            const updatedAttribute = await response.json();
            // Update the state
            setAttributeGroups(prev => prev.map(group => {
                if (group.assetId === assetId) {
                    return {
                        ...group,
                        attributes: group.attributes.map(attr => attr.id === updatedAttribute.id ? updatedAttribute : attr)
                    };
                }
                return group;
            }));
            setEditingAttribute(null);
            react_hot_toast_1.default.success('Attribute updated successfully');
            if (onAttributesChange)
                onAttributesChange();
        }
        catch (error) {
            console.error('Error updating attribute:', error);
            react_hot_toast_1.default.error('Failed to update attribute');
        }
    };
    return ((0, jsx_runtime_1.jsxs)("div", { className: "space-y-6", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex justify-between items-center", children: [(0, jsx_runtime_1.jsx)("h3", { className: "text-lg font-medium", children: "Asset Attributes" }), (0, jsx_runtime_1.jsxs)("button", { onClick: () => setIsAddModalOpen(true), className: "flex items-center px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700", children: [(0, jsx_runtime_1.jsx)(icons_1.Plus, { className: "w-4 h-4 mr-2" }), "Add Attribute"] })] }), attributeGroups.map(group => ((0, jsx_runtime_1.jsxs)("div", { className: "space-y-4 mb-6", children: [(0, jsx_runtime_1.jsx)("div", { className: "flex items-center justify-between", children: (0, jsx_runtime_1.jsx)("h4", { className: "text-sm font-medium text-gray-500", children: group.assetName }) }), (0, jsx_runtime_1.jsx)("div", { className: "bg-white shadow overflow-hidden sm:rounded-md", children: (0, jsx_runtime_1.jsx)("ul", { className: "divide-y divide-gray-200", children: group.attributes.map(attr => ((0, jsx_runtime_1.jsx)("li", { className: "px-4 py-4", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("h5", { className: "text-sm font-medium", children: attr.name }), attr.description && ((0, jsx_runtime_1.jsx)("p", { className: "text-sm text-gray-500", children: attr.description })), attr.format_data && ((0, jsx_runtime_1.jsxs)("p", { className: "text-xs text-gray-400", children: ["Format: ", attr.format_data] }))] }), group.assetId === assetId && ((0, jsx_runtime_1.jsxs)("div", { className: "flex space-x-2", children: [(0, jsx_runtime_1.jsx)("button", { onClick: () => setEditingAttribute(attr), className: "text-blue-600 hover:text-blue-800", children: (0, jsx_runtime_1.jsx)(icons_1.EditIcon, { className: "w-4 h-4" }) }), (0, jsx_runtime_1.jsx)("button", { onClick: () => handleDeleteAttribute(attr.id), className: "text-red-600 hover:text-red-800", children: (0, jsx_runtime_1.jsx)(icons_1.DeleteIcon, { className: "w-4 h-4" }) })] }))] }) }, attr.id))) }) })] }, group.assetId))), isAddModalOpen && ((0, jsx_runtime_1.jsx)("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center", children: (0, jsx_runtime_1.jsxs)("div", { className: "bg-white rounded-lg p-6 max-w-md w-full", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex justify-between items-center mb-4", children: [(0, jsx_runtime_1.jsx)("h2", { className: "text-xl font-semibold", children: "Add New Attribute" }), (0, jsx_runtime_1.jsx)("button", { onClick: () => setIsAddModalOpen(false), className: "text-gray-500 hover:text-gray-700", children: (0, jsx_runtime_1.jsx)(icons_1.CloseIcon, { className: "w-5 h-5" }) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-4", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: "block text-sm font-medium text-gray-700", children: "Name" }), (0, jsx_runtime_1.jsx)("input", { type: "text", value: newAttribute.name, onChange: (e) => setNewAttribute((prev) => ({ ...prev, name: e.target.value })), className: "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: "block text-sm font-medium text-gray-700", children: "Description" }), (0, jsx_runtime_1.jsx)("input", { type: "text", value: newAttribute.description, onChange: (e) => setNewAttribute((prev) => ({
                                                ...prev,
                                                description: e.target.value,
                                            })), className: "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: "block text-sm font-medium text-gray-700", children: "Format (regex)" }), (0, jsx_runtime_1.jsx)("input", { type: "text", value: newAttribute.format_data, onChange: (e) => setNewAttribute((prev) => ({
                                                ...prev,
                                                format_data: e.target.value,
                                            })), className: "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex justify-end space-x-3 mt-6", children: [(0, jsx_runtime_1.jsx)("button", { onClick: () => setIsAddModalOpen(false), className: "px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50", children: "Cancel" }), (0, jsx_runtime_1.jsx)("button", { onClick: handleAddAttribute, className: "px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700", children: "Add Attribute" })] })] })] }) })), editingAttribute && ((0, jsx_runtime_1.jsx)("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center", children: (0, jsx_runtime_1.jsxs)("div", { className: "bg-white rounded-lg p-6 max-w-md w-full", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex justify-between items-center mb-4", children: [(0, jsx_runtime_1.jsx)("h2", { className: "text-xl font-semibold", children: "Edit Attribute" }), (0, jsx_runtime_1.jsx)("button", { onClick: () => setEditingAttribute(null), className: "text-gray-500 hover:text-gray-700", children: (0, jsx_runtime_1.jsx)(icons_1.CloseIcon, { className: "w-5 h-5" }) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-4", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: "block text-sm font-medium text-gray-700", children: "Name" }), (0, jsx_runtime_1.jsx)("input", { type: "text", value: editingAttribute.name, onChange: (e) => setEditingAttribute((prev) => prev ? { ...prev, name: e.target.value } : null), className: "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: "block text-sm font-medium text-gray-700", children: "Description" }), (0, jsx_runtime_1.jsx)("input", { type: "text", value: editingAttribute.description || '', onChange: (e) => setEditingAttribute((prev) => prev ? { ...prev, description: e.target.value } : null), className: "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: "block text-sm font-medium text-gray-700", children: "Format (regex)" }), (0, jsx_runtime_1.jsx)("input", { type: "text", value: editingAttribute.format_data || '', onChange: (e) => setEditingAttribute((prev) => prev ? { ...prev, format_data: e.target.value } : null), className: "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex justify-end space-x-3 mt-6", children: [(0, jsx_runtime_1.jsx)("button", { onClick: () => setEditingAttribute(null), className: "px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50", children: "Cancel" }), (0, jsx_runtime_1.jsx)("button", { onClick: handleUpdateAttribute, className: "px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700", children: "Update Attribute" })] })] })] }) }))] }));
};
exports.default = AssetAttributeManager;
//# sourceMappingURL=AssetAttributeManager.js.map