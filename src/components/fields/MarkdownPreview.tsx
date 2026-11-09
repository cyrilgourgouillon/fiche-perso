import { memo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';

const REMARK_PLUGINS = [remarkBreaks];

interface MarkdownPreviewProps {
  value: string;
  placeholder?: string;
}

/**
 * Rendered Markdown of a text area. Its own chunk: the Markdown parser is a large
 * share of the bundle and most sessions never switch a field to the visual mode.
 */
function MarkdownPreview({ value, placeholder }: MarkdownPreviewProps) {
  return value
    ? <ReactMarkdown remarkPlugins={REMARK_PLUGINS}>{value}</ReactMarkdown>
    : <span className="markdown-placeholder">{placeholder}</span>;
}

/** Parsing is the costly part: only redo it when the text changes. */
export default memo(MarkdownPreview);
