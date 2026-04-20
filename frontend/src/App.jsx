import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import UploadPage from "./pages/UploadPage";
import GalleryPage from "./pages/GalleryPage";
import PublicGalleryPage from "./pages/PublicGalleryPage";
import ResourcePage from "./pages/ResourcePage";
import SharePage from "./pages/SharePage";
import Docs from "./pages/Docs";
import ApiKeysPage from "./pages/ApiKeysPage";
import AccessResourcePage from "./pages/AccessResourcePage";
import HomePage from "./pages/HomePage";

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/public-gallery" element={<PublicGalleryPage />} />
            <Route path="/share/:id" element={<SharePage />} />
            <Route path="/access" element={<Layout><AccessResourcePage /></Layout>} />
            <Route path="/" element={<HomePage />} />

            <Route element={<ProtectedRoute withLayout={false} />}>
              <Route path="/resource" element={<ResourcePage />} />
            </Route>

            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/upload" element={<UploadPage />} />
              <Route path="/gallery" element={<GalleryPage />} />
              <Route path="/docs" element={<Docs />} />
              <Route path="/api-keys" element={<ApiKeysPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
