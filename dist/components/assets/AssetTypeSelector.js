"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssetTypeSelector = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const react_router_dom_1 = require("react-router-dom");
const icons_1 = require("../../utils/icons");
const react_hot_toast_1 = __importDefault(require("react-hot-toast"));
const API_BASE_URL = 'http://localhost:3000/api';
const AssetTypeSelector = () => {
    const [types, setTypes] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [error, setError] = (0, react_1.useState)(null);
    const navigate = (0, react_router_dom_1.useNavigate)();
    (0, react_1.useEffect)(() => {
        fetchTypes();
    }, []);
    const fetchTypes = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_BASE_URL}/asset-types`);
            if (!response.ok)
                throw new Error('Failed to fetch asset types');
            const data = await response.json();
            if (!data.data) {
                throw new Error('No data received');
            }
            // Transform the data to ensure consistent ID handling
            const transformedData = data.data.map((type) => ({
                ...type,
                id: type.id || 0,
                attributes: type.attributes || []
            }));
            setTypes(transformedData);
        }
        catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to load asset types';
            setError(message);
            console.error('Error fetching asset types:', err);
            react_hot_toast_1.default.error(message);
        }
        finally {
            setLoading(false);
        }
    };
    const handleTypeSelect = (typeId) => {
        navigate(`/assets/${typeId}`);
    };
    if (loading) {
        return ((0, jsx_runtime_1.jsx)("div", { className: "flex items-center justify-center min-h-[400px]", children: (0, jsx_runtime_1.jsx)("div", { className: "text-gray-600", children: "Loading asset types..." }) }));
    }
    if (error) {
        return ((0, jsx_runtime_1.jsx)("div", { className: "bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded", children: error }));
    }
    return ((0, jsx_runtime_1.jsxs)("div", { className: "space-y-6", children: [(0, jsx_runtime_1.jsxs)("div", { className: "border-b border-gray-200 pb-5", children: [(0, jsx_runtime_1.jsx)("h2", { className: "text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight", children: "Select Asset Type" }), (0, jsx_runtime_1.jsx)("p", { className: "mt-2 text-sm text-gray-500", children: "Choose an asset type to view and manage its assets" })] }), (0, jsx_runtime_1.jsx)("div", { className: "grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3", children: types.map((type) => ((0, jsx_runtime_1.jsxs)("button", { onClick: () => handleTypeSelect(type.id), className: "relative flex flex-col items-center p-6 bg-white rounded-lg shadow transition-all duration-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500", children: [(0, jsx_runtime_1.jsx)("div", { className: "flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full", children: (0, jsx_runtime_1.jsx)(icons_1.UsersIcon, { className: "w-6 h-6 text-blue-600" }) }), (0, jsx_runtime_1.jsx)("h3", { className: "mt-4 text-lg font-medium text-gray-900", children: type.name }), (0, jsx_runtime_1.jsxs)("p", { className: "mt-1 text-sm text-gray-500", children: ["View and manage ", type.name.toLowerCase(), " assets"] }), (0, jsx_runtime_1.jsx)("div", { className: "absolute top-0 right-0 p-4", children: (0, jsx_runtime_1.jsx)("div", { className: "flex items-center justify-center w-8 h-8 bg-blue-50 rounded-full", children: (0, jsx_runtime_1.jsx)("span", { className: "text-sm font-medium text-blue-600", children: "\u2192" }) }) })] }, type.id))) })] }));
};
exports.AssetTypeSelector = AssetTypeSelector;
exports.default = exports.AssetTypeSelector;
//# sourceMappingURL=AssetTypeSelector.js.map