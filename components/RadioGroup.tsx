import React from 'react';

interface RadioGroupProps {
    legend: string;
    name: string;
    options: readonly string[];
    selectedValue: string | undefined;
    onChange: (value: string) => void;
    orientation?: 'vertical' | 'horizontal';
}

const RadioGroup: React.FC<RadioGroupProps> = ({ legend, name, options, selectedValue, onChange, orientation = 'vertical' }) => {
    const containerClass = orientation === 'horizontal' 
        ? 'flex flex-wrap items-center gap-x-6 gap-y-2'
        : 'space-y-2';
    
    return (
        <fieldset>
            <legend className="block text-sm font-medium text-gray-700 mb-2">{legend}</legend>
            <div className={containerClass}>
                {options.map(option => (
                    <div key={option} className="flex items-center">
                        <input
                            id={`${name}-${option.replace(/\s+/g, '-')}`} // Make id more robust
                            name={name}
                            type="radio"
                            value={option}
                            checked={selectedValue === option}
                            onChange={(e) => onChange(e.target.value)}
                            className="h-4 w-4 text-brand-primary focus:ring-brand-light border-gray-300"
                        />
                        <label htmlFor={`${name}-${option.replace(/\s+/g, '-')}`} className="ml-2 block text-sm text-gray-900">
                            {option}
                        </label>
                    </div>
                ))}
            </div>
        </fieldset>
    );
};

export default RadioGroup;
