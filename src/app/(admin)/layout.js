import { Suspense } from 'react';
import { AdminProvider } from "@/context/AdminContext";
import AdminLayout from "@/components/layout/AdminLayout";

export default function AdminRouteLayout({ children }) {
  return (
    <AdminProvider>
      <Suspense fallback={null}>
        <AdminLayout>
          {children}
        </AdminLayout>
      </Suspense>
    </AdminProvider>
  );
}
