import Link from "next/link";
import { logoutAction } from "@/lib/actions";
import { getCurrentUser, isManager } from "@/lib/auth/session";
import { SubmitButton } from "./SubmitButton";

export async function Nav() {
  const user = await getCurrentUser();
  const manager = isManager(user);

  return (
    <header className="nav">
      <div className="nav-inner">
        <Link href="/events" className="nav-brand">
          UBB Events
        </Link>
        <nav className="nav-links" aria-label="Primary">
          <Link href="/events">Events</Link>
          {user ? (
            <>
              <Link href="/my/registrations">My registrations</Link>
              {manager ? <Link href="/dashboard">Dashboard</Link> : null}
              <span className="nav-user" title={user.email}>
                {user.displayName}
              </span>
              <form action={logoutAction} className="nav-logout">
                <SubmitButton variant="secondary" pendingLabel="Signing out…">
                  Sign out
                </SubmitButton>
              </form>
            </>
          ) : (
            <>
              <Link href="/login">Sign in</Link>
              <Link href="/register" className="nav-cta">
                Create account
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
