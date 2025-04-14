interface Asset {
    id: number;
    name: string;
    type: string;
    id_parent: number | null;
    description?: string;
    children?: Asset[];
    attributes: VariableAttribute[];
    created_at?: string;
    updated_at?: string;
}
interface VariableAttribute {
    id: number;
    name: string;
    description?: string;
    format_data?: string;
    value?: string;
    asset_id: number;
    created_at?: string;
    updated_at?: string;
}
interface AssetType {
    id: number;
    name: string;
    description?: string;
    attributes?: VariableAttribute[];
    created_at?: string;
    updated_at?: string;
}
interface AssetFormData {
    name: string;
    type: string;
    attributes: {
        id: number;
        value: string;
    }[];
}
interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
}
export type { Asset, VariableAttribute, AssetType, ApiResponse, AssetFormData };
//# sourceMappingURL=index.d.ts.map