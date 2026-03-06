import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, FileText, Loader2, AlertCircle, CheckCircle2, Zap } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { uploadFileAction, clearError } from '../store/documentSlice';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

const FileUpload = () => {
    const dispatch = useDispatch();
    const { isUploading, uploadError } = useSelector((state) => state.document);

    const onDrop = useCallback((acceptedFiles) => {
        if (acceptedFiles?.length > 0) {
            dispatch(clearError());
            dispatch(uploadFileAction(acceptedFiles[0]));
        }
    }, [dispatch]);

    const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
        onDrop,
        accept: {
            'application/pdf': ['.pdf'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
            'application/msword': ['.doc']
        },
        maxFiles: 1,
        disabled: isUploading
    });

    return (
        <div className="w-full max-w-3xl mx-auto flex flex-col gap-8 pt-8">
            {/* Hero text */}
            <div className="text-center space-y-3">
                <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-100 text-indigo-600 px-3 py-1 rounded-full text-xs font-semibold mb-2">
                    <Zap size={12} className="fill-indigo-600" />
                    Google Gemini RAG Engine
                </div>
                <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight">
                    Document{' '}
                    <span className="gemini-gradient-text">Intelligence</span>
                </h2>
                <p className="text-slate-500 text-lg max-w-lg mx-auto">
                    Upload any document and ask complex questions. Our AI analyzes, understands, and extracts precise insights instantly.
                </p>
            </div>

            {/* Drop Zone */}
            <div
                {...getRootProps()}
                className={clsx(
                    "gradient-border relative group overflow-hidden border-2 border-dashed rounded-2xl p-12 transition-all duration-300 ease-in-out flex flex-col items-center justify-center gap-4 cursor-pointer min-h-[280px] bg-white glow-card",
                    isDragActive && !isDragReject && "border-indigo-500 bg-indigo-50/50",
                    !isDragActive && !isDragReject && "border-slate-200 hover:border-indigo-300 hover:bg-slate-50/50",
                    isDragReject && "border-red-400 bg-red-50",
                    isUploading && "opacity-60 cursor-not-allowed pointer-events-none"
                )}
            >
                <input {...getInputProps()} />

                <AnimatePresence mode="wait">
                    {isUploading ? (
                        <motion.div
                            key="loading"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col items-center gap-5"
                        >
                            <div className="relative">
                                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-xl">
                                    <Loader2 size={36} className="text-white animate-spin" />
                                </div>
                            </div>
                            <div className="text-center">
                                <p className="text-lg font-semibold text-slate-700">Processing Document...</p>
                                <p className="text-sm text-slate-500 mt-1">Extracting text, generating Gemini embeddings</p>
                            </div>
                            <div className="flex gap-1.5">
                                {[0, 1, 2, 3, 4].map((i) => (
                                    <motion.div
                                        key={i}
                                        className="w-2 h-2 rounded-full bg-indigo-400"
                                        animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
                                        transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.15 }}
                                    />
                                ))}
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="idle"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex flex-col items-center gap-5"
                        >
                            <div className={clsx(
                                "w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-300 group-hover:scale-105 group-hover:shadow-xl",
                                isDragActive && !isDragReject ? "bg-gradient-to-br from-indigo-500 to-violet-600 text-white" : "bg-gradient-to-br from-indigo-100 to-violet-100 text-indigo-600"
                            )}>
                                <UploadCloud size={36} />
                            </div>

                            <div className="text-center">
                                {isDragActive && !isDragReject ? (
                                    <p className="text-xl font-bold text-indigo-600">Release to upload</p>
                                ) : isDragReject ? (
                                    <p className="text-xl font-bold text-red-500">Unsupported file type</p>
                                ) : (
                                    <>
                                        <p className="text-xl font-semibold text-slate-700">
                                            Drop your document here
                                        </p>
                                        <p className="text-sm text-slate-400 mt-1">or click to browse files</p>
                                    </>
                                )}
                            </div>

                            <div className="flex items-center gap-3 text-xs font-semibold text-slate-500 bg-slate-100 px-5 py-2.5 rounded-full">
                                <span className="flex items-center gap-1.5">
                                    <FileText size={14} className="text-red-500" />
                                    PDF
                                </span>
                                <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                <span className="flex items-center gap-1.5">
                                    <FileText size={14} className="text-blue-500" />
                                    DOCX
                                </span>
                                <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                <span className="flex items-center gap-1.5">
                                    <FileText size={14} className="text-blue-400" />
                                    DOC
                                </span>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Error */}
            <AnimatePresence>
                {uploadError && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-xl flex items-start gap-3"
                    >
                        <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="font-semibold text-sm">Upload Error</p>
                            <p className="text-sm text-red-600 mt-0.5">{uploadError}</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Feature pills */}
            <div className="flex flex-wrap justify-center gap-3 mt-2">
                {[
                    { label: 'Semantic Search', color: 'bg-violet-50 text-violet-600 border-violet-100' },
                    { label: 'Instant Extraction', color: 'bg-blue-50 text-blue-600 border-blue-100' },
                    { label: 'Auto Summarization', color: 'bg-indigo-50 text-indigo-600 border-indigo-100' },
                    { label: 'Source Citations', color: 'bg-purple-50 text-purple-600 border-purple-100' },
                ].map((f) => (
                    <span key={f.label} className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${f.color}`}>
                        {f.label}
                    </span>
                ))}
            </div>
        </div>
    );
};

export default FileUpload;
