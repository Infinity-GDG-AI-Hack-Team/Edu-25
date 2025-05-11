"use client"

import { useState } from 'react';
import Link from 'next/link';

export default function BraynrHeader() {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <div className="w-full bg-gray-900 py-4 px-6 flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center">
                <Link href="/" className="text-decoration-none">
                    <span className="text-4xl font-bold text-white">
                        <span className="text-cyan-400">B</span>raynr
                    </span>
                </Link>
                <div className="ml-2 mt-1">
                    <p className="text-xs text-gray-400 uppercase tracking-wider">
                        <span className="mr-2">LEARNING</span>
                        <span className="transform rotate-90 inline-block">➤</span>
                        <span className="ml-2">TRANSFORMED</span>
                    </p>
                </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center space-x-6">
                <Link href="/lenses" className="text-white hover:text-cyan-400 transition duration-200">Lenses</Link>
                <Link href="/" className="text-white hover:text-cyan-400 transition duration-200">Forum</Link>
                <Link
                    href="/graphs"
                    className={`px-6 py-2 rounded-full ${isHovered ? 'bg-cyan-400 text-gray-900' : 'bg-blue-500 text-white'} transition-all duration-300`}
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                >
                    Knowledge Graph
                </Link>
            </div>
        </div>
    );
}
