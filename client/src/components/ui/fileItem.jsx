import React from 'react';
import { X } from 'lucide-react';

export default function FileItem({ file, onRemove }) {
    return (
        <div className="flex justify-center items-center rounded px-3 py-2 text-sm text-center shadow-glow bg-eclipse-800">
            <span className="truncate w-4/5" title={file.name}>{file.name}</span>
            <button
                onClick={onRemove}
                className="ml-2 text-rose-500 hover:text-rose-700 cursor-pointer hover:scale-110"
                title="Entfernen"
            >
                <X size={46}/>
            </button>
        </div>
    );
}
