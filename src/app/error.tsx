"use client";

// Route-level error boundary so a thrown error (e.g. Supabase unreachable on load)
// shows a recoverable screen instead of a blank page.
export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-6 text-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo-icon.png?v=10" alt="BUILD" className="w-16 h-16 mb-3 opacity-80" />
      <h1 className="text-xl font-bold">Something went sideways</h1>
      <p className="text-slate text-sm mt-1 mb-5 max-w-xs">
        We hit a snag loading the app. Check your connection and try again.
      </p>
      <button
        onClick={reset}
        className="rounded-xl bg-forest text-bone font-semibold px-5 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/50"
      >
        Try again
      </button>
    </div>
  );
}
