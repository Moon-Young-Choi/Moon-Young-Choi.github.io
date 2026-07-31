import katex from "katex";

export function MathBlock({ expression }: { expression: string }) {
  const html = katex.renderToString(expression, {
    displayMode: true,
    throwOnError: false,
    strict: false,
    output: "html",
  });

  return <div className="math-render" dangerouslySetInnerHTML={{ __html: html }} />;
}
