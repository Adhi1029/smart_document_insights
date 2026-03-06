import React, { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { sendQueryAction } from '../store/documentSlice';
import { Send, User, Bot, AlertCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import ReactMarkdown from 'react-markdown';

const ChatInterface = () => {
    const [inputStr, setInputStr] = useState('');
    const dispatch = useDispatch();
    const { messages, isQuerying, queryError } = useSelector((state) => state.document);
    const bottomRef = useRef(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isQuerying]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!inputStr.trim() || isQuerying) return;

        // Optimistic UI update
        dispatch({ type: 'document/addMessage', payload: { role: 'user', content: inputStr } });

        // Send to backend
        dispatch(sendQueryAction(inputStr));
        setInputStr('');
    };

    const hasMessages = messages.length > 0;

    if (!hasMessages) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col flex-1 mt-8 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden"
        >
            <div className="bg-surface-50 px-6 py-4 border-b border-gray-200 sticky top-0 z-10">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <Bot size={20} className="text-primary-600" /> Document Insights
                </h3>
                <p className="text-sm text-gray-500">Ask questions based on the uploaded contents.</p>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white min-h-[400px] max-h-[600px] scrollbar-thin">
                {messages.map((msg, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={clsx(
                            "flex gap-4 max-w-[85%]",
                            msg.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
                        )}
                    >
                        <div className={clsx(
                            "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white",
                            msg.role === 'user' ? "bg-surface-800 shadow-sm" : "bg-primary-600 shadow-md"
                        )}>
                            {msg.role === 'user' ? <User size={20} /> : <Bot size={20} />}
                        </div>

                        <div className={clsx(
                            "rounded-2xl px-6 py-4 shadow-sm",
                            msg.role === 'user' ? "bg-surface-100 text-surface-900 rounded-tr-sm" : "bg-primary-50 text-surface-900 rounded-tl-sm border border-primary-100"
                        )}>
                            <div className="prose prose-sm prose-primary max-w-none">
                                <ReactMarkdown>{msg.content}</ReactMarkdown>
                            </div>

                            {msg.sources && msg.sources.length > 0 && msg.sources[0] !== 'Unknown' && (
                                <div className="mt-4 pt-3 border-t border-primary-200/60">
                                    <p className="text-xs font-semibold text-primary-700 tracking-wide uppercase mb-1">Sources</p>
                                    <ul className="text-xs text-primary-600/80 list-disc list-inside">
                                        {msg.sources.map((src, i) => (
                                            <li key={i}>{src}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </motion.div>
                ))}

                {isQuerying && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex gap-4 max-w-[85%] mr-auto"
                    >
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary-600 shadow-md flex items-center justify-center text-white">
                            <Bot size={20} />
                        </div>
                        <div className="px-6 py-5 rounded-2xl bg-primary-50 text-surface-900 rounded-tl-sm border border-primary-100 flex items-center shadow-sm">
                            <Loader2 size={24} className="animate-spin text-primary-600" />
                            <span className="ml-3 font-medium text-primary-700">Analyzing document context...</span>
                        </div>
                    </motion.div>
                )}

                {queryError && (
                    <div className="flex items-center gap-3 bg-red-50 text-red-700 p-4 rounded-xl border border-red-200 max-w-[85%] mr-auto">
                        <AlertCircle size={20} className="text-red-500 flex-shrink-0" />
                        <p className="text-sm font-medium">{queryError}</p>
                    </div>
                )}

                <div ref={bottomRef} />
            </div>

            <div className="p-4 bg-white border-t border-gray-100">
                <form onSubmit={handleSubmit} className="relative max-w-4xl mx-auto flex items-end gap-2">
                    <div className="relative flex-1 rounded-2xl border border-gray-300 shadow-sm focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-primary-500 bg-white transition-all overflow-hidden text-left flex items-center pr-12 pb-1">
                        <textarea
                            value={inputStr}
                            onChange={(e) => setInputStr(e.target.value)}
                            placeholder="Ask a question about the document..."
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSubmit(e);
                                }
                            }}
                            rows={1}
                            className="resize-none appearance-none bg-transparent flex-1 py-4 pl-5 m-0 placeholder-gray-400 font-medium text-gray-800 focus:outline-none scrollbar-hide min-h-[56px] w-full"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={!inputStr.trim() || isQuerying}
                        className="flex-shrink-0 bg-primary-600 hover:bg-primary-700 text-white rounded-xl p-4 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm absolute right-1.5 bottom-1.5"
                        aria-label="Send Message"
                    >
                        <Send size={20} />
                    </button>
                </form>
                <div className="text-center mt-3 text-xs text-gray-400 font-medium">
                    Antigravity AI may produce inaccurate insights about complex documents. Verify critical information.
                </div>
            </div>
        </motion.div>
    );
};

export default ChatInterface;
