/** A titled section of a long document page (legal notices, statements). */
export function DocumentSection({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="mt-10 space-y-4">
      <h2 id={id} className="text-2xl font-bold">
        {title}
      </h2>
      {children}
    </section>
  );
}

/** States that a page holds prototype text that the owner still has to approve. */
export function PrototypeNotice({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-5 border-l-4 border-warning bg-muted p-4">{children}</p>
  );
}
