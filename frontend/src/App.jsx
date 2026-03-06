import React from 'react';
import Layout from './components/Layout';
import FileUpload from './components/FileUpload';
import ChatInterface from './components/ChatInterface';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';

function App() {
  const { currentDocument } = useSelector((state) => state.document);

  return (
    <Layout>
      <div className="flex flex-col h-full relative">
        <AnimatePresence mode="popLayout">
          {(!currentDocument) && (
            <motion.div
              key="uploader"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <FileUpload />

              <div className="mt-16 text-center max-w-4xl mx-auto opacity-70">
                <h3 className="text-sm uppercase tracking-widest font-bold text-gray-500 mb-4">Core Capabilities</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div>
                    <h4 className="font-semibold text-gray-700">Semantic Search</h4>
                    <p className="text-sm mt-1 text-gray-500">Find exactly what you are looking for by meaning, not just exact keywords.</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-700">Instant Extraction</h4>
                    <p className="text-sm mt-1 text-gray-500">Ask the AI to accurately pull clauses, figures, and facts from dense text.</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-700">Enterprise Ready</h4>
                    <p className="text-sm mt-1 text-gray-500">Secure edge deployments and robust LangChain intelligence infrastructure.</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {currentDocument && (
            <motion.div
              key="chat"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="flex-1 flex flex-col"
            >
              <div className="mb-2 w-full max-w-4xl mx-auto flex items-center justify-between">
                <span className="text-xs uppercase font-bold tracking-wider text-primary-600 bg-primary-50 px-3 py-1 rounded-full border border-primary-100 inline-block">
                  Active Session
                </span>

                <span className="text-sm font-medium text-gray-500">
                  Document: <span className="font-semibold text-gray-700">{currentDocument}</span>
                </span>
              </div>

              <ChatInterface />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
}

export default App;
