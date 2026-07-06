import React from "react";
import { AdminLayout } from "../../components/layout/AdminLayout";
import { DashboardOverview } from "../../components/dashboard/DashboardOverview";

export default function DashboardScreen() {
  return (
    <AdminLayout title="Dashboard Overview">
      <DashboardOverview />
    </AdminLayout>
  );
}