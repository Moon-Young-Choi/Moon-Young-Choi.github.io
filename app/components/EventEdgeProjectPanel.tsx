import type { CSSProperties } from "react";
import styles from "@/app/components/EventEdgeProjectPanel.module.css";

const priceSegments = [
  { left: "5%", top: "78%", width: "16%", angle: "-35deg" },
  { left: "18%", top: "61%", width: "14%", angle: "20deg" },
  { left: "31%", top: "70%", width: "20%", angle: "-50deg" },
  { left: "44%", top: "42%", width: "14%", angle: "16deg" },
  { left: "57%", top: "49%", width: "18%", angle: "-43deg" },
  { left: "70%", top: "25%", width: "14.5%", angle: "24deg" },
  { left: "83%", top: "36%", width: "16%", angle: "-43deg" },
];

const depth = [
  [42, 66],
  [58, 82],
  [76, 96],
  [94, 88],
  [69, 72],
  [51, 54],
  [34, 39],
];

export function EventEdgeProjectPanel() {
  return (
    <figure className={styles.panel} aria-labelledby="eventedge-panel-caption">
      <div className={styles.market} aria-hidden="true">
        <div className={styles.chart}>
          <div className={styles.pricePath}>
            {priceSegments.map((segment, index) => (
              <i key={index} style={{
                left: segment.left,
                top: segment.top,
                width: segment.width,
                "--angle": segment.angle,
              } as CSSProperties} />
            ))}
          </div>
          <span className={styles.ticker} />
        </div>

        <div className={styles.orderBook}>
          {depth.map(([bid, ask], index) => (
            <div className={styles.depthLevel} key={index} style={{ "--delay": `${index * -0.23}s` } as CSSProperties}>
              <i className={styles.bid} style={{ width: `${bid}%` }} />
              <span />
              <i className={styles.ask} style={{ width: `${ask}%` }} />
            </div>
          ))}
          <b data-eventedge-signal />
        </div>
      </div>

      <figcaption className={styles.visuallyHidden} id="eventedge-panel-caption">
        An animated derivatives price path beside a moving bid and ask order book.
      </figcaption>
    </figure>
  );
}
