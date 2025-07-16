import React from 'react';

export default function SelectFilesButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="bg-eclipse-800 hover:bg-rose-500 hover:scale-110 text-rose-500 px-4 py-2 rounded"
    >
      Dateien auswählen
    </button>
  );
}
