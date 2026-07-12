import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { CodeBlock } from "./CodeBlock";
import { memo } from "react";

interface MarkdownRendererProps {
  content: string;
}

const MarkdownRendererComponent = ({ content }: MarkdownRendererProps) => {
  return (
    <div className="prose prose-invert max-w-none text-slate-200 marker:text-slate-400 prose-p:leading-relaxed prose-pre:p-0 prose-pre:bg-transparent">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ ...props }) => <h1 className="text-xl font-semibold mt-4 mb-2 text-white" {...props} />,
          h2: ({ ...props }) => <h2 className="text-lg font-semibold mt-4 mb-2 text-white" {...props} />,
          h3: ({ ...props }) => <h3 className="text-base font-semibold mt-3 mb-2 text-white" {...props} />,
          ul: ({ ...props }) => <ul className="list-disc pl-5 my-2 space-y-1" {...props} />,
          ol: ({ ...props }) => <ol className="list-decimal pl-5 my-2 space-y-1" {...props} />,
          li: ({ ...props }) => <li className="pl-1" {...props} />,
          a: ({ ...props }) => <a className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2" target="_blank" rel="noopener noreferrer" {...props} />,
          strong: ({ ...props }) => <strong className="font-semibold text-slate-100" {...props} />,
          blockquote: ({ ...props }) => (
            <blockquote className="border-l-4 border-slate-600 pl-4 py-1 my-3 bg-slate-800/30 text-slate-300 italic rounded-r" {...props} />
          ),
          table: ({ ...props }) => (
            <div className="overflow-x-auto my-4 rounded-lg border border-slate-700/50">
              <table className="min-w-full divide-y divide-slate-700/50" {...props} />
            </div>
          ),
          thead: ({ ...props }) => <thead className="bg-slate-800/80" {...props} />,
          tbody: ({ ...props }) => <tbody className="divide-y divide-slate-700/50 bg-slate-800/30" {...props} />,
          th: ({ ...props }) => (
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider" {...props} />
          ),
          td: ({ ...props }) => <td className="px-4 py-2 text-sm text-slate-300" {...props} />,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          code({ inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec((className as string) || "");
            const isInline = !match && !String(children).includes("\n");
            if (isInline) {
              return (
                <code className={`${className} bg-slate-800 px-1.5 py-0.5 rounded text-sm text-cyan-200`} {...props}>
                  {children}
                </code>
              );
            }
            return !inline && match ? (
              <CodeBlock language={match[1]} value={String(children).replace(/\n$/, "")} />
            ) : (
              <CodeBlock language="text" value={String(children).replace(/\n$/, "")} />
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export const MarkdownRenderer = memo(MarkdownRendererComponent);
