import React from 'react';

export default function Card({ children }) {
    return (
        <div className="w-10/12 bg-steel-950 shadow-lg rounded-lg p-6 mx-auto">{children}</div>
    );
}
