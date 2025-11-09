import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import SqlInjectionTest from "./pages/tests/SqlInjectionTest";
import XssTest from "./pages/tests/XssTest";
import CsrfTest from "./pages/tests/CsrfTest";
import LogSanitizationTest from "./pages/tests/LogSanitizationTest";
import RequireAuth from "./components/RequireAuth";
import Auth from "./pages/Auth"
import NotFound from "./pages/NotFound";
import UserAdmin from "./pages/UsersAdmin";
import Audit from "./pages/Audit"

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/auth" replace />} />
          <Route path="/auth" element={<Auth />} />
          {/*Dasboard*/}
          <Route
            path="/dashboard"
            element={
              <RequireAuth>
                <Dashboard />
              </RequireAuth>
            }/>
          {/* ADMIN */}
          <Route
            path="/admin/painel"
            element={
              <RequireAuth>
                <UserAdmin/>
              </RequireAuth>
            }
          />
         {/*Auditoria*/}
          <Route
            path="/admin/audit"
            element={
              <RequireAuth>
                <Audit />
              </RequireAuth>
            }/>
          {/**SQL Injection*/}
          <Route
          path="/tests/sql-injection" 
            element={
              <RequireAuth>
                <SqlInjectionTest/>
              </RequireAuth>
            }
          ></Route>
          {/**Xss*/}
          <Route
          path="/tests/Xss" 
            element={
              <RequireAuth>
                <XssTest/>
              </RequireAuth>
            }
          ></Route>
          {/**Csrf*/}
          <Route
          path="/tests/Csrf" 
            element={
              <RequireAuth>
                <CsrfTest/>
              </RequireAuth>
            }
          ></Route>
          {/**LogSanitization*/}
          <Route
          path="/tests/log-sanitization" 
            element={
              <RequireAuth>
                <LogSanitizationTest/>
              </RequireAuth>
            }
          ></Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
