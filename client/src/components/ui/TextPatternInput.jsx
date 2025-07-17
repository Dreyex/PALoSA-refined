import { useState } from "react";
import { Plus, X } from "lucide-react";

export default function TextPatternInput() {
    const [text, setText] = useState("");
    const [entries, setEntries] = useState([]);

    const addEntry = () => {
        if (text.trim() !== "" && !entries.includes(text.trim())) {
            setEntries((prev) => [...prev, text.trim()]);
            setText("");
        }
    };
    const removeEntry = (entryToRemove) =>
        setEntries((prev) => prev.filter((item) => item !== entryToRemove));

    return (
        <div>
            <div className='flex items-center space-x-2 mb-4'>
                <input
                    type='text'
                    className='bg-eclipse-800 rounded-sm p-2 flex-grow'
                    placeholder='Suchmuster eingeben'
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                />
                <button
                    onClick={addEntry}
                    className='bg-steel-900 p-2 rounded-sm hover:text-rose-500 hover:scale-120 transition-all duration-100 cursor-pointer'
                >
                    <Plus />
                </button>
            </div>
            {entries.length > 0 && (
                <div className='rounded p-3 space-y-2 overflow-y-auto max-h-48 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-rose-700 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-steel-900'>
                    {entries.map((entry, idx) => (
                        <div
                            key={idx}
                            className='flex items-center justify-between bg-eclipse-800 rounded px-3 py-1 text-sm'
                        >
                            <span>{entry}</span>
                            <button
                                onClick={() => removeEntry(entry)}
                                className='text-rose-500 hover:text-rose-700 hover:cursor-pointer hover:scale-120 transition-all duration-100'
                                title='Entfernen'
                            >
                                <X size={32} />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
