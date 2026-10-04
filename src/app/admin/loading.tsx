// Shown inside the admin layout while a page's data loads, so a sidebar click
// gives feedback at once. The sidebar itself stays interactive.
export default function AdminLoading() {
  return (
    <div className="flex flex-col gap-6">
      <p role="status" className="text-lg font-semibold">
        Wczytujemy dane…
      </p>
      <div aria-hidden="true" className="flex flex-col gap-4">
        <div className="h-8 w-2/3 max-w-md rounded-md bg-muted motion-safe:animate-pulse" />
        <div className="h-5 w-full max-w-xl rounded-md bg-muted motion-safe:animate-pulse" />
        <ul className="flex flex-col gap-2.5">
          {[0, 1, 2].map((index) => (
            <li
              key={index}
              className="flex flex-col gap-2.5 rounded-md border border-border p-4 sm:p-5"
            >
              <div className="h-6 w-3/4 rounded-md bg-muted motion-safe:animate-pulse" />
              <div className="h-4 w-1/2 rounded-md bg-muted motion-safe:animate-pulse" />
              <div className="h-11 w-40 max-w-full rounded-md bg-muted motion-safe:animate-pulse" />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
