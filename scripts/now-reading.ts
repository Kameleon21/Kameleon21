// Reads `oku reading --json` from stdin and rewrites the block between the
// oku markers in README.md.
type UserBook = {
  CurrentPage: number;
  Book: { Title: string; Authors: string[] | null; Pages: number; Slug: string; ImageURL: string };
};

const START = "<!-- oku:start -->";
const END = "<!-- oku:end -->";
const BAR_WIDTH = 20;

const books: UserBook[] = JSON.parse(await Bun.stdin.text()) ?? [];

function render(ub: UserBook): string {
  const { Title, Authors, Pages, Slug, ImageURL } = ub.Book;
  const lines: string[] = [];
  if (ImageURL) lines.push(`<img align="left" width="64" src="${ImageURL}" alt="">`, "");
  lines.push(`**[${Title}](https://hardcover.app/books/${Slug})**<br>`);
  if (Authors?.length) lines.push(`${Authors.join(", ")}<br>`);
  if (Pages > 0) {
    const ratio = Math.min(ub.CurrentPage / Pages, 1);
    const filled = Math.round(ratio * BAR_WIDTH);
    const bar = "█".repeat(filled) + "░".repeat(BAR_WIDTH - filled);
    lines.push(`\`${bar}\` ${Math.round(ratio * 100)}% · p. ${ub.CurrentPage} of ${Pages}`);
  }
  lines.push("", `<br clear="left">`);
  return lines.join("\n");
}

const body = books.length
  ? books.map(render).join("\n\n")
  : "_Between books right now. Recommendations welcome._";

const path = "README.md";
const readme = await Bun.file(path).text();
const pattern = new RegExp(`${START}[\\s\\S]*?${END}`);
if (!pattern.test(readme)) throw new Error(`README.md is missing the ${START} / ${END} markers`);
await Bun.write(path, readme.replace(pattern, `${START}\n${body}\n${END}`));
