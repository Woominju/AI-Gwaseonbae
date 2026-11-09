"use client";
/** 상담 응답용 최소 마크다운 렌더러: 굵게, 글머리표, 인용, 근거 인용 [S-01] → 링크 */
import Link from "next/link";
import * as React from "react";

function inline(text: string, key: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|\[S-\d{2,3}\]|\[[A-Za-z]-?\d+\]|\[인용 제거됨\])/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const t = m[0];
    if (t.startsWith("**")) out.push(<b key={`${key}-${i++}`} className="font-semibold text-navy-900">{t.slice(2, -2)}</b>);
    else if (t === "[인용 제거됨]") out.push(<span key={`${key}-${i++}`} className="rounded bg-rose-50 px-1 text-xs text-rose-700">인용 제거됨</span>);
    else {
      const id = t.slice(1, -1);
      out.push(
        <Link key={`${key}-${i++}`} href={`/seniors/${id}`} className="mx-0.5 inline-flex items-center rounded-md bg-teal-50 px-1.5 py-0 text-xs font-semibold text-teal-700 ring-1 ring-teal-200 hover:bg-teal-100" title="근거 선배 기록 보기 (가상)">
          {id}
        </Link>,
      );
    }
    last = m.index + t.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function Markdown({ text }: { text: string }) {
  const lines = text.split("\n");
  const blocks: React.ReactNode[] = [];
  let list: string[] = [];
  const flush = (k: number) => {
    if (list.length) {
      blocks.push(
        <ul key={`ul-${k}`} className="my-1.5 list-disc space-y-1 pl-5">
          {list.map((l, i) => (
            <li key={i}>{inline(l, `li-${k}-${i}`)}</li>
          ))}
        </ul>,
      );
      list = [];
    }
  };
  lines.forEach((ln, k) => {
    const t = ln.trimEnd();
    if (/^\s*[-*•]\s+/.test(t)) list.push(t.replace(/^\s*[-*•]\s+/, ""));
    else {
      flush(k);
      if (!t.trim()) blocks.push(<div key={k} className="h-2" />);
      else if (t.startsWith("> ")) blocks.push(<p key={k} className="rounded-lg bg-amber-50 px-3 py-1.5 text-xs text-amber-900">{inline(t.slice(2), `q-${k}`)}</p>);
      else if (/^#{1,4}\s/.test(t)) blocks.push(<p key={k} className="mt-1 font-bold text-navy-900">{inline(t.replace(/^#{1,4}\s/, ""), `h-${k}`)}</p>);
      else blocks.push(<p key={k}>{inline(t, `p-${k}`)}</p>);
    }
  });
  flush(lines.length);
  return <div className="space-y-0.5 text-[15px] leading-relaxed text-slate-800">{blocks}</div>;
}
