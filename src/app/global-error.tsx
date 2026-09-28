"use client";
import "./globals.css";

export default function GlobalError({ retry }: { retry: () => void }) {
  return (
    <html lang="en">
      <body>
        <main className="container">
          <div className="page-intro">
            <h1>Something went wrong.</h1>
            <p>Please try again in a moment. Your saved reports are unaffected.</p>
            <button onClick={() => retry()} className="button">
              Try again
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
