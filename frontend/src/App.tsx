import { Routes, Route } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout";
import DashboardPage from "./pages/DashboardPage";
import ProductsPage from "./pages/ProductsPage";
import MovementsPage from "./pages/MovementsPage";

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/productos" element={<ProductsPage />} />
        <Route path="/movimientos" element={<MovementsPage />} />
      </Route>
    </Routes>
  );
}