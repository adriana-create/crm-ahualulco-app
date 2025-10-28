import React from 'react';

// This reusable InputGroup component can wrap standard inputs or custom elements like <select>.
// The `value` and `onChange` props are optional to accommodate custom children that manage their own state.
const InputGroup: React.FC<{
    label: string;
    id: string;
    // FIX: Added 'email' to the list of allowed types to support email inputs.
    type?: 'text' | 'number' | 'date' | 'email';
    value?: string | number;
    onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
    children?: React.ReactNode;
    as?: 'input' | 'textarea';
    rows?: number;
    disabled?: boolean;
}> = ({ label, id, type = 'text', value, onChange, children, as = 'input', rows, disabled = false }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-gray-700">{label}</label>
        {children || (
            as === 'textarea' ? (
                <textarea
                    id={id}
                    value={value}
                    onChange={onChange}
                    rows={rows}
                    disabled={disabled}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
            ) : (
                <input
                    type={type}
                    id={id}
                    value={value}
                    onChange={onChange}
                    disabled={disabled}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
            )
        )}
    </div>
);

export default InputGroup;