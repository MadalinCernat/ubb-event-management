import { Suspense } from "react";
import styles from "./page.module.css";

type DatabaseHealth = {
  connected: true;
  databaseTime: string;
};

async function getDatabaseHealth(): Promise<DatabaseHealth> {
  const apiBaseUrl = process.env.API_BASE_URL ?? "http://localhost:3001";
  const response = await fetch(`${apiBaseUrl}/health/database`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Backend returned ${response.status}`);
  }

  return response.json() as Promise<DatabaseHealth>;
}

async function DatabaseStatus() {
  const database = await getDatabaseHealth();

  return (
    <>
      <p>Next.js successfully called the NestJS backend.</p>
      <p>
        PostgreSQL: <strong>{database.connected ? "connected" : "offline"}</strong>
      </p>
      <p>Database time: {database.databaseTime}</p>
    </>
  );
}

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className={styles.intro}>
          <h1>UBB Event Management</h1>
          <Suspense fallback={<p>Checking PostgreSQL connection...</p>}>
            <DatabaseStatus />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
