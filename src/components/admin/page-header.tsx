export function AdminPageHeader({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <header className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex max-w-2xl flex-col gap-2">
        <h1 className="text-2xl font-bold text-heading sm:text-3xl">{title}</h1>
        <p className="text-lg">{description}</p>
      </div>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </header>
  );
}

export function Notice({ children }: { children: React.ReactNode }) {
  return (
    <p
      role="status"
      className="rounded-md border border-warning bg-background px-4 py-3 text-base"
    >
      {children}
    </p>
  );
}
