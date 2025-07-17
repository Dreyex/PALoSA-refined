import { Upload } from "lucide-react";

export default function FileUploadInput({headline, comment}) {
    return (
        <div className='flex items-center space-x-2 mb-8'>
            <div className='w-full'>
                <label
                    className='mb-2 text-md'
                    htmlFor='file_input'
                >
                    {headline}
                </label>
                <input
                    className='w-full text-md rounded-md cursor-pointer bg-eclipse-800 p-2'
                    id='file_input'
                    type='file'
                />
                <p
                    className='mt-1 text-xs'
                    id='file_input_help'
                >
                    {comment}
                </p>
            </div>
            <button className='bg-steel-900 p-2 rounded-sm hover:text-rose-500 hover:scale-120 transition-all duration-100 cursor-pointer'>
                <Upload />
            </button>
        </div>
    );
}
