import React, { useState } from 'react';
import { Plus, Upload, X } from 'lucide-react';

import IconCheckbox from './iconCheckbox';

function SettingField({ showFileInput = false, showTextInput = false, options, headline, comment = '' }) {
    const [text, setText] = useState('');
    const [entries, setEntries] = useState([]);

    const addEntry = () => {
        if (text.trim() !== '' && !entries.includes(text.trim())) {
            setEntries(prev => [...prev, text.trim()]);
            setText('');
        }
    };

    const removeEntry = (entryToRemove) => {
        setEntries(prev => prev.filter(item => item !== entryToRemove));
    };

    return (
        <div className='bg-steel-950 w-1/5 rounded-md p-4 shadow-glow'>
            <h1 className='text-center p-4 text-2xl opacity-80 font-extrabold'>{headline}</h1>
            <p className='mb-6 text-center text-sm opacity-80'> {comment}</p>

            {showFileInput && (
                <div className='flex items-center space-x-2 mb-8'>
                    <div className='w-full'>
                        <label className="mb-2 text-md text-glacial-50" htmlFor="file_input">Config hochladen</label>
                        <input
                            className="w-full text-md text-glacial-50 rounded-md cursor-pointer bg-eclipse-800 p-2"
                            id="file_input"
                            type="file"
                        />
                        <p className="mt-1 text-xs text-glacial-50" id="file_input_help">
                            CSV (mit Komma getrennt)
                        </p>
                    </div>
                    <button className='bg-steel-900 p-2 rounded-sm hover:text-lagoon-700 hover:scale-110 transition-all duration-100'>
                        <Upload />
                    </button>
                </div>
            )}

            {showTextInput && (
                <>
                    <div className='flex items-center space-x-2 mb-4'>
                        <input
                            type="text"
                            className='bg-eclipse-800 rounded-sm p-2 flex-grow'
                            placeholder='Suchmuster eingeben'
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                        />
                        <button
                            onClick={addEntry}
                            className='bg-steel-900 p-2 rounded-sm hover:text-evergreen-800 hover:scale-110 transition-all duration-100'
                        >
                            <Plus />
                        </button>
                    </div>

                    {entries.length > 0 && (
                        <div className={`rounded p-3 space-y-2 overflow-y-auto ${showTextInput && !showFileInput ? 'max-h-96' : 'max-h-48'} [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-rose-700 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-steel-900`}>
                            {entries.map((entry, index) => (
                                <div
                                    key={index}
                                    className="flex items-center justify-between bg-eclipse-800 rounded px-3 py-1 text-sm"
                                >
                                    <span>{entry}</span>
                                    <button
                                        onClick={() => removeEntry(entry)}
                                        className="text-rose-500 hover:text-rose-700 hover:curso-pointer hover:scale-110"
                                        title="Entfernen"
                                    >
                                        <X size={32} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}

            {options && Array.isArray(options) && options.length > 0 && (
                <div className="flex flex-col justify-center items-start p-4">
                    {options.map((option, index) => (
                        <IconCheckbox key={index} label={option} />
                    ))}
                </div>
            )}
        </div>
    );
}

export default SettingField;
