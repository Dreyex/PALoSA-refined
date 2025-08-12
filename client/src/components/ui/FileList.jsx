import React from 'react';
import FileItem from './FileItem';

export default function FileList({ files, onRemove }) {
    if (!files.length) return null;

    return (
        <div className="grid s:grid-cols-2 2xl:grid-cols-4 gap-6">
            {files.map((file, index) => (
                <FileItem
                    key={`${file.name}-${file.size}`}
                    file={file}
                    onRemove={() => onRemove(index)}
                />
            ))}
        </div>
    );
}
