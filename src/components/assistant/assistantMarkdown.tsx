import type { ReactNode } from "react";

function parseInline(text: string, keyBase: string): ReactNode {
  const re = /\*\*([^*]+)\*\*|\[([^\]]+)\]\(([^)]+)\)/g;
  const out: ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) {
      out.push(
        <span key={`${keyBase}-t-${k++}`}>{text.slice(last, m.index)}</span>,
      );
    }
    if (m[1] !== undefined) {
      out.push(<strong key={`${keyBase}-b-${k++}`}>{m[1]}</strong>);
    } else {
      out.push(
        <a
          key={`${keyBase}-a-${k++}`}
          href="#"
          className="cursor-pointer text-primary-600 underline decoration-primary-600/30 underline-offset-2 hover:text-primary-700"
          onClick={(e) => e.preventDefault()}
        >
          {m[2]}
        </a>,
      );
    }
    last = re.lastIndex;
  }
  if (last < text.length) {
    out.push(<span key={`${keyBase}-t-${k++}`}>{text.slice(last)}</span>);
  }
  if (out.length === 0) return text;
  if (out.length === 1) return out[0];
  return <>{out}</>;
}

/**
 * Renders a small markdown subset: ## / ### headings, numbered lists with nested `-` bullets,
 * top-level `-` lists, paragraphs, **bold**, and [label](url) links.
 */
export function renderAssistantMarkdown(markdown: string): ReactNode {
  const lines = markdown.split("\n");
  const blocks: ReactNode[] = [];
  let i = 0;
  let blockIdx = 0;

  while (i < lines.length) {
    const line = lines[i] ?? "";
    const t = line.trim();

    if (t === "") {
      i++;
      continue;
    }

    if (t.startsWith("### ")) {
      blocks.push(
        <h3
          key={`b-${blockIdx++}`}
          className="text-sm font-semibold text-slate-900"
        >
          {parseInline(t.slice(4), `h3-${blockIdx}`)}
        </h3>,
      );
      i++;
      continue;
    }

    if (t.startsWith("## ")) {
      blocks.push(
        <h2
          key={`b-${blockIdx++}`}
          className="text-base font-semibold text-slate-900"
        >
          {parseInline(t.slice(3), `h2-${blockIdx}`)}
        </h2>,
      );
      i++;
      continue;
    }

    if (/^\d+\.\s/.test(t)) {
      const olKey = `ol-${blockIdx++}`;
      const items: ReactNode[] = [];
      let liIdx = 0;

      while (i < lines.length) {
        const T = lines[i]!.trim();
        if (/^\d+\.\s/.test(T)) {
          const mainText = T.replace(/^\d+\.\s*/, "");
          const subs: string[] = [];
          i++;
          while (i < lines.length) {
            const subLine = lines[i]!;
            const subT = subLine.trim();
            if (subT.startsWith("- ")) {
              subs.push(subT.slice(2));
              i++;
            } else if (subT === "") {
              i++;
              break;
            } else if (
              /^\d+\.\s/.test(subT) ||
              subT.startsWith("###") ||
              subT.startsWith("##")
            ) {
              break;
            } else {
              break;
            }
          }
          items.push(
            <li key={`${olKey}-li-${liIdx}`} className="pl-0">
              <div>{parseInline(mainText, `${olKey}-m-${liIdx}`)}</div>
              {subs.length > 0 ? (
                <ul className="mt-1.5 list-disc space-y-1 pl-4 text-slate-700">
                  {subs.map((s, si) => (
                    <li key={si}>{parseInline(s, `${olKey}-s-${liIdx}-${si}`)}</li>
                  ))}
                </ul>
              ) : null}
            </li>,
          );
          liIdx++;
        } else {
          break;
        }
      }
      blocks.push(
        <ol
          key={olKey}
          className="list-decimal space-y-3 pl-4 marker:font-medium marker:text-slate-800"
        >
          {items}
        </ol>,
      );
      continue;
    }

    if (t.startsWith("- ")) {
      const ulKey = `ul-${blockIdx++}`;
      const items: string[] = [];
      while (i < lines.length) {
        const L = lines[i]!;
        if (L.trim().startsWith("- ")) {
          items.push(L.trim().slice(2));
          i++;
        } else {
          break;
        }
      }
      blocks.push(
        <ul
          key={ulKey}
          className="list-disc space-y-2 pl-4 marker:text-slate-800"
        >
          {items.map((b, bi) => (
            <li key={bi}>{parseInline(b, `${ulKey}-${bi}`)}</li>
          ))}
        </ul>,
      );
      continue;
    }

    const paraLines: string[] = [];
    const paraStart = i;
    while (i < lines.length) {
      const L = lines[i]!;
      const lt = L.trim();
      if (lt === "") break;
      if (lt.startsWith("#")) break;
      if (/^\d+\.\s/.test(lt)) break;
      if (lt.startsWith("- ")) break;
      paraLines.push(L);
      i++;
    }
    /** Guard: if we didn't consume anything (e.g. partial markdown like "##" during streaming),
     *  treat this line as plain text and advance so the outer loop can't spin. */
    if (i === paraStart) {
      paraLines.push(line);
      i++;
    }
    const pText = paraLines.join(" ");
    if (pText.length > 0) {
      blocks.push(
        <p key={`b-${blockIdx++}`} className="text-slate-800">
          {parseInline(pText, `p-${blockIdx}`)}
        </p>,
      );
    }
  }

  return (
    <div className="space-y-2.5 text-sm leading-relaxed [&_a]:break-words">
      {blocks}
    </div>
  );
}
