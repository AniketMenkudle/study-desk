import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  withCredentials: true, // send/receive the httpOnly login cookie
});

// If the session expires while using the app, tell the AuthContext so it
// can send the user back to the login page.
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const url = err.config?.url || "";
    if (err.response?.status === 401 && !url.startsWith("/auth/")) {
      window.dispatchEvent(new Event("auth:expired"));
    }
    return Promise.reject(err);
  }
);

export const errorMessage = (err, fallback = "Something went wrong. Please try again.") =>
  err?.response?.data?.error || (err?.request && !err?.response ? "Can't reach the server. Is it running?" : fallback);

// ---- auth ----
export const registerUser = (payload) => api.post("/auth/register", payload).then((r) => r.data.user);
export const loginUser = (payload) => api.post("/auth/login", payload).then((r) => r.data.user);
export const logoutUser = () => api.post("/auth/logout").then((r) => r.data);
export const getMe = () => api.get("/auth/me").then((r) => r.data.user);

// ---- AI ----
export const askQuestion = (payload) => api.post("/ai/ask", payload).then((r) => r.data);
export const summarizeText = (payload) => api.post("/ai/summarize", payload).then((r) => r.data);
export const generateNotes = (payload) => api.post("/ai/notes", payload).then((r) => r.data);
export const generateQuiz = (payload) => api.post("/ai/quiz", payload).then((r) => r.data);

// ---- saved quizzes ----
export const listQuizzes = () => api.get("/quizzes").then((r) => r.data.quizzes);
export const getQuiz = (id) => api.get(`/quizzes/${id}`).then((r) => r.data.quiz);
export const saveAttempt = (id, payload) => api.post(`/quizzes/${id}/attempts`, payload).then((r) => r.data.attempt);
export const renameQuiz = (id, title) => api.patch(`/quizzes/${id}`, { title }).then((r) => r.data.title);
export const deleteQuiz = (id) => api.delete(`/quizzes/${id}`).then((r) => r.data);

// ---- reminders ----
export const getReminders = () => api.get("/reminders").then((r) => r.data);
export const addReminder = (payload) => api.post("/reminders", payload).then((r) => r.data);
export const toggleReminder = (id) => api.patch(`/reminders/${id}/toggle`).then((r) => r.data);
export const deleteReminder = (id) => api.delete(`/reminders/${id}`).then((r) => r.data);
export const clearReminders = () => api.delete("/reminders").then((r) => r.data);

export default api;
