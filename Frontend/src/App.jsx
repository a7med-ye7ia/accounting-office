import { Navigate, Route, Routes, useParams } from "react-router-dom";
import CompaniesPage from "./features/companies/pages/CompaniesPage";
import DashboardPage from "./features/dashboard/pages/DashboardPage";
import DepartmentsPage from "./features/departments/pages/DepartmentsPage";
import DocumentsPage from "./features/documents/pages/DocumentsPage";
import EmployeeManagementPage from "./features/employees/pages/EmployeeManagementPage";
import EmployeeProfilePage from "./features/employees/pages/EmployeeProfilePage";
import ActivityHistoryPage from "./features/activityLogs/pages/ActivityHistoryPage";
import EmployeeTasksPage from "./features/tasks/pages/EmployeeTasksPage";
import AssignedTasksDashboard from "./features/tasks/pages/AssignedTasksDashboard";
import LoginPage from "./features/login/LoginPage";
import ProtectedRoute from "./components/ProtectedRoute";
import PdfPage from "./features/companies/components/PdfPage";

function LegacyEmployeeProfileRedirect() {
  const { id } = useParams();
  return <Navigate replace to={`/profile/${id}`} />;
}

function LegacyContractBrowserRedirect() {
  const { companyId, type, pdfId } = useParams();
  let target = "/companies";

  if (companyId) {
    target += `/company/${companyId}`;
  }
  if (companyId && type) {
    target += `/type/${type}`;
  }
  if (companyId && type && pdfId) {
    target += `/pdf/${pdfId}`;
  }

  return <Navigate replace to={target} />;
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/Dashboard" element={<DashboardPage />} />
        <Route path="/companies" element={<CompaniesPage />} />
        <Route path="/companies/company/:companyId" element={<CompaniesPage />} />
        <Route path="/companies/company/:companyId/type/:type/Ai" element={<CompaniesPage />} />
        <Route path="/companies/company/:companyId/type/:type" element={<CompaniesPage />} />
        {/* <Route path="/companies/company/:companyId/type/establishment/pdf/:pdfId" element={<CompaniesPage />} /> */}
        <Route path="/companies/company/:companyId/type/amendment/pdf/:pdfId" element={<PdfPage />} />
        <Route path="/companies/company/:companyId/type/:type/pdf/:pdfId" element={<CompaniesPage />} />
        <Route path="/CompaniesDirectory" element={<Navigate replace to="/companies" />} />
        <Route path="/CompanyProfile" element={<Navigate replace to="/companies" />} />
        <Route path="/Documents" element={<DocumentsPage />} />
        <Route path="/EmployeeManagement" element={<EmployeeManagementPage />} />
        <Route path="/profile/:id" element={<EmployeeProfilePage />} />
        <Route path="/EmployeeProfile/:id" element={<LegacyEmployeeProfileRedirect />} />
        <Route path="/EmployeeTasks" element={<EmployeeTasksPage />} />
        <Route path="/Departments" element={<DepartmentsPage />} />
        <Route path="/ActivityHistory" element={<ActivityHistoryPage />} />
        <Route path="/ContractBrowser" element={<LegacyContractBrowserRedirect />} />
        <Route path="/ContractBrowser/company/:companyId" element={<LegacyContractBrowserRedirect />} />
        <Route path="/ContractBrowser/company/:companyId/type/:type/Ai" element={<LegacyContractBrowserRedirect />} />
        <Route path="/ContractBrowser/company/:companyId/type/:type" element={<LegacyContractBrowserRedirect />} />
        <Route path="/ContractBrowser/company/:companyId/type/:type/pdf/:pdfId" element={<LegacyContractBrowserRedirect />} />
        <Route path="/AssignedTasks" element={<AssignedTasksDashboard />} />
      </Route>
    </Routes>
  );
}

export default App;
