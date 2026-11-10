import { Routes, Route } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout";
import ProtectedRoute from "./features/auth/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import ProductsPage from "./pages/ProductsPage";
import MovementsPage from "./pages/MovementsPage";
import UsersPage from "./pages/UsersPage";
import SalesPage from "./pages/SalesPage";
import ContainersPage from "./pages/ContainersPage";
import BorrowingsPage from "./pages/BorrowingsPage";


export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/productos" element={<ProductsPage />} />
          <Route path="/movimientos" element={<MovementsPage />} />
           <Route path="/usuarios" element={<UsersPage />} />
          <Route path="/ventas" element={<SalesPage />} />
          <Route path="/baldes" element={<ContainersPage />} />
          <Route path="/prestamos" element={<BorrowingsPage />} />
        </Route>
      </Route>
    </Routes>
  );
}