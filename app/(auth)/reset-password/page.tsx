// app/(auth)/reset-password/page.tsx
import ResetPasswordForm from "@/components/pages/ResetPasswordForm";
import { Suspense } from "react";




export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}