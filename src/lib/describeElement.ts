export function describeElement(element: Element): string {
  const tag = element.tagName.toLowerCase();

  if (element.id) {
    return `${tag}#${element.id}`;
  }

  const firstClass = element.classList[0];

  return firstClass ? `${tag}.${firstClass}` : tag;
}
