import MainLayout from "../layouts/MainLayout";

function AppShell({ title, subtitle, actions, children }) {
  return (
    <MainLayout title={title} subtitle={subtitle} actions={actions}>
      {children}
    </MainLayout>
  );
}

export default AppShell;
