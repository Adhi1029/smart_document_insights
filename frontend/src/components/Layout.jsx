import React from 'react';
import { BookOpen } from 'lucide-react';

const Layout = ({ children }) => {
    return (
        <div className="min-h-screen flex flex-col bg-surface-50 font-sans">
            <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center">
                        <div className="flex items-center gap-2">
                            <div className="bg-primary-600 p-2 rounded-lg text-white">
                                <BookOpen size={24} />
                            </div>
                            <h1 className="text-xl font-bold text-surface-900 tracking-tight">Antigravity</h1>
                            <span className="text-sm font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full ml-2">Smart Insights</span>
                        </div>
                    </div>
                </div>
            </header>

            <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col">
                {children}
            </main>
        </div>
    );
};

export default Layout;
