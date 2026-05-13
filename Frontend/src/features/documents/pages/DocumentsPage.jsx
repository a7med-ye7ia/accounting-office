import MainLayout from "../../../shared/layout/MainLayout";

function DocumentsPage() {
  return (
    <MainLayout title="Documents" subtitle="Document Management">
      <div className="rounded-2xl border border-appBorder bg-appSurface p-6 shadow-panel">
        <h3 className="text-xl font-bold">Document Repository</h3>
        <p className="mt-2 text-sm text-appSubtext">Upload, organize, categorize, preview, and search all office and client files.</p>
      </div>
    </MainLayout>
  );
}

export default DocumentsPage;
