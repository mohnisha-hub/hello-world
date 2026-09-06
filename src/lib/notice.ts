export function withNotice(path: string, message: string) {
  const url = new URL(path, "http://atelier.local");
  url.searchParams.set("notice", message);
  return `${url.pathname}${url.search}`;
}
