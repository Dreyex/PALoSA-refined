import React from 'react';

export default function FileInput({ accept, multiple, onChange, inputRef }) {
    return (
        <input
            ref={inputRef}
            type="file"
            accept={accept}
            multiple={multiple}
            hidden
            onChange={onChange}
        />
    );
}
