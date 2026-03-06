import axios from 'axios';

// Create an Axios instance pointing to the FastAPI backend
const api = axios.create({
    baseURL: 'http://localhost:8000',
});

export const uploadDocument = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
};

export const queryDocument = async (query) => {
    const response = await api.post('/query', { query });
    return response.data;
};

export default api;
