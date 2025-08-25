"use client";

import { PageHeader } from "@/components/page-header";
import ProtectedLayout from "../protected-layout";

export default function SettingsPage() {
  return (
    <ProtectedLayout>
      <PageHeader
        title="Settings"
        description="Manage your application settings."
      />
      <div className="p-4">
        <p>This is the settings page. Content to be added.</p>
      </div>
    </ProtectedLayout>
  );
}
