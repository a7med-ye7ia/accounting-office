import MainLayout from "../../../shared/layout/MainLayout";
import ContractBrowser from "../components/ContractBrowser";

export default function CompaniesPage({ basePath = "/companies" }) {
  return (
    <MainLayout hidePageHeader>
      <ContractBrowser basePath={basePath} />
    </MainLayout>
  );
}
