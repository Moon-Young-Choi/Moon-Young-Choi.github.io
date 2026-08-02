import katex from "katex";

export function MathBlock({ expression }: { expression: string }) {
  const html = katex.renderToString(expression, {
    displayMode: true,
    throwOnError: false,
    strict: false,
    output: "htmlAndMathml",
  });

  return <div className="math-render" dangerouslySetInnerHTML={{ __html: html }} />;
}
