export function Asset({ name, className = '' }: { name: string; className?: string }) {
  return <img alt="" className={className} src={`/assets/${name}`} />;
}
