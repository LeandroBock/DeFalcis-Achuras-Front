import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

// Componentes estructurales (se mantienen estáticos para evitar parpadeos)
import Login from "./pages/Login";
import Layout from "./layouts/Layout";
import ProtectedRoute from "./components/ProtectedRoute";

// Importaciones dinámicas (Lazy Loading) para las páginas individuales
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Products = lazy(() => import("./pages/Products"));
const Categories = lazy(() => import("./pages/Categories"));
const Customers = lazy(() => import("./pages/Customers"));
const Suppliers = lazy(() => import("./pages/Suppliers"));
const Purchases = lazy(() => import("./pages/Purchases"));
const Orders = lazy(() => import("./pages/Orders"));
const Payments = lazy(() => import("./pages/Payments"));
const WhatsApp = lazy(() => import("./pages/WhatsApp"));
const Expenses = lazy(() => import("./pages/Expenses"));
const Employees = lazy(() => import("./pages/Employees"));
const Reports = lazy(() => import("./pages/Reports"));
const Receivables = lazy(() => import("./pages/Receivables"));
const Inventory = lazy(() => import("./pages/Inventory"));
const SupplierPayments = lazy(() => import("./pages/SupplierPayments"));
const Payables = lazy(() => import("./pages/Payables"));

function App() {
  return (
    // Suspense muestra una pantalla de carga mientras se descarga el archivo de la página solicitada
    <Suspense
      fallback={
        <div className="p-6 text-center text-gray-500">Cargando módulo...</div>
      }
    >
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/products" element={<Products />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/suppliers" element={<Suppliers />} />
            <Route path="/purchases" element={<Purchases />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/payments" element={<Payments />} />
            <Route path="/whatsapp" element={<WhatsApp />} />
            <Route path="/expenses" element={<Expenses />} />
            <Route path="/employees" element={<Employees />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/receivables" element={<Receivables />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/supplier-payments" element={<SupplierPayments />} />
            <Route path="/payables" element={<Payables />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Suspense>
  );
}

export default App;
