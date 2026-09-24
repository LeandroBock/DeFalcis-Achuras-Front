import { Routes, Route, Navigate } from "react-router-dom";
import Categories from "./pages/Categories";
import Login from "./pages/Login";
import Layout from "./layouts/Layout";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import ProtectedRoute from "./components/ProtectedRoute";
import Customers from "./pages/Customers";
import Suppliers from "./pages/Suppliers";
import Purchases from "./pages/Purchases";
import Orders from "./pages/Orders";
import Payments from "./pages/Payments";
import Expenses from "./pages/Expenses";
import Employees from "./pages/Employees";
import Reports from "./pages/Reports";
import Inventory from "./pages/Inventory";
import SupplierPayments from "./pages/SupplierPayments";
import Receivables from './pages/Receivables';
import Payables from './pages/Payables';
import WhatsApp from "./pages/WhatsApp";

function App() {
  return (
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
  );
}

export default App;
