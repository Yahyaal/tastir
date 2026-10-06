import type { ReactNode } from 'react';

/**
 * A small Markdown reader for the project's own documents: headings,
 * paragraphs, lists (nested, with task boxes), tables, bold, italics, code
 * and links. Everything becomes React text, so nothing in a document can
 * inject HTML. `link` turns a link target into the address to open.
 */
export function Markdown({
  text,
  link,
}: {
  text: string;
  link: (href: string) => string;
}) {
  return <>{blocks(text.replace(/\r\n/g, '\n').split('\n'), link)}</>;
}

/** Bold, italics, code and links inside one line. */
export function inline(
  text: string,
  link: (href: string) => string,
): ReactNode[] {
  const out: ReactNode[] = [];
  const re =
    /(\*\*([^*]+)\*\*|\*([^*\s][^*]*)\*|`([^`]+)`|\[([^\]]+)\]\(([^)\s]+)\))/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const key = out.length;
    if (m[2] !== undefined)
      out.push(<strong key={key}>{inline(m[2], link)}</strong>);
    else if (m[3] !== undefined)
      out.push(<em key={key}>{inline(m[3], link)}</em>);
    else if (m[4] !== undefined) out.push(<code key={key}>{m[4]}</code>);
    else if (m[5] !== undefined && m[6] !== undefined) {
      const href = link(m[6]);
      const outside = /^https?:/.test(href);
      out.push(
        <a
          key={key}
          href={href}
          {...(outside ? { target: '_blank', rel: 'noreferrer' } : {})}
        >
          {inline(m[5], link)}
        </a>,
      );
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

const LIST = /^(\s*)([-*]|\d+\.)\s+(.*)$/;

function blocks(lines: string[], link: (href: string) => string): ReactNode[] {
  const out: ReactNode[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i] ?? '';
    const key = out.length;
    if (!line.trim()) {
      i++;
      continue;
    }
    const heading = /^(#{1,4})\s+(.*)$/.exec(line);
    if (heading) {
      const level = Math.min((heading[1] ?? '#').length + 1, 5);
      const Tag = `h${level}` as 'h2';
      out.push(<Tag key={key}>{inline(heading[2] ?? '', link)}</Tag>);
      i++;
      continue;
    }
    if (line.trimStart().startsWith('|')) {
      const rows: string[][] = [];
      while (i < lines.length && (lines[i] ?? '').trimStart().startsWith('|')) {
        const cells = (lines[i] ?? '')
          .trim()
          .replace(/^\||\|$/g, '')
          .split('|')
          .map((c) => c.trim());
        if (!cells.every((c) => /^:?-+:?$/.test(c))) rows.push(cells);
        i++;
      }
      const [head, ...body] = rows;
      out.push(
        <div className="md-table" key={key}>
          <table>
            {head ? (
              <thead>
                <tr>
                  {head.map((c, j) => (
                    <th key={j}>{inline(c, link)}</th>
                  ))}
                </tr>
              </thead>
            ) : null}
            <tbody>
              {body.map((r, k) => (
                <tr key={k}>
                  {r.map((c, j) => (
                    <td key={j}>{inline(c, link)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      );
      continue;
    }
    if (LIST.test(line)) {
      const start = i;
      while (
        i < lines.length &&
        (LIST.test(lines[i] ?? '') ||
          (/^\s+\S/.test(lines[i] ?? '') && i > start))
      )
        i++;
      out.push(<List key={key} lines={lines.slice(start, i)} link={link} />);
      continue;
    }
    const para: string[] = [];
    while (
      i < lines.length &&
      (lines[i] ?? '').trim() &&
      !/^#{1,4}\s/.test(lines[i] ?? '') &&
      !LIST.test(lines[i] ?? '') &&
      !(lines[i] ?? '').trimStart().startsWith('|')
    )
      para.push((lines[i++] ?? '').trim());
    out.push(<p key={key}>{inline(para.join(' '), link)}</p>);
  }
  return out;
}

/** One list, with deeper-indented items nested under the item above. */
function List({
  lines,
  link,
}: {
  lines: string[];
  link: (href: string) => string;
}) {
  const first = LIST.exec(lines[0] ?? '');
  const indent = first?.[1]?.length ?? 0;
  const ordered = /\d/.test(first?.[2] ?? '');
  const items: { text: string; children: string[] }[] = [];
  for (const line of lines) {
    const m = LIST.exec(line);
    if (m && (m[1] ?? '').length <= indent)
      items.push({ text: m[3] ?? '', children: [] });
    else if (items.length) {
      const last = items[items.length - 1];
      if (!last) continue;
      if (m || last.children.length) last.children.push(line);
      else last.text += ' ' + line.trim();
    }
  }
  const Tag = ordered ? 'ol' : 'ul';
  return (
    <Tag>
      {items.map((item, k) => {
        const box = /^\[( |x)\]\s+(.*)$/.exec(item.text);
        return (
          <li
            key={k}
            className={
              box ? (box[1] === 'x' ? 'task done' : 'task') : undefined
            }
          >
            {box ? (
              <span
                className="box"
                aria-label={box[1] === 'x' ? 'done' : 'to do'}
              >
                {box[1] === 'x' ? '✓' : ''}
              </span>
            ) : null}
            {inline(box ? (box[2] ?? '') : item.text, link)}
            {item.children.length ? (
              <List lines={item.children} link={link} />
            ) : null}
          </li>
        );
      })}
    </Tag>
  );
}
