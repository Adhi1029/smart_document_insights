import React from 'react';
import { Sparkles, Github, ExternalLink } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { resetSession } from '../store/documentSlice';

const Layout = ({ children }) => {
    const dispatch = useDispatch();
    const { currentDocument } = useSelector((state) => state.document);

    return (
        <div className="min-h-screen flex flex-col bg-slate-50 font-sans">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-20 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center">
                        {/* Brand */}
                        <button
                            onClick={() => currentDocument && dispatch(resetSession())}
                            className="flex items-center gap-2.5 group cursor-pointer"
                            title={currentDocument ? "Start a new session" : ""}
                        >
                            <div className="relative">
                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-md">
                                    <Sparkles size={18} className="text-white" />
                                </div>
                            </div>
                            <div>
                                <h1 className="text-lg font-bold text-slate-900 leading-none tracking-tight">
                                    Smart <span className="gemini-gradient-text">Insights</span>
                                </h1>
                                <p className="text-[10px] text-slate-400 font-medium tracking-widest uppercase mt-0.5">
                                    Powered by Google Gemini
                                </p>
                            </div>
                        </button>

                        {/* Status badge & actions */}
                        <div className="flex items-center gap-3">
                            {currentDocument && (
                                <div className="hidden sm:flex items-center gap-2 bg-indigo-50 border border-indigo-100 text-indigo-700 px-3 py-1.5 rounded-full text-xs font-semibold">
                                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
                                    Active Session
                                </div>
                            )}
                            <a
                                href="http://localhost:8000/docs"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 hover:text-indigo-600 font-medium transition-colors"
                            >
                                <ExternalLink size={14} />
                                API Docs
                            </a>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main content */}
            <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col">
                {children}
            </main>

            {/* Footer */}
            <footer className="border-t border-slate-200 py-4 text-center text-xs text-slate-400">
                Smart Insights · Gemini RAG Pipeline · Responses may be inaccurate. Always verify critical information.
            </footer>
        </div>
    );
};

export default Layout;
