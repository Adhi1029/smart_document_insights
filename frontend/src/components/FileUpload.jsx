import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, FileText, AlertCircle, Loader2 } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { uploadFileAction, clearError } from '../store/documentSlice';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

const FileUpload = () => {
    const dispatch = useDispatch();
    const { isUploading, uploadError, currentDocument } = useSelector((state) => state.document);

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
        <div className="w-full max-w-3xl mx-auto flex flex-col gap-6 pt-10">
            <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold text-gray-900 tracking-tighter">Document Intelligence Engine</h2>
                <p className="text-gray-500 text-lg">Upload your contract, research paper, or report to instantly extract precise insights using AI.</p>
            </div>

            <div
                {...getRootProps()}
                className={clsx(
                    "relative group overflow-hidden border-2 border-dashed rounded-2xl p-12 transition-all duration-300 ease-in-out bg-white flex flex-col items-center justify-center gap-4 cursor-pointer min-h-[300px]",
                    isDragActive && !isDragReject ? "border-primary-500 bg-primary-50" : "border-gray-300 hover:border-primary-400 hover:bg-gray-50",
                    isDragReject && "border-red-500 bg-red-50",
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
                            className="flex flex-col items-center text-primary-600 gap-4"
                        >
                            <Loader2 size={48} className="animate-spin" />
                            <p className="text-lg font-medium">Analyzing document contents, generating embeddings...</p>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="idle"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex flex-col items-center gap-4 text-gray-500"
                        >
                            <div className="bg-primary-100 text-primary-600 p-4 rounded-full group-hover:scale-110 transition-transform duration-300">
                                <UploadCloud size={40} />
                            </div>
                            <div className="text-center">
                                <p className="text-lg font-semibold text-gray-700">Drag & drop your document here</p>
                                <p className="text-sm mt-1">or click to browse files</p>
                            </div>
                            <div className="flex gap-4 mt-2 text-xs font-medium bg-gray-100 px-4 py-2 rounded-lg">
                                <span className="flex items-center gap-1"><FileText size={14} /> PDF</span>
                                <span className="flex items-center gap-1"><FileText size={14} /> DOCX</span>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {uploadError && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-3"
                >
                    <AlertCircle size={20} className="text-red-500" />
                    <p className="font-medium text-sm">{uploadError}</p>
                </motion.div>
            )}
        </div>
    );
};

export default FileUpload;
