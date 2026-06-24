import { useParams } from "react-router-dom";
import MainLayout from "../../../shared/layout/MainLayout";
import ActivityHistory from "./ActivityHistory";

function ActivityHistoryPage() {
  const { companyId } = useParams();

  return (
    <MainLayout title="سجل النشاطات" subtitle="Activity History">
      <ActivityHistory companyId={companyId} />
    </MainLayout>
  );
}

export default ActivityHistoryPage;
