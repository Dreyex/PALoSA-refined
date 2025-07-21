import React from 'react';
import FileItem from './FileItem';

export default function FileList({ files, onRemove }) {
    if (!files.length) return null;

    return (
        <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
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
