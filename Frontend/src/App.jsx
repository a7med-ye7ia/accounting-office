import { Navigate, Route, Routes, useParams } from "react-router-dom";
import CompaniesDirectoryPage from "./features/companies/pages/CompaniesDirectoryPage";
import CompanyProfilePage from "./features/companies/pages/CompanyProfilePage";
// import ContractAiPage from "./features/contracts/pages/ContractAiPage";
import ContractBrowserPage from "./features/contracts/pages/ContractBrowserPage";
// import EditContractAiPage from "./features/contracts/pages/EditContractAiPage";
import DashboardPage from "./features/dashboard/pages/DashboardPage";
import DepartmentsPage from "./features/departments/pages/DepartmentsPage";
import DocumentsPage from "./features/documents/pages/DocumentsPage";
import EmployeeManagementPage from "./features/employees/pages/EmployeeManagementPage";
import EmployeeProfilePage from "./features/employees/pages/EmployeeProfilePage";
// import EquilibriumLedgerPage from "./features/ledger/pages/EquilibriumLedgerPage";
import EmployeeTasksPage from "./features/tasks/pages/EmployeeTasksPage";
import AssignedTasksDashboard from "./features/tasks/pages/AssignedTasksDashboard";
import LoginPage from "./features/login/LoginPage";
import ProtectedRoute from "./components/ProtectedRoute";

function LegacyEmployeeProfileRedirect() {
  const { id } = useParams();
  return <Navigate replace to={`/profile/${id}`} />;
}

function App() {
  return (
    <Routes>
      {/* <Route path="/" element={<Navigate replace to="/Dashboard" />} /> */}
      <Route path="/" element={<LoginPage />} />
      {/* <Route path="/login" element={<login />} /> */}
      <Route element={<ProtectedRoute />}>
        <Route path="/Dashboard" element={<DashboardPage />} />
        <Route path="/CompaniesDirectory" element={<CompaniesDirectoryPage />} />
        <Route path="/Documents" element={<DocumentsPage />} />
        <Route path="/CompanyProfile" element={<CompanyProfilePage />} />
        <Route path="/EmployeeManagement" element={<EmployeeManagementPage />} />
        <Route path="/profile/:id" element={<EmployeeProfilePage />} />
        <Route path="/EmployeeProfile/:id" element={<LegacyEmployeeProfileRedirect />} />
        <Route path="/EmployeeTasks" element={<EmployeeTasksPage />} />
        <Route path="/Departments" element={<DepartmentsPage />} />
        {/* // <Route path="/ContractAi" element={<ContractAiPage />} /> */}
        {/* // <Route path="/EditContractAi" element={<EditContractAiPage />} /> */}
        {/* // <Route path="/EquilibriumLedger" element={<EquilibriumLedgerPage />} /> */}
        <Route path="/ContractBrowser" element={<ContractBrowserPage />} />
        <Route path="/AssignedTasks" element={<AssignedTasksDashboard />} />
        <Route path="/ContractBrowser/company/:companyId" element={<ContractBrowserPage />}/>
        <Route path="/ContractBrowser/company/:companyId/type/:type/Ai" element={<ContractBrowserPage />}/>
        <Route path="/ContractBrowser/company/:companyId/type/:type" element={<ContractBrowserPage />}/>
        <Route path="/ContractBrowser/company/:companyId/type/:type/pdf/:pdfId" element={<ContractBrowserPage />}/>
      </Route>
    </Routes>
  );
}

export default App;