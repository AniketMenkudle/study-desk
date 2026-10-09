import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SettingsProvider } from "./context/SettingsContext";
import { AuthProvider } from "./context/AuthContext";
import { RequireAuth, PublicOnly } from "./components/RouteGuards";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AskQuestion from "./pages/AskQuestion";
import NotesSummaries from "./pages/NotesSummaries";
import QuizGenerator from "./pages/QuizGenerator";
import SavedQuizzes from "./pages/SavedQuizzes";
import QuizDetail from "./pages/QuizDetail";
import Reminders from "./pages/Reminders";
import "./index.css";

export default function App() {
  return (
    <SettingsProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
            <Route path="/register" element={<PublicOnly><Register /></PublicOnly>} />

            <Route element={<RequireAuth><Layout /></RequireAuth>}>
              <Route index element={<AskQuestion />} />
              <Route path="notes" element={<NotesSummaries />} />
              <Route path="quiz" element={<QuizGenerator />} />
              <Route path="library" element={<SavedQuizzes />} />
              <Route path="library/:id" element={<QuizDetail />} />
              <Route path="reminders" element={<Reminders />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </SettingsProvider>
  );
}
