import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Home,
  LayoutDashboard,
  Users,
  FolderKanban,
  CreditCard,
  Settings,
  Briefcase,
  ArrowLeft,
  Banknote,
  FileBarChart2
} from "lucide-react";
import { Bell, User } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useState, useEffect } from "react";
import axios from "../utils/axios";

export default function Layout() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  console.log("Utilisateur actuel :", user);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Navigation items
 const navItems = [
  { name: "Accueil", path: "/", icon: <Home size={20} /> },
  { name: "Dashboard", path: "/dashboard", icon: <LayoutDashboard size={20} /> },
  { name: "Employés", path: "/employes", icon: <Users size={20} /> },
  { name: "Projets", path: "/projets", icon: <FolderKanban size={20} /> },
  { name: "Postes", path: "/postes", icon: <Briefcase size={20} /> },
  { name: "Paiements", path: "/paiements", icon: <CreditCard size={20} /> },
  { name: "Banques", path: "/banques", icon: <Banknote size={20} /> }, // <-- Ajouté
  { name: "Rapports", path: "/rapports", icon: <FileBarChart2 size={20} /> }, // <-- Ajouté
  { name: "Paramètres", path: "/parametres", icon: <Settings size={20} /> }
];

  // State pour récupérer les paramètres de l'entreprise (modèle Parametre)
  const [parametre, setParametre] = useState(null);

  useEffect(() => {
    axios
      .get("/parametres/")
      .then((response) => {
        let data = response.data;
        // Si la réponse est un tableau (cas de pagination), on récupère le premier élément
        if (Array.isArray(data)) {
          if (data.length > 0) {
            data = data[0];
          }
        }
        setParametre(data);
      })
      .catch((error) =>
        console.error("Erreur de récupération des paramètres :", error)
      );
  }, []);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-gradient-to-b from-blue-500 to-indigo-600 text-white shadow-xl flex flex-col">
        {/* Logo et nom de l'entreprise */}
        <div className="h-16 flex items-center justify-center border-b border-gray-200 hover:scale-105 transition-transform duration-300">
          {parametre ? (
            <div className="flex items-center">
              {parametre.logo ? (
                <img
                  src={parametre.logo}
                  alt={parametre.nom_entreprise}
                  className="h-12 mr-2"
                />
              ) : null}
              <span className="text-2xl font-extrabold tracking-wide">
                {parametre.nom_entreprise}
              </span>
            </div>
          ) : (
            <span className="text-2xl font-extrabold tracking-wide">
              MuraPaie
            </span>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 
                  ${isActive ? "bg-blue-300 text-white scale-110" : "text-gray-100 hover:bg-blue-700 hover:text-white"}`}
              >
                <span
                  className={`transition-transform duration-200 ${
                    isActive ? "scale-110" : ""
                  }`}
                >
                  {item.icon}
                </span>
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col bg-gray-100">
        {/* Header */}
        <header className="bg-white shadow-md p-4 flex justify-between items-center border-b">
          <div className="flex items-center space-x-4">
            {/* Bouton Retour : affiché si l'user n'est pas déjà sur la page racine */}
            {location.pathname !== "/" && (
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-gray-200 rounded transition-colors duration-200"
              >
                <ArrowLeft size={24} className="text-gray-700" />
              </button>
            )}
            <span className="text-xl font-semibold text-blue-700">
              Dashboard
            </span>
          </div>

          <div className="flex items-center space-x-4">
            
            <div className="flex items-center gap-4">
              <Link
                to="/compte"
                className="flex items-center gap-2 hover:text-blue-600 transition"
              >
                <User size={24} className="text-gray-700" />
                <span className="text-sm text-gray-600">
                  {user?.username || "Utilisateur"}
                </span>
              </Link>
              <button
                onClick={handleLogout}
                className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition-all duration-200"
              >
                Déconnexion
              </button>
            </div>
          </div>
        </header>

        {/* Contenu */}
        <main className="flex-1 p-8 overflow-y-auto bg-gray-50 transition-all duration-300">
          <Outlet />
        </main>
         {/* Footer entreprise */}
        <footer className="w-full bg-blue-900 text-white text-center py-3 mt-auto">
          Solution conçue et développée par <span className="font-bold">Nicodeme TRAORE</span> &mdash; 
          Contact : <a href="mailto:nicodemetraore18@gmail.com" className="underline">nicodemetraore18@gmail.com</a> | 
          Tél : <a href="tel:+22675059161" className="underline">+226 75 05 91 61</a> | 
          © {new Date().getFullYear()}
        </footer>
      </div>
    </div>
  );
}
