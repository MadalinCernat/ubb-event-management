import { Suspense } from "react";
import { RegisterForm } from "@/app/_components/RegisterForm";

function returnToOf(value: string | string[] | undefined): string {
  return typeof value === "string" ? value : "/events";
}

async function RegisterContent({
  searchParams,
}: {
  searchParams: PageProps<"/register">["searchParams"];
}) {
  const returnTo = returnToOf((await searchParams).returnTo);
  return (
    <div className="panel" style={{ maxWidth: 520, margin: "0 auto" }}>
      <h1>Create account</h1>
      <RegisterForm returnTo={returnTo} />
    </div>
  );
}

export default function RegisterPage({ searchParams }: PageProps<"/register">) {
  return (
    <Suspense fallback={<p>Loading…</p>}>
      <RegisterContent searchParams={searchParams} />
    </Suspense>
  );
}
