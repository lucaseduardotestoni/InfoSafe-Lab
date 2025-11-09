import React from "react";

const AdminPanel: React.FC = () => {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Painel Avançado (Admin)</h2>
      <p className="text-sm text-gray-600 mb-4">
        Links rápidos:
      </p>
      <div className="flex gap-3">
        <a href="/admin/audit" className="px-4 py-2 bg-indigo-600 text-white rounded">Auditoria</a>
        <a href="/admin/tests" className="px-4 py-2 bg-indigo-600 text-white rounded">Testes Admin</a>
      </div>
    </div>
  );
};

export default AdminPanel;
