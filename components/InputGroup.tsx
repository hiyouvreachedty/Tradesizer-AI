import React from 'react';

interface InputGroupProps {
  label: string;
  value: number;
  onChange: (val: number) => void;
  prefix?: string;
  suffix?: string;
  step?: number;
}

export const InputGroup: React.FC<InputGroupProps> = ({ 
  label, 
  value, 
  onChange, 
  prefix, 
  suffix,
  step = 0.01 
}) => {
  return (
    <div className="flex flex-col space-y-1">
      <label className="text-sm font-medium text-slate-400">{label}</label>
      <div className="relative rounded-md shadow-sm">
        {prefix && (
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <span className="text-slate-500 sm:text-sm">{prefix}</span>
          </div>
        )}
        <input
          type="number"
          step={step}
          className={`block w-full rounded-md border-slate-700 bg-slate-800 py-2.5 text-white placeholder-slate-500 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${prefix ? 'pl-7' : 'pl-3'} ${suffix ? 'pr-8' : 'pr-3'}`}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        />
        {suffix && (
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
            <span className="text-slate-500 sm:text-sm">{suffix}</span>
          </div>
        )}
      </div>
    </div>
  );
};