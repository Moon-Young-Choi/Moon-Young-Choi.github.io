import styles from "@/app/components/EventEdgeProjectPanel.module.css";

const codeLines = [
  [{ tone: "comment", text: "// freeze public state before pricing" }],
  [
    { tone: "keyword", text: "const " },
    { tone: "type", text: "PublicSnapshot" },
    { tone: "plain", text: " snapshot = freeze(game);" },
  ],
  [
    { tone: "keyword", text: "auto " },
    { tone: "plain", text: "states = " },
    { tone: "function", text: "enumerate" },
    { tone: "plain", text: "(snapshot);" },
  ],
  [
    { tone: "keyword", text: "auto " },
    { tone: "plain", text: "quotes = maker." },
    { tone: "function", text: "publish" },
    { tone: "plain", text: "(states);" },
  ],
  [
    { tone: "keyword", text: "auto " },
    { tone: "plain", text: "plan = risk." },
    { tone: "function", text: "evaluate" },
    { tone: "plain", text: "(quotes, portfolio);" },
  ],
  [
    { tone: "keyword", text: "if " },
    { tone: "plain", text: "(plan.feasible()) " },
    { tone: "function", text: "commit_atomic" },
    { tone: "plain", text: "(plan);" },
  ],
  [{ tone: "comment", text: "// settle · reconcile · audit" }],
] as const;

export function EventEdgeProjectPanel() {
  return (
    <div className={styles.panel} aria-hidden="true">
      <div className={styles.editor}>
        <div className={styles.editorBar}>
          <span><i />eventedge / src / market.cpp</span>
          <b>C++ · PRIVATE</b>
        </div>

        <div className={styles.workspace}>
          <div className={styles.fileTree}>
            <span>⌄ src</span>
            <b>market.cpp</b>
            <span>risk.cpp</span>
            <span>settle.cpp</span>
          </div>

          <div className={styles.code}>
            {codeLines.map((line, index) => (
              <div className={styles.codeLine} data-active={index === 4} key={index}>
                <i>{String(index + 1).padStart(2, "0")}</i>
                <code>
                  {line.map((token, tokenIndex) => (
                    <span className={styles[token.tone]} key={tokenIndex}>{token.text}</span>
                  ))}
                </code>
              </div>
            ))}
            <i className={styles.signal} data-eventedge-signal />
          </div>
        </div>

        <div className={styles.statusBar}>
          <span>SNAPSHOT LOCKED</span>
          <span>ATOMIC PACKAGE</span>
          <span>TRADING OFF</span>
        </div>
      </div>
    </div>
  );
}
