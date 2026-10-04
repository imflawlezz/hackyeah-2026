export function PlaceholderPage({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="max-w-3xl">
      <h1 className="text-3xl font-bold">{title}</h1>
      <p className="mt-2.5 text-lg">{description}</p>
    </div>
  );
}
