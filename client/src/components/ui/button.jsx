import React from 'react';

export default function Button({ onClick, children, variant = 'default', disabled, className = '' }) {
    const base =
        'px-4 py-2 rounded transition-all disabled:opacity-40 disabled:pointer-events-none hover:scale-110 cursor-pointer duration-100';

    const variants = {
        default: 'bg-eclipse-800 hover:text-rose-500',
        primary: 'bg-lagoon-600 hover:bg-lagoon-700',
        danger: 'bg-rose-600 hover:bg-rose-700',
    };

    return (
        <button onClick={onClick} className={`${base} ${variants[variant]} ${className}`} disabled={disabled}>
            {children}
        </button>
    );
}
