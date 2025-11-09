import React from "react";
import { NavLink } from "react-router-dom";

const Sidebar: React.FC = () => {
  return (
    <aside className="w-64 bg-white border-r p-4">
      <div className="mb-6">
        <h2 className="text-xl font-bold">InfoSafe Lab</h2>
      </div>

      <nav className="flex flex-col gap-2">
        <NavLink to="/" end className={({isActive}) => isActive ? "font-semibold text-indigo-600" : ""}>
          Dashboard
        </NavLink>
        <NavLink to="/auth" className={({isActive}) => isActive ? "font-semibold text-indigo-600" : ""}>
          Auth
        </NavLink>
        <NavLink to="/tests/sql-injection" className={({isActive}) => isActive ? "font-semibold text-indigo-600" : ""}>
          Testes
        </NavLink>
        <NavLink to="/admin/audit" className={({isActive}) => isActive ? "font-semibold text-indigo-600" : ""}>
          Audit (admin)
        </NavLink>
      </nav>
    </aside>
  );
};

export default Sidebar;
