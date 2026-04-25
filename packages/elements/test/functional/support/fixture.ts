const mounted: Element[] = [];

export function mount<T extends Element = Element>(html: string): T {
  const host = document.createElement('div');
  host.innerHTML = html.trim();
  const el = host.firstElementChild as T | null;
  if (!el) throw new Error('mount: html produced no element');
  document.body.appendChild(el);
  mounted.push(el);
  return el;
}

export function cleanup(): void {
  while (mounted.length > 0) {
    const el = mounted.pop();
    el?.remove();
  }
}
