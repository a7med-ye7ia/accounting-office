import MainLayout from "../../../shared/layout/MainLayout";
import ContractBrowser from "../../companiesManagment/components/ContractBrowser";

export default function ContractBrowserPage() {
  return (
    <MainLayout hidePageHeader>
      <ContractBrowser />
    </MainLayout>
  );
}