import { Suspense } from "react";
import { LoginForm } from "@/app/_components/LoginForm";

function returnToOf(value: string | string[] | undefined): string {
  return typeof value === "string" ? value : "/events";
}

async function LoginContent({
  searchParams,
}: {
  searchParams: PageProps<"/login">["searchParams"];
}) {
  const returnTo = returnToOf((await searchParams).returnTo);
  return (
    <div className="panel" style={{ maxWidth: 520, margin: "0 auto" }}>
      <h1>Sign in</h1>
      <LoginForm returnTo={returnTo} />
    </div>
  );
}

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <Suspense fallback={<p>Loading…</p>}>
      <LoginContent searchParams={searchParams} />
    </Suspense>
  );
}
