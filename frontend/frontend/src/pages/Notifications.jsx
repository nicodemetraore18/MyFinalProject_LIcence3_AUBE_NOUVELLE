export default function Notifications() {
  const notifications = [
    { id: 1, message: "Paiement des salaires de mai effectué", date: "10/05/2025" },
    { id: 2, message: "Projet Santé mis à jour", date: "09/05/2025" },
    { id: 3, message: "Nouvel employé ajouté: Aïcha Koné", date: "08/05/2025" },
  ];

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Notifications</h1>
      <ul className="bg-white shadow rounded-xl divide-y">
        {notifications.map(notif => (
          <li key={notif.id} className="p-4 hover:bg-gray-50">
            <p className="text-gray-800 font-medium">{notif.message}</p>
            <p className="text-sm text-gray-500">{notif.date}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
