import { Suspense } from "react";
import { OrganizationForm } from "@/app/_components/OrganizationForm";
import { requireUser } from "@/lib/auth/session";

async function Content() {
  await requireUser("/dashboard/organizations/new");
  return (
    <div className="panel" style={{ maxWidth: 520 }}>
      <h1>Create organization</h1>
      <p className="muted">You will become its manager.</p>
      <OrganizationForm />
    </div>
  );
}

export default function NewOrganizationPage() {
  return (
    <Suspense fallback={<p>Loading…</p>}>
      <Content />
    </Suspense>
  );
}
