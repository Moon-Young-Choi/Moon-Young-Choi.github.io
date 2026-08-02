import styles from "@/app/components/QuantPlatformProjectPanel.module.css";

const codeLines = [
  [{ tone: "comment", text: "# one cutoff, two isolated evidence rails" }],
  [
    { tone: "plain", text: "context = " },
    { tone: "keyword", text: "await " },
    { tone: "function", text: "resolve_as_of" },
    { tone: "plain", text: "(request.cutoff)" },
  ],
  [
    { tone: "plain", text: "bundle = " },
    { tone: "keyword", text: "await " },
    { tone: "function", text: "pair_or_fail" },
    { tone: "plain", text: "(context, [" },
    { tone: "string", text: "\"A\", \"B\"" },
    { tone: "plain", text: "])" },
  ],
  [
    { tone: "plain", text: "weights = " },
    { tone: "function", text: "calibrate" },
    { tone: "plain", text: "(bundle.mature_labels)" },
  ],
  [
    { tone: "plain", text: "forecast = cosmos." },
    { tone: "function", text: "combine" },
    { tone: "plain", text: "(bundle, weights)" },
  ],
  [
    { tone: "keyword", text: "return " },
    { tone: "function", text: "allocate" },
    { tone: "plain", text: "(forecast, constraints)" },
  ],
  [{ tone: "comment", text: "# architecture snapshot · output disabled" }],
] as const;

export function QuantPlatformProjectPanel() {
  return (
    <figure className={styles.panel} aria-labelledby="quant-panel-caption">
      <div className={styles.editor} aria-hidden="true">
        <div className={styles.editorBar}>
          <span><i />quant-platform / services / pipeline.py</span>
          <b>PYTHON · WIP</b>
        </div>

        <div className={styles.workspace}>
          <div className={styles.fileTree}>
            <span>⌄ services</span>
            <b>pipeline.py</b>
            <span>evidence.py</span>
            <span>portfolio.py</span>
          </div>

          <div className={styles.code}>
            {codeLines.map((line, index) => (
              <div className={styles.codeLine} data-active={index === 3} key={index}>
                <i>{String(index + 1).padStart(2, "0")}</i>
                <code>
                  {line.map((token, tokenIndex) => (
                    <span className={styles[token.tone]} key={tokenIndex}>{token.text}</span>
                  ))}
                </code>
              </div>
            ))}
            <i className={styles.signal} data-quant-signal />
          </div>
        </div>

        <div className={styles.statusBar}>
          <span>AS-OF FROZEN</span>
          <span>A/B ISOLATED</span>
          <span>NO LIVE OUTPUT</span>
        </div>
      </div>
      <figcaption className={styles.visuallyHidden} id="quant-panel-caption">
        Quant Platform codebase view. A frozen point-in-time context feeds isolated Algorithm A and B evidence, mature-label calibration, COSMOS forecast combination, and constrained allocation. The architecture is work in progress and produces no live portfolio output.
      </figcaption>
    </figure>
  );
}
