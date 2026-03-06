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
          {!currentDocument && (
            <motion.div
              key="uploader"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16, height: 0 }}
              transition={{ duration: 0.35 }}
            >
              <FileUpload />
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {currentDocument && (
            <motion.div
              key="chat"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex-1 flex flex-col"
            >
              <ChatInterface />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
}

export default App;
