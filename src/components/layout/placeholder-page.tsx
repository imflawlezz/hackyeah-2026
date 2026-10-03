export function PlaceholderPage({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="max-w-3xl">
      <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
        {title}
      </h1>
      <p className="mt-3 text-lg text-slate-800">{description}</p>
    </div>
  );
}
