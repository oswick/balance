
"use client";

import React, { Suspense } from "react";
import { PageHeader } from "@/components/page-header";
import ProtectedLayout from "../protected-layout";
import { ProfileForm } from "./profile-form";
import { Loader2 } from "lucide-react";


export default function ProfilePage() {

  return (
    <ProtectedLayout>
      <PageHeader
        title="Profile"
        description="Manage your profile and account settings."
      />
      <Suspense fallback={<div className="flex items-center justify-center p-10"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
        <ProfileForm />
      </Suspense>
    </ProtectedLayout>
  );
}
