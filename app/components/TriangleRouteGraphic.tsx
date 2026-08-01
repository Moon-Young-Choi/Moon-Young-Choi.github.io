import styles from "@/app/components/TriangleRouteGraphic.module.css";

export type TriangleRouteGraphicProps = {
  assets: readonly string[];
  variant: "hero" | "lab" | "card";
  direction: "forward" | "reverse";
};

const labNodeLabels = ["Start / finish", "Leg 1", "Leg 2"];

export function TriangleRouteGraphic({ assets, variant, direction }: TriangleRouteGraphicProps) {
  const visibleAssets = assets.slice(0, 3);

  return (
    <div
      aria-hidden="true"
      className={`${styles.graphic} ${styles[variant]}`}
      data-direction={direction}
      data-triangle-route="true"
      data-variant={variant}
    >
      <div className={styles.geometry}>
        {visibleAssets.map((asset, index) => (
          <span className={`${styles.node} ${styles[`node${index + 1}`]}`} key={`${asset}-${index}`}>
            {variant === "lab" && <small>{labNodeLabels[index]}</small>}
            <strong>{asset}</strong>
          </span>
        ))}

        <span className={`${styles.edge} ${styles.edge12}`} data-edge="1-2"><i className={styles.signal} /></span>
        <span className={`${styles.edge} ${styles.edge23}`} data-edge="2-3"><i className={styles.signal} /></span>
        <span className={`${styles.edge} ${styles.edge31}`} data-edge="3-1"><i className={styles.signal} /></span>
      </div>
    </div>
  );
}
