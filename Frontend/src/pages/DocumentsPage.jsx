import AppShell from "../components/AppShell";

function DocumentsPage() {
  return (
    <AppShell title="Documents" subtitle="Document Management">
      <div className="rounded-2xl bg-appSurface p-6">
        <h3 className="text-xl font-bold">Document Repository</h3>
        <p className="mt-2 text-sm text-appSubtext">Upload, categorize, preview, and archive client accounting documents with fast filtering readiness for API integration.</p>
      </div>
    </AppShell>
  );
}

export default DocumentsPage;
