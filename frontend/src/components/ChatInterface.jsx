import React, { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { sendQueryAction, summarizeDocumentAction, clearError } from '../store/documentSlice';
import { Send, User, Bot, AlertCircle, FileSearch, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import ReactMarkdown from 'react-markdown';

const ChatInterface = () => {
    const [inputStr, setInputStr] = useState('');
    const dispatch = useDispatch();
    const { messages, isQuerying, queryError, isSummarizing, summaryError, currentDocument, chunksEmbedded } = useSelector((state) => state.document);
    const bottomRef = useRef(null);
    const textareaRef = useRef(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isQuerying, isSummarizing]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!inputStr.trim() || isQuerying || isSummarizing) return;

        // Optimistic UI update
        dispatch({ type: 'document/addMessage', payload: { role: 'user', content: inputStr } });
        dispatch(sendQueryAction(inputStr));
        setInputStr('');

        // Reset textarea height
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
        }
    };

    const handleSummarize = () => {
        if (!currentDocument || isSummarizing || isQuerying) return;
        dispatch({ type: 'document/addMessage', payload: { role: 'user', content: '📋 Generate an executive summary of this document.' } });
        dispatch(summarizeDocumentAction(currentDocument));
    };

    const handleTextareaChange = (e) => {
        setInputStr(e.target.value);
        // Auto-resize
        e.target.style.height = 'auto';
        e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
    };

    const isProcessing = isQuerying || isSummarizing;
    const error = queryError || summaryError;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col flex-1 mt-6 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden glow-card"
        >
            {/* Chat Header */}
            <div className="bg-gradient-to-r from-slate-50 to-indigo-50/30 px-6 py-4 border-b border-slate-100 sticky top-0 z-10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-md">
                        <Bot size={18} className="text-white" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-slate-800 leading-none">Document Assistant</h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                            {chunksEmbedded ? `${chunksEmbedded} chunks · ` : ''}{currentDocument}
                        </p>
                    </div>
                </div>

                {/* Summarize button */}
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSummarize}
                    disabled={isProcessing}
                    className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-md hover:shadow-lg transition-shadow disabled:opacity-60 disabled:cursor-not-allowed"
                >
                    <Sparkles size={14} className="fill-white" />
                    Summarize Document
                </motion.button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5 min-h-[400px] max-h-[560px]">
                {messages.map((msg, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25 }}
                        className={clsx(
                            "flex gap-3 max-w-[88%]",
                            msg.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
                        )}
                    >
                        {/* Avatar */}
                        <div className={clsx(
                            "flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-sm",
                            msg.role === 'user'
                                ? "bg-slate-700"
                                : msg.type === 'summary'
                                    ? "bg-gradient-to-br from-violet-500 to-purple-600"
                                    : "bg-gradient-to-br from-indigo-500 to-violet-600"
                        )}>
                            {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                        </div>

                        {/* Bubble */}
                        <div className={clsx(
                            "rounded-2xl px-5 py-4 shadow-sm text-sm",
                            msg.role === 'user'
                                ? "bg-slate-100 text-slate-800 rounded-tr-sm"
                                : msg.type === 'summary'
                                    ? "bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-100 text-slate-800 rounded-tl-sm"
                                    : "bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 text-slate-800 rounded-tl-sm"
                        )}>
                            {msg.type === 'summary' && (
                                <div className="flex items-center gap-1.5 text-violet-600 font-bold text-xs uppercase tracking-wider mb-3 pb-2 border-b border-violet-100">
                                    <FileSearch size={13} />
                                    AI-Generated Summary
                                </div>
                            )}

                            <div className="prose prose-sm prose-slate max-w-none leading-relaxed">
                                <ReactMarkdown>{msg.content}</ReactMarkdown>
                            </div>

                            {/* Sources */}
                            {msg.sources && msg.sources.length > 0 && msg.sources[0] !== 'Unknown' && (
                                <div className="mt-3 pt-3 border-t border-indigo-100">
                                    <p className="text-xs font-bold text-indigo-500 uppercase tracking-wider mb-1.5">Sources</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {msg.sources.map((src, i) => (
                                            <span key={i} className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">
                                                {src}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                ))}

                {/* Typing indicator */}
                {isProcessing && (
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex gap-3 max-w-[88%] mr-auto"
                    >
                        <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-sm">
                            <Bot size={16} />
                        </div>
                        <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 rounded-2xl rounded-tl-sm px-5 py-4 shadow-sm flex items-center gap-3">
                            <div className="flex gap-1 text-indigo-400">
                                <div className="typing-dot"></div>
                                <div className="typing-dot"></div>
                                <div className="typing-dot"></div>
                            </div>
                            <span className="text-xs text-indigo-500 font-medium">
                                {isSummarizing ? 'Generating summary with Gemini...' : 'Analyzing document context...'}
                            </span>
                        </div>
                    </motion.div>
                )}

                {/* Error */}
                <AnimatePresence>
                    {error && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex items-start gap-3 bg-red-50 text-red-700 p-4 rounded-xl border border-red-200 max-w-[88%] mr-auto"
                        >
                            <AlertCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="text-xs font-bold uppercase tracking-wide text-red-500 mb-0.5">Error</p>
                                <p className="text-sm font-medium">{error}</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div ref={bottomRef} />
            </div>

            {/* Input area */}
            <div className="p-4 bg-white border-t border-slate-100">
                <form onSubmit={handleSubmit} className="relative max-w-4xl mx-auto">
                    <div className="gradient-border relative rounded-2xl border border-slate-200 shadow-sm bg-white overflow-hidden transition-all focus-within:shadow-md focus-within:border-indigo-300">
                        <textarea
                            ref={textareaRef}
                            value={inputStr}
                            onChange={handleTextareaChange}
                            placeholder="Ask a question about the document..."
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSubmit(e);
                                }
                            }}
                            rows={1}
                            disabled={isProcessing}
                            className="block w-full resize-none bg-transparent py-4 pl-5 pr-16 text-sm text-slate-800 placeholder-slate-400 font-medium focus:outline-none min-h-[56px] max-h-[200px] leading-relaxed disabled:opacity-70"
                        />

                        <button
                            type="submit"
                            disabled={!inputStr.trim() || isProcessing}
                            className="absolute right-2 bottom-2 w-10 h-10 bg-gradient-to-br from-indigo-500 to-violet-600 text-white rounded-xl flex items-center justify-center shadow-md hover:shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
                            aria-label="Send message"
                        >
                            <Send size={16} className="translate-x-[1px]" />
                        </button>
                    </div>

                    <p className="text-center mt-2.5 text-xs text-slate-400">
                        Press <kbd className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-500 font-mono text-[10px]">Enter</kbd> to send · <kbd className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-500 font-mono text-[10px]">Shift+Enter</kbd> for new line
                    </p>
                </form>
            </div>
        </motion.div>
    );
};

export default ChatInterface;
