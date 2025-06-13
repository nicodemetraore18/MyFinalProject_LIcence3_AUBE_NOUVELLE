// src/App.jsx
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from "./pages/Login";
import Dashboard from './pages/Dashboard';
import Employes from './pages/Employes';
import Projets from './pages/Projets';
import Paiements from './pages/Paiements';
import Parametres from "./pages/Parametres";
import Compte from "./pages/Compte";
import Notifications from "./pages/Notifications";
import Home from './pages/Home';
import Postes from "./pages/Postes";
import CalculerSalaire from "./pages/CalculerSalaire";
import Banques from "./pages/Banques";
import Rapports from "./pages/Rapports";
import Administration from "./pages/Administration";

import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './contexts/AuthContext';
import ErrorBoundary from "./components/ErrorBoundary";

// Composant pour protéger les routes
const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Route pour la connexion */}
        <Route path="/login" element={<Login />} />

        {/* Routes protégées avec layout */}
        <Route path="/" element={
  <ProtectedRoute>
    <ErrorBoundary>
      <Layout />
    </ErrorBoundary>
  </ProtectedRoute>
}>
          <Route index element={<Home />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="employes" element={<Employes />} />
          <Route path="projets" element={<Projets />} />
          <Route path="paiements" element={<Paiements />} />
          <Route path="parametres" element={<Parametres />} />
          <Route path="compte" element={<Compte />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="postes" element={<Postes />} />
          <Route path="calculer-salaire/:periodeId/:employeId" element={<CalculerSalaire />} />
          <Route path="/banques" element={<Banques />} />
          <Route path="/rapports" element={<Rapports />} />
          <Route path="administration" element={<Administration />} />
          {/* Route de test pour BulletinPaiePrint */}
        </Route>

        {/* Redirection */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
