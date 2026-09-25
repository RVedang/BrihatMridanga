"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="container">
      <div className="page-intro">
        <h1>We couldn’t load this page.</h1>
        <p>Please try again in a moment. Your saved reports are unaffected.</p>
        <button onClick={reset} className="button">
          Try again
        </button>
      </div>
    </div>
  );
}
