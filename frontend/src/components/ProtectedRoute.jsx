import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/auth";
import Layout from "./Layout";

export default function ProtectedRoute({ withLayout = true }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!withLayout) {
    return <Outlet />;
  }

  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}
