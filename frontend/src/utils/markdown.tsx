import React from 'react';

type InlineToken =
  | { type: 'text'; value: string }
  | { type: 'strong'; value: string }
  | { type: 'code'; value: string };

function tokenizeInline(text: string): InlineToken[] {
  const tokens: InlineToken[] = [];
  let i = 0;

  const pushText = (value: string) => {
    if (value) tokens.push({ type: 'text', value });
  };

  while (i < text.length) {
    const nextStrong = text.indexOf('**', i);
    const nextCode = text.indexOf('`', i);
    const next =
      nextStrong === -1
        ? nextCode
        : nextCode === -1
          ? nextStrong
          : Math.min(nextStrong, nextCode);

    if (next === -1) {
      pushText(text.slice(i));
      break;
    }

    pushText(text.slice(i, next));

    // Inline code: `code`
    if (next === nextCode) {
      const end = text.indexOf('`', next + 1);
      if (end === -1) {
        pushText(text.slice(next));
        break;
      }
      tokens.push({ type: 'code', value: text.slice(next + 1, end) });
      i = end + 1;
      continue;
    }

    // Bold: **strong**
    const end = text.indexOf('**', next + 2);
    if (end === -1) {
      pushText(text.slice(next));
      break;
    }
    tokens.push({ type: 'strong', value: text.slice(next + 2, end) });
    i = end + 2;
  }

  return tokens;
}

export function renderInline(text: string): React.ReactNode {
  const tokens = tokenizeInline(text);
  return tokens.map((t, idx) => {
    if (t.type === 'strong') {
      return (
        <strong key={idx} className="font-semibold text-gray-900">
          {t.value}
        </strong>
      );
    }
    if (t.type === 'code') {
      return (
        <code
          key={idx}
          className="px-1.5 py-0.5 rounded-md bg-gray-100 border border-gray-200 font-mono text-[13px] text-gray-900"
        >
          {t.value}
        </code>
      );
    }
    return <span key={idx}>{t.value}</span>;
  });
}

export function renderAgentContent(content: string): React.ReactNode {
  const text = content.replace(/\r\n/g, '\n');
  const lines = text.split('\n');
  const blocks: React.ReactNode[] = [];

  let paragraph: string[] = [];
  let listItems: string[] = [];

  const flushParagraph = (key: string) => {
    if (paragraph.length === 0) return;
    const p = paragraph.join('\n').trimEnd();
    paragraph = [];
    if (!p) return;
    blocks.push(
      <p key={key} className="text-[15px] leading-7 text-gray-900 whitespace-pre-wrap">
        {renderInline(p)}
      </p>,
    );
  };

  const flushList = (key: string) => {
    if (listItems.length === 0) return;
    const items = listItems;
    listItems = [];
    blocks.push(
      <ul key={key} className="mt-2 mb-1 list-disc pl-6 space-y-1 text-[15px] leading-7">
        {items.map((it, idx) => (
          <li key={`${key}-li-${idx}`} className="text-gray-900">
            {renderInline(it)}
          </li>
        ))}
      </ul>,
    );
  };

  let keyCounter = 0;
  const nextKey = () => `b-${keyCounter++}`;

  for (let idx = 0; idx < lines.length; idx++) {
    const raw = lines[idx] ?? '';
    const line = raw.trimEnd();
    const trimmed = line.trim();

    // Blank line = paragraph/list boundary
    if (!trimmed) {
      flushList(nextKey());
      flushParagraph(nextKey());
      continue;
    }

    // Horizontal rule
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      flushList(nextKey());
      flushParagraph(nextKey());
      blocks.push(<hr key={nextKey()} className="my-5 border-gray-200" />);
      continue;
    }

    // Headings (## / ###)
    const h3 = trimmed.match(/^###\s+(.+)$/);
    const h2 = trimmed.match(/^##\s+(.+)$/);
    if (h2 || h3) {
      flushList(nextKey());
      flushParagraph(nextKey());
      const title = (h2?.[1] ?? h3?.[1] ?? '').trim();
      blocks.push(
        <h3
          key={nextKey()}
          className="mt-4 first:mt-0 text-[16px] leading-7 font-semibold text-gray-900"
        >
          {renderInline(title)}
        </h3>,
      );
      continue;
    }

    // Bulleted list lines: - / * / •
    const li =
      trimmed.match(/^[-*]\s+(.+)$/) ||
      trimmed.match(/^•\s+(.+)$/) ||
      trimmed.match(/^\u2022\s+(.+)$/);
    if (li) {
      flushParagraph(nextKey());
      listItems.push(li[1].trim());
      continue;
    }

    // Default: paragraph line
    flushList(nextKey());
    paragraph.push(line);
  }

  flushList(nextKey());
  flushParagraph(nextKey());

  return <div className="space-y-3">{blocks}</div>;
}
