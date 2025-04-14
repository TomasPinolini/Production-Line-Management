import { DynamicFormData, VariableAttribute } from '../types';
interface DynamicFormProps {
    participantTypeId: number;
    attributes: VariableAttribute[];
    onSubmit: (data: DynamicFormData) => Promise<void>;
    title: string;
}
export declare function DynamicForm({ participantTypeId, attributes, onSubmit, title }: DynamicFormProps): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=DynamicForm.d.ts.map