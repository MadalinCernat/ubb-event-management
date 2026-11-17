import Link from "next/link";

export default function NotFound() {
  return (
    <div className="notice">
      <h1>Page not found</h1>
      <p>The page or event you’re looking for doesn’t exist.</p>
      <Link href="/events" className="btn btn-primary">
        Browse events
      </Link>
    </div>
  );
}
