import { useState } from 'react';
import { Check, X } from 'lucide-react';

export default function IconCheckbox({ label, defaultChecked = false }) {
    const [checked, setChecked] = useState(defaultChecked);

    return (
        <label className="flex items-center gap-3 cursor-pointer select-none my-1 mx-auto">
            <input
                type="checkbox"
                checked={checked}
                onChange={() => setChecked(!checked)}
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
