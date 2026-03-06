import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { uploadDocument, queryDocument, summarizeDocument } from '../services/api';

export const uploadFileAction = createAsyncThunk(
    'document/upload',
    async (file, { rejectWithValue }) => {
        try {
            const response = await uploadDocument(file);
            return { file, response };
        } catch (err) {
            return rejectWithValue(err.response?.data?.detail || 'Upload failed. Please try again.');
        }
    }
);

export const sendQueryAction = createAsyncThunk(
    'document/query',
    async (query, { rejectWithValue }) => {
        try {
            const response = await queryDocument(query);
            return { query, response };
        } catch (err) {
            return rejectWithValue(err.response?.data?.detail || 'Query failed. Please try again.');
        }
    }
);

export const summarizeDocumentAction = createAsyncThunk(
    'document/summarize',
    async (sourceName, { rejectWithValue }) => {
        try {
            const response = await summarizeDocument(sourceName);
            return response;
        } catch (err) {
            return rejectWithValue(err.response?.data?.detail || 'Summarization failed. Please try again.');
        }
    }
);

const initialState = {
    isUploading: false,
    uploadError: null,
    currentDocument: null,
    chunksEmbedded: null,

    messages: [], // { role: 'user' | 'assistant', content: string, sources?: [], type?: 'summary' }
    isQuerying: false,
    queryError: null,

    isSummarizing: false,
    summaryError: null,
};

const documentSlice = createSlice({
    name: 'document',
    initialState,
    reducers: {
        clearError: (state) => {
            state.uploadError = null;
            state.queryError = null;
            state.summaryError = null;
        },
        addMessage: (state, action) => {
            state.messages.push(action.payload);
        },
        resetSession: (state) => {
            state.currentDocument = null;
            state.chunksEmbedded = null;
            state.messages = [];
            state.uploadError = null;
            state.queryError = null;
            state.summaryError = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // Upload
            .addCase(uploadFileAction.pending, (state) => {
                state.isUploading = true;
                state.uploadError = null;
            })
            .addCase(uploadFileAction.fulfilled, (state, action) => {
                state.isUploading = false;
                state.currentDocument = action.payload.file.name;
                state.chunksEmbedded = action.payload.response.chunks_embedded;
                state.messages.push({
                    role: 'assistant',
                    content: `✅ Document **${action.payload.file.name}** has been processed successfully.\n\nI extracted and embedded **${action.payload.response.chunks_embedded} semantic chunks** using Google Gemini embeddings.\n\nYou can now:\n- **Ask questions** about the document's content\n- Click **"Summarize Document"** to get an AI-generated executive summary`,
                });
            })
            .addCase(uploadFileAction.rejected, (state, action) => {
                state.isUploading = false;
                state.uploadError = action.payload;
            })
            // Query
            .addCase(sendQueryAction.pending, (state) => {
                state.isQuerying = true;
                state.queryError = null;
            })
            .addCase(sendQueryAction.fulfilled, (state, action) => {
                state.isQuerying = false;
                state.messages.push({
                    role: 'assistant',
                    content: action.payload.response.answer,
                    sources: action.payload.response.sources
                });
            })
            .addCase(sendQueryAction.rejected, (state, action) => {
                state.isQuerying = false;
                state.queryError = action.payload;
            })
            // Summarize
            .addCase(summarizeDocumentAction.pending, (state) => {
                state.isSummarizing = true;
                state.summaryError = null;
            })
            .addCase(summarizeDocumentAction.fulfilled, (state, action) => {
                state.isSummarizing = false;
                state.messages.push({
                    role: 'assistant',
                    content: action.payload.summary,
                    type: 'summary'
                });
            })
            .addCase(summarizeDocumentAction.rejected, (state, action) => {
                state.isSummarizing = false;
                state.summaryError = action.payload;
            });
    }
});

export const { clearError, addMessage, resetSession } = documentSlice.actions;
export default documentSlice.reducer;
