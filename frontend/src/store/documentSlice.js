import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { uploadDocument, queryDocument } from '../services/api';

export const uploadFileAction = createAsyncThunk(
    'document/upload',
    async (file, { rejectWithValue }) => {
        try {
            const response = await uploadDocument(file);
            return { file, response };
        } catch (err) {
            return rejectWithValue(err.response?.data?.detail || 'Upload failed');
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
            return rejectWithValue(err.response?.data?.detail || 'Query failed');
        }
    }
);

const initialState = {
    isUploading: false,
    uploadError: null,
    currentDocument: null,

    messages: [], // { role: 'user' | 'assistant', content: string, sources?: [] }
    isQuerying: false,
    queryError: null,
};

const documentSlice = createSlice({
    name: 'document',
    initialState,
    reducers: {
        clearError: (state) => {
            state.uploadError = null;
            state.queryError = null;
        },
        addMessage: (state, action) => {
            state.messages.push(action.payload);
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
                state.messages.push({
                    role: 'assistant',
                    content: `Document **${action.payload.file.name}** successfully processed. I extracted ${action.payload.response.chunks_embedded} chunks. What would you like to know?`,
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
            });
    }
});

export const { clearError, addMessage } = documentSlice.actions;
export default documentSlice.reducer;
