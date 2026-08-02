import type { CSSProperties } from "react";
import styles from "@/app/components/EventEdgeProjectPanel.module.css";

const asks = [
  ["62.0", 46, "0.8"],
  ["61.5", 63, "1.3"],
  ["61.0", 79, "2.1"],
  ["60.5", 96, "3.4"],
] as const;

const bids = [
  ["59.5", 94, "3.1"],
  ["59.0", 76, "2.0"],
  ["58.5", 59, "1.2"],
  ["58.0", 41, "0.7"],
] as const;

export function EventEdgeProjectPanel() {
  return (
    <figure className={styles.panel} aria-labelledby="eventedge-panel-caption">
      <div className={styles.market} aria-hidden="true">
        <div className={styles.quoteStrip}>
          <div data-quote="bid"><span>Best bid</span><b>59.5</b></div>
          <div data-quote="spread"><span>Spread</span><b>1.0</b></div>
          <div data-quote="ask"><span>Best ask</span><b>60.5</b></div>
        </div>

        <div className={styles.orderBook}>
          <div className={styles.bookSide} data-side="ask">
            {asks.map(([price, width, size], index) => (
              <div className={styles.level} key={price} style={{ "--delay": `${index * -0.19}s` } as CSSProperties}>
                <b>{price}</b>
                <i style={{ width: `${width}%` }} />
                <span>{size}</span>
              </div>
            ))}
          </div>

          <div className={styles.spreadBand}><span>Ask / sell</span><i /><span>Bid / buy</span></div>

          <div className={styles.bookSide} data-side="bid">
            {bids.map(([price, width, size], index) => (
              <div className={styles.level} key={price} style={{ "--delay": `${index * -0.19 - 0.7}s` } as CSSProperties}>
                <b>{price}</b>
                <i style={{ width: `${width}%` }} />
                <span>{size}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <figcaption className={styles.visuallyHidden} id="eventedge-panel-caption">
        A vertical derivatives order book with sell asks above the spread and buy bids below it, preceded by best bid, spread, and best ask quotes.
      </figcaption>
    </figure>
  );
}
