import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import UploadPage from "./pages/UploadPage";
import GalleryPage from "./pages/GalleryPage";
import PublicGalleryPage from "./pages/PublicGalleryPage";
import WatchPage from "./pages/WatchPage";
import ImageViewPage from "./pages/ImageViewPage";
import ResourcePage from "./pages/ResourcePage";
import Docs from "./pages/Docs";

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/public-gallery" element={<PublicGalleryPage />} />
            <Route path="/watch" element={<WatchPage />} />
            <Route path="/image" element={<ImageViewPage />} />

            <Route element={<ProtectedRoute withLayout={false} />}>
              <Route path="/resource" element={<ResourcePage />} />
            </Route>

            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/upload" element={<UploadPage />} />
              <Route path="/gallery" element={<GalleryPage />} />
              <Route path="/docs" element={<Docs />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
