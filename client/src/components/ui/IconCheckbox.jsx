import { Check, X } from 'lucide-react';

export default function IconCheckbox({ label, checked, onChange }) {
    return (
        <label className="flex items-center cursor-pointer select-none space-x-2 w-32">
            <input
                type="checkbox"
                checked={checked}
                onChange={onChange}
                className="sr-only peer"
            />
            <div className={`w-6 h-6 flex items-center justify-center rounded transition-colors ${checked ? 'bg-rose-500' : 'bg-eclipse-800'} peer-focus:ring-2 peer-focus:ring-rose-500`}>
                {checked ? (
                    <Check size={18} />
                ) : (
                    <X size={18} />
                )}
            </div>
            {label && <span className="text-sm select-none">{label}</span>}
        </label>
    );
}