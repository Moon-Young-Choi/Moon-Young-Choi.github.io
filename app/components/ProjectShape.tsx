export function ProjectShape({ type }: { type: string }) {
  return (
    <div className={`project-shape shape-${type}`} aria-hidden="true">
      {Array.from({ length: 12 }, (_, index) => <span key={index} />)}
    </div>
  );
}
