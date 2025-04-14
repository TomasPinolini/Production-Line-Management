"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssetList = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = __importStar(require("react"));
const react_router_dom_1 = require("react-router-dom");
const lucide_react_1 = require("lucide-react");
const react_hot_toast_1 = __importDefault(require("react-hot-toast"));
const AssetForm_1 = __importDefault(require("./AssetForm"));
const AssetAttributeManager_1 = __importDefault(require("./AssetAttributeManager"));
const API_BASE_URL = 'http://localhost:3000/api';
const AssetList = () => {
    const navigate = (0, react_router_dom_1.useNavigate)();
    const [assets, setAssets] = (0, react_1.useState)([]);
    const [selectedAsset, setSelectedAsset] = (0, react_1.useState)(null);
    const [parentChain, setParentChain] = (0, react_1.useState)([]);
    const [error, setError] = (0, react_1.useState)(null);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [isAddModalOpen, setIsAddModalOpen] = (0, react_1.useState)(false);
    const [expandedAssets, setExpandedAssets] = (0, react_1.useState)(new Set());
    const [breadcrumbs, setBreadcrumbs] = (0, react_1.useState)([]);
    const [editingAsset, setEditingAsset] = (0, react_1.useState)(null);
    const [isAttributeManagerOpen, setIsAttributeManagerOpen] = (0, react_1.useState)(false);
    (0, react_1.useEffect)(() => {
        if (selectedAsset) {
            fetchChildren(selectedAsset.id);
        }
        else {
            fetchRootAssets();
        }
    }, [selectedAsset]);
    const fetchRootAssets = async () => {
        try {
            setLoading(true);
            console.log('🌐 API Request:', {
                method: 'GET',
                url: `${API_BASE_URL}/assets/roots`,
                timestamp: new Date().toISOString()
            });
            const response = await fetch(`${API_BASE_URL}/assets/roots`);
            const rootData = await response.json();
            console.log('✅ API Response:', {
                status: response.status,
                url: `${API_BASE_URL}/assets/roots`,
                data: rootData,
                timestamp: new Date().toISOString()
            });
            if (!response.ok)
                throw new Error('Failed to fetch root assets');
            setAssets(rootData);
            // Expand root assets by default
            const newExpanded = new Set(expandedAssets);
            rootData.forEach((p) => {
                if (p.children && p.children.length > 0) {
                    newExpanded.add(p.id);
                }
            });
            setExpandedAssets(newExpanded);
            setLoading(false);
        }
        catch (err) {
            console.error('❌ API Error:', {
                url: `${API_BASE_URL}/assets/roots`,
                error: err instanceof Error ? err.message : 'Unknown error',
                timestamp: new Date().toISOString()
            });
            setError('Failed to load assets');
            react_hot_toast_1.default.error('Failed to load assets');
            setLoading(false);
        }
    };
    const fetchChildren = async (parentId) => {
        try {
            setLoading(true);
            console.log('🌐 API Request:', {
                method: 'GET',
                url: `${API_BASE_URL}/assets/${parentId}`,
                timestamp: new Date().toISOString()
            });
            const response = await fetch(`${API_BASE_URL}/assets/${parentId}`);
            const data = await response.json();
            console.log('✅ API Response:', {
                status: response.status,
                url: `${API_BASE_URL}/assets/${parentId}`,
                data,
                timestamp: new Date().toISOString()
            });
            if (!response.ok)
                throw new Error('Failed to fetch asset');
            setAssets(data.children || []);
            setLoading(false);
        }
        catch (err) {
            console.error('❌ API Error:', {
                url: `${API_BASE_URL}/assets/${parentId}`,
                error: err instanceof Error ? err.message : 'Unknown error',
                timestamp: new Date().toISOString()
            });
            setError('Failed to load children');
            react_hot_toast_1.default.error('Failed to load children');
            setLoading(false);
        }
    };
    const handleAssetSelect = async (asset) => {
        setSelectedAsset(asset);
        setParentChain(prev => [...prev, asset]);
    };
    const handleGoBack = () => {
        if (parentChain.length > 0) {
            // Go back to root if we're only one level deep
            if (parentChain.length === 1) {
                setParentChain([]);
                setSelectedAsset(null);
            }
            else {
                const newParentChain = parentChain.slice(0, -1);
                const newSelectedAsset = newParentChain[newParentChain.length - 1] || null;
                setParentChain(newParentChain);
                setSelectedAsset(newSelectedAsset);
            }
        }
    };
    const handleGoToRoot = () => {
        setParentChain([]);
        setSelectedAsset(null);
        fetchRootAssets();
    };
    const handleSubmitAsset = async (data) => {
        try {
            const response = await fetch(`${API_BASE_URL}/assets`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: data.name,
                    id_parent: selectedAsset?.id || null
                }),
            });
            if (!response.ok)
                throw new Error('Failed to create asset');
            // Refresh the current level
            if (selectedAsset) {
                fetchChildren(selectedAsset.id);
            }
            else {
                fetchRootAssets();
            }
            setIsAddModalOpen(false);
            react_hot_toast_1.default.success('Asset added successfully');
        }
        catch (err) {
            console.error('Error adding asset:', err);
            react_hot_toast_1.default.error('Failed to add asset');
        }
    };
    const handleEditAsset = (asset) => {
        setEditingAsset(asset);
        setIsAttributeManagerOpen(true);
    };
    const handleCloseEdit = () => {
        setEditingAsset(null);
        setIsAttributeManagerOpen(false);
    };
    const handleAssetUpdate = async (updatedAsset) => {
        try {
            setLoading(true);
            const updatePayload = {
                name: updatedAsset.name,
                id_parent: updatedAsset.id_parent,
                attributes: updatedAsset.attributes?.map(attr => ({
                    id: attr.id,
                    value: attr.value || ''
                })) || []
            };
            const response = await fetch(`${API_BASE_URL}/assets/${updatedAsset.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updatePayload),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to update asset');
            }
            const data = await response.json();
            // Update the local state
            setAssets(assets.map(p => p.id === data.id ? data : p));
            setEditingAsset(null);
            setIsAttributeManagerOpen(false);
            react_hot_toast_1.default.success('Asset updated successfully');
            // Refresh the current view to get updated inheritance
            if (selectedAsset) {
                fetchChildren(selectedAsset.id);
            }
            else {
                fetchRootAssets();
            }
        }
        catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to update asset';
            setError(message);
            console.error('Error updating asset:', err);
            react_hot_toast_1.default.error(message);
        }
        finally {
            setLoading(false);
        }
    };
    const handleDeleteAsset = async (id) => {
        if (!window.confirm('Are you sure you want to delete this asset?')) {
            return;
        }
        try {
            setLoading(true);
            const response = await fetch(`${API_BASE_URL}/assets/${id}`, {
                method: 'DELETE',
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to delete asset');
            }
            // Remove the asset from the local state
            setAssets(assets.filter(p => p.id !== id));
            react_hot_toast_1.default.success('Asset deleted successfully');
            // Refresh the current view
            if (selectedAsset) {
                fetchChildren(selectedAsset.id);
            }
            else {
                fetchRootAssets();
            }
        }
        catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to delete asset';
            setError(message);
            console.error('Error deleting asset:', err);
            react_hot_toast_1.default.error(message);
        }
        finally {
            setLoading(false);
        }
    };
    const handleAssetClick = (asset) => {
        const newExpanded = new Set(expandedAssets);
        if (newExpanded.has(asset.id)) {
            newExpanded.delete(asset.id);
        }
        else {
            newExpanded.add(asset.id);
        }
        setExpandedAssets(newExpanded);
    };
    const handleBreadcrumbClick = (assetId) => {
        const index = breadcrumbs.findIndex(b => b.id === assetId);
        if (index !== -1) {
            setBreadcrumbs(breadcrumbs.slice(0, index + 1));
            const newExpanded = new Set(expandedAssets);
            setExpandedAssets(newExpanded);
        }
    };
    const handleAddChild = (parent) => {
        setSelectedAsset(parent);
        setIsAddModalOpen(true);
    };
    const renderBreadcrumbs = () => {
        return ((0, jsx_runtime_1.jsxs)("div", { className: "flex items-center space-x-2 mb-4 text-sm text-gray-600", children: [(0, jsx_runtime_1.jsxs)("button", { onClick: handleGoToRoot, className: "flex items-center px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors duration-200", title: "Go to root level", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.HomeIcon, { className: "h-4 w-4 mr-1" }), (0, jsx_runtime_1.jsx)("span", { className: "font-medium", children: "Root" })] }), parentChain.map((asset, index) => ((0, jsx_runtime_1.jsxs)(react_1.default.Fragment, { children: [(0, jsx_runtime_1.jsx)(lucide_react_1.ChevronRight, { className: "h-4 w-4" }), (0, jsx_runtime_1.jsx)("span", { className: "font-medium", children: asset.name })] }, asset.id)))] }));
    };
    const handleNavigateToLevel = (index) => {
        // Navigate to the selected level in the hierarchy
        const newParentChain = parentChain.slice(0, index + 1);
        const newSelectedAsset = newParentChain[newParentChain.length - 1] || null;
        setParentChain(newParentChain);
        setSelectedAsset(newSelectedAsset);
    };
    const renderLoadingSkeleton = () => {
        return ((0, jsx_runtime_1.jsx)("div", { className: "space-y-4", children: [1, 2, 3].map((i) => ((0, jsx_runtime_1.jsx)("div", { className: "animate-pulse", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center space-x-2 py-2", children: [(0, jsx_runtime_1.jsx)("div", { className: "h-4 w-4 bg-gray-200 rounded" }), (0, jsx_runtime_1.jsx)("div", { className: "h-4 w-32 bg-gray-200 rounded" }), (0, jsx_runtime_1.jsx)("div", { className: "h-4 w-24 bg-gray-200 rounded" })] }) }, i))) }));
    };
    const renderAsset = (asset, level = 0) => {
        const isExpanded = expandedAssets.has(asset.id);
        const hasChildren = asset.children && asset.children.length > 0;
        const isCategory = hasChildren || level === 0; // Consider root level items and items with children as categories
        return ((0, jsx_runtime_1.jsxs)("div", { className: `transition-all duration-200 ease-in-out ${level > 0 ? 'ml-6' : ''}`, children: [(0, jsx_runtime_1.jsxs)("div", { className: `
          flex items-center justify-between p-2 rounded-md
          ${isCategory
                        ? 'bg-gray-50 border border-gray-200 hover:bg-gray-100 mb-2'
                        : 'hover:bg-gray-50 border-l-2 border-gray-200'}
        `, children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center space-x-2", children: [hasChildren ? ((0, jsx_runtime_1.jsx)("button", { onClick: () => handleAssetClick(asset), className: "text-gray-500 hover:text-gray-700", children: isExpanded ? (0, jsx_runtime_1.jsx)(lucide_react_1.ChevronDown, { className: "h-4 w-4" }) : (0, jsx_runtime_1.jsx)(lucide_react_1.ChevronRight, { className: "h-4 w-4" }) })) : ((0, jsx_runtime_1.jsx)("div", { className: "w-4 h-4 flex items-center justify-center", children: (0, jsx_runtime_1.jsx)("div", { className: "w-2 h-2 rounded-full bg-gray-400" }) })), (0, jsx_runtime_1.jsxs)("span", { className: `${isCategory ? 'font-semibold text-gray-700' : 'text-gray-600'}`, children: [asset.name, isCategory && asset.children && ((0, jsx_runtime_1.jsxs)("span", { className: "ml-2 text-xs text-gray-500", children: ["(", asset.children.length, " items)"] }))] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex space-x-2", children: [(0, jsx_runtime_1.jsx)("button", { onClick: () => handleEditAsset(asset), className: `${isCategory ? 'text-blue-600' : 'text-gray-500'} hover:text-blue-800`, title: "Edit asset", children: (0, jsx_runtime_1.jsx)(lucide_react_1.Edit2, { className: "h-4 w-4" }) }), (0, jsx_runtime_1.jsx)("button", { onClick: () => handleDeleteAsset(asset.id), className: `${isCategory ? 'text-red-600' : 'text-gray-500'} hover:text-red-800`, title: "Delete asset", children: (0, jsx_runtime_1.jsx)(lucide_react_1.Trash2, { className: "h-4 w-4" }) }), (0, jsx_runtime_1.jsx)("button", { onClick: () => handleAddChild(asset), className: "text-green-600 hover:text-green-800", title: "Add child asset", children: (0, jsx_runtime_1.jsx)(lucide_react_1.Plus, { className: "h-4 w-4" }) })] })] }), isExpanded && hasChildren && ((0, jsx_runtime_1.jsx)("div", { className: "mt-2 space-y-2 pl-4 border-l border-gray-200", children: asset.children?.map(child => renderAsset(child, level + 1)) }))] }, asset.id));
    };
    if (loading) {
        return ((0, jsx_runtime_1.jsxs)("div", { className: "bg-white rounded-lg shadow p-6", children: [(0, jsx_runtime_1.jsx)("div", { className: "animate-pulse mb-4", children: (0, jsx_runtime_1.jsx)("div", { className: "h-6 w-48 bg-gray-200 rounded" }) }), renderLoadingSkeleton()] }));
    }
    if (error) {
        return ((0, jsx_runtime_1.jsx)("div", { className: "bg-red-50 border border-red-200 rounded-lg p-6", children: (0, jsx_runtime_1.jsx)("div", { className: "text-red-600", children: error }) }));
    }
    return ((0, jsx_runtime_1.jsxs)("div", { className: "bg-white rounded-lg shadow", children: [(0, jsx_runtime_1.jsxs)("div", { className: "p-6", children: [renderBreadcrumbs(), (0, jsx_runtime_1.jsxs)("div", { className: "flex justify-between items-center mb-6", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center space-x-4", children: [parentChain.length > 0 && ((0, jsx_runtime_1.jsxs)("button", { onClick: handleGoBack, className: "flex items-center text-blue-600 hover:text-blue-800", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.ArrowLeft, { className: "w-5 h-5 mr-2" }), "Back to ", parentChain.length === 1 ? 'Root' : parentChain[parentChain.length - 2].name] })), (0, jsx_runtime_1.jsx)("h1", { className: "text-2xl font-bold", children: selectedAsset ? `Children of ${selectedAsset.name}` : 'Root Assets' })] }), (0, jsx_runtime_1.jsxs)("button", { onClick: () => setIsAddModalOpen(true), className: "flex items-center bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Plus, { className: "w-5 h-5 mr-2" }), "Add ", selectedAsset ? 'Child' : 'Root', " Asset"] })] }), (0, jsx_runtime_1.jsx)("div", { className: "space-y-2", children: assets.map(asset => renderAsset(asset)) })] }), isAddModalOpen && ((0, jsx_runtime_1.jsx)("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4", children: (0, jsx_runtime_1.jsxs)("div", { className: "bg-white rounded-lg p-6 max-w-lg w-full", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex justify-between items-center mb-4", children: [(0, jsx_runtime_1.jsx)("h2", { className: "text-xl font-semibold", children: "Add New Asset" }), (0, jsx_runtime_1.jsx)("button", { onClick: () => setIsAddModalOpen(false), className: "text-gray-500 hover:text-gray-700", children: (0, jsx_runtime_1.jsx)(lucide_react_1.X, { size: 24 }) })] }), (0, jsx_runtime_1.jsx)(AssetForm_1.default, { onSubmit: handleSubmitAsset, onCancel: () => setIsAddModalOpen(false) })] }) })), isAttributeManagerOpen && editingAsset && ((0, jsx_runtime_1.jsx)("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50", children: (0, jsx_runtime_1.jsxs)("div", { className: "bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex justify-between items-center mb-4", children: [(0, jsx_runtime_1.jsxs)("h2", { className: "text-xl font-semibold", children: ["Edit Attributes - ", editingAsset.name] }), (0, jsx_runtime_1.jsx)("button", { onClick: handleCloseEdit, className: "text-gray-500 hover:text-gray-700", children: (0, jsx_runtime_1.jsx)(lucide_react_1.X, { size: 24 }) })] }), (0, jsx_runtime_1.jsx)(AssetAttributeManager_1.default, { assetId: editingAsset.id, onAttributesChange: () => {
                                // Refresh the assets list when attributes change
                                if (selectedAsset) {
                                    fetchChildren(selectedAsset.id);
                                }
                                else {
                                    fetchRootAssets();
                                }
                            } })] }) }))] }));
};
exports.AssetList = AssetList;
exports.default = exports.AssetList;
//# sourceMappingURL=AssetList.js.map