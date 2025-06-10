import { Link } from 'react-router-dom';

export default function Navbar() {
  return (
    <nav className="bg-blue-600 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
        <h1 className="text-xl font-bold">MuraPaie</h1>
        <ul className="flex space-x-6 text-sm font-medium">
          <li><Link to="/dashboard" className="hover:text-yellow-300">Tableau de bord</Link></li>
          <li><Link to="/employes" className="hover:text-yellow-300">Employés</Link></li>
          <li><Link to="/projets" className="hover:text-yellow-300">Projets</Link></li>
          <li><Link to="/paiements" className="hover:text-yellow-300">Paiements</Link></li>
        </ul>
      </div>
    </nav>
  );
}
