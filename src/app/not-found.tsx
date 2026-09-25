import Link from "next/link";
export default function NotFound() {
  return (
    <div className="container page-intro">
      <h1>Page not found</h1>
      <p>This page may have moved or is not available.</p>
      <Link className="button" href="/">
        Return home
      </Link>
    </div>
  );
}
