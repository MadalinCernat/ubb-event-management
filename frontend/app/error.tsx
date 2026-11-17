"use client";

export default function GlobalError({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="notice" role="alert">
      <h1>Something went wrong</h1>
      <p>
        We couldn’t complete your request. The backend may be unavailable — please
        try again.
      </p>
      <button type="button" className="btn btn-primary" onClick={() => reset()}>
        Try again
      </button>
    </div>
  );
}
