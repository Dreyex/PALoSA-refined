import React from 'react';
import { Plus } from 'lucide-react';
import { Upload } from 'lucide-react';

function settingField({ showGroup, options, headline}) {
    return (
        <div className='bg-steel-950 w-1/4 rounded-md p-4 shadow-glow'>
            <h1 className='text-center p-4 text-2xl opacity-80 font-extrabold mb-4'> {headline} </h1>
            {showGroup && (
                <div className='flex flex-col space-y-4'>
                    <div className='flex items-center space-x-2 mb-8'>
                        
                        <div className='w-full'>
                            <label class="mb-2 text-md text-glacial-50" for="file_input">Config hochladen </label>
                            <input class="w-full text-md text-glacial-50 rounded-md cursor-pointer bg-eclipse-800 p-2" id="file_input" type="file" />
                            <p class="mt-1 text-xs text-glacial-50" id="file_input_help">CSV (mit Komma getrennt)</p>
                        </div>
                        
                        <button className='bg-steel-900 w-fit p-2 rounded-sm hover:text-lagoon-700 hover:scale-110 transition-all duration-100 cursor-pointer'> <Upload /> </button>
                    </div>
                    <div className='flex items-center space-x-2'>
                        <input type="text" placeholder="Enter text" className='bg-steel-900 rounded-sm p-2 flex-grow'/>
                        <button className='bg-steel-900 w-fit p-2 rounded-sm hover:text-evergreen-800 hover:scale-110 transition-all duration-100 cursor-pointer'> <Plus /> </button>
                    </div>
                </div>
            )}

            {options && Array.isArray(options) && options.length > 0 && (
                <div className='flex flex-col justify-center items-center p-4'>
                    {options.map((option, index) => (
                        <div key={index}>
                            <input type="checkbox" id={option} name={option} value={option} className='mr-2'/>
                            <label htmlFor={option}>{option}</label>
                        </div>
                        ))}
                </div>
            )}
        </div>
    );
}

export default settingField;
