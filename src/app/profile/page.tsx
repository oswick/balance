"use client";

import { PageHeader } from "@/components/page-header";
import ProtectedLayout from "../protected-layout";

export default function ProfilePage() {
  return (
    <ProtectedLayout>
      <PageHeader
        title="Profile"
        description="Manage your profile settings."
      />
      <div className="p-4">
        <p>This is the profile page. Content to be added.</p>
      </div>
    </ProtectedLayout>
  );
}
