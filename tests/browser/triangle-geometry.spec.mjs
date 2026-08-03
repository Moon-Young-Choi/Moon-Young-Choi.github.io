import { expect, test } from "@playwright/test";

const DETAIL_PATH = "/projects/triangular-arbitrage-detector/";
const VIEWPORT_WIDTHS = [1280, 900, 640, 420, 320];
const ENDPOINT_TOLERANCE_PX = 2;
const GEOMETRY_STABILITY_TOLERANCE_PX = 0.5;

function distance(first, second) {
  return Math.hypot(first.x - second.x, first.y - second.y);
}

async function readTriangleGeometry(locator) {
  return locator.evaluate((root) => {
    const geometry = root.firstElementChild;

    if (!(geometry instanceof HTMLElement)) {
      throw new Error("Triangle geometry container is missing");
    }

    const geometryRect = geometry.getBoundingClientRect();
    const children = Array.from(geometry.children);
    const nodeElements = children.filter((element) => !element.hasAttribute("data-edge"));
    const edgeElements = children.filter((element) => element.hasAttribute("data-edge"));

    const nodes = nodeElements.map((node, index) => {
      const rect = node.getBoundingClientRect();

      return {
        id: String(index + 1),
        x: rect.left + rect.width / 2 - geometryRect.left,
        y: rect.top + rect.height / 2 - geometryRect.top,
      };
    });

    const edges = edgeElements.map((edge) => {
      const style = getComputedStyle(edge);
      const [originX = "0", originY = "0"] = style.transformOrigin.split(" ");
      const matrix = style.transform === "none" ? new DOMMatrix() : new DOMMatrix(style.transform);
      const ox = Number.parseFloat(originX);
      const oy = Number.parseFloat(originY);

      function transformPoint(x, y) {
        const relativeX = x - ox;
        const relativeY = y - oy;

        return {
          x: edge.offsetLeft + ox + matrix.a * relativeX + matrix.c * relativeY + matrix.e,
          y: edge.offsetTop + oy + matrix.b * relativeX + matrix.d * relativeY + matrix.f,
        };
      }

      const centerY = edge.offsetHeight / 2;
      const signal = edge.firstElementChild;

      return {
        id: edge.getAttribute("data-edge"),
        start: transformPoint(0, centerY),
        end: transformPoint(edge.offsetWidth, centerY),
        signalAnimationCount: signal?.getAnimations().length ?? 0,
        signalAnimationName: signal ? getComputedStyle(signal).animationName : null,
      };
    });

    return {
      direction: root.getAttribute("data-direction"),
      edges,
      nodes,
      variant: root.getAttribute("data-variant"),
    };
  });
}

function segmentIntersection(first, second) {
  const firstVector = {
    x: first.end.x - first.start.x,
    y: first.end.y - first.start.y,
  };
  const secondVector = {
    x: second.end.x - second.start.x,
    y: second.end.y - second.start.y,
  };
  const offset = {
    x: second.start.x - first.start.x,
    y: second.start.y - first.start.y,
  };
  const cross = (left, right) => left.x * right.y - left.y * right.x;
  const denominator = cross(firstVector, secondVector);

  if (Math.abs(denominator) < 1e-8) {
    return null;
  }

  const firstRatio = cross(offset, secondVector) / denominator;
  const secondRatio = cross(offset, firstVector) / denominator;

  return {
    firstRatio,
    secondRatio,
    point: {
      x: first.start.x + firstRatio * firstVector.x,
      y: first.start.y + firstRatio * firstVector.y,
    },
  };
}

function assertTriangleGeometry(snapshot) {
  expect(snapshot.nodes, `${snapshot.variant}: node count`).toHaveLength(3);
  expect(snapshot.edges, `${snapshot.variant}: edge count`).toHaveLength(3);

  const nodes = new Map(snapshot.nodes.map((node) => [node.id, node]));

  for (const edge of snapshot.edges) {
    const [startId, endId] = edge.id.split("-");
    const startNode = nodes.get(startId);
    const endNode = nodes.get(endId);

    expect(startNode, `${snapshot.variant}: edge ${edge.id} start node`).toBeDefined();
    expect(endNode, `${snapshot.variant}: edge ${edge.id} end node`).toBeDefined();
    expect(
      distance(edge.start, startNode),
      `${snapshot.variant}: edge ${edge.id} start endpoint`,
    ).toBeLessThanOrEqual(ENDPOINT_TOLERANCE_PX);
    expect(
      distance(edge.end, endNode),
      `${snapshot.variant}: edge ${edge.id} end endpoint`,
    ).toBeLessThanOrEqual(ENDPOINT_TOLERANCE_PX);
  }

  for (let firstIndex = 0; firstIndex < snapshot.edges.length; firstIndex += 1) {
    for (let secondIndex = firstIndex + 1; secondIndex < snapshot.edges.length; secondIndex += 1) {
      const first = snapshot.edges[firstIndex];
      const second = snapshot.edges[secondIndex];
      const firstNodeIds = first.id.split("-");
      const sharedNodeId = second.id.split("-").find((id) => firstNodeIds.includes(id));
      const sharedNode = nodes.get(sharedNodeId);
      const intersection = segmentIntersection(first, second);

      expect(sharedNodeId, `${snapshot.variant}: ${first.id}/${second.id} shared vertex`).toBeDefined();
      expect(intersection, `${snapshot.variant}: ${first.id}/${second.id} intersection`).not.toBeNull();

      const firstLength = distance(first.start, first.end);
      const secondLength = distance(second.start, second.end);
      const firstRatioTolerance = ENDPOINT_TOLERANCE_PX / firstLength;
      const secondRatioTolerance = ENDPOINT_TOLERANCE_PX / secondLength;

      expect(intersection.firstRatio).toBeGreaterThanOrEqual(-firstRatioTolerance);
      expect(intersection.firstRatio).toBeLessThanOrEqual(1 + firstRatioTolerance);
      expect(intersection.secondRatio).toBeGreaterThanOrEqual(-secondRatioTolerance);
      expect(intersection.secondRatio).toBeLessThanOrEqual(1 + secondRatioTolerance);
      expect(
        distance(intersection.point, sharedNode),
        `${snapshot.variant}: ${first.id}/${second.id} intersects at node ${sharedNodeId}`,
      ).toBeLessThanOrEqual(ENDPOINT_TOLERANCE_PX);
    }
  }
}

function assertGeometryUnchanged(before, after) {
  expect(after.variant).toBe(before.variant);
  expect(after.nodes).toHaveLength(before.nodes.length);
  expect(after.edges).toHaveLength(before.edges.length);

  before.nodes.forEach((node, index) => {
    expect(distance(node, after.nodes[index]), `node ${node.id} moved`).toBeLessThanOrEqual(
      GEOMETRY_STABILITY_TOLERANCE_PX,
    );
  });

  before.edges.forEach((edge, index) => {
    const nextEdge = after.edges[index];

    expect(nextEdge.id).toBe(edge.id);
    expect(distance(edge.start, nextEdge.start), `edge ${edge.id} start moved`).toBeLessThanOrEqual(
      GEOMETRY_STABILITY_TOLERANCE_PX,
    );
    expect(distance(edge.end, nextEdge.end), `edge ${edge.id} end moved`).toBeLessThanOrEqual(
      GEOMETRY_STABILITY_TOLERANCE_PX,
    );
  });
}

async function expectNoDocumentOverflow(page, width, route) {
  const overflow = await page.evaluate(() => ({
    body: document.body.scrollWidth - document.body.clientWidth,
    document: document.documentElement.scrollWidth - document.documentElement.clientWidth,
  }));

  expect(overflow.document, `${route} document overflow at ${width}px`).toBeLessThanOrEqual(1);
  expect(overflow.body, `${route} body overflow at ${width}px`).toBeLessThanOrEqual(1);
}

test.describe("shared triangle route geometry", () => {
  test.describe.configure({ timeout: 60_000 });

  for (const width of VIEWPORT_WIDTHS) {
    test(`${width}px keeps every variant connected without page overflow`, async ({ page }) => {
      await page.setViewportSize({ width, height: width <= 640 ? 1_600 : 1_200 });

      await page.goto("/");
      const card = page.locator('[data-triangle-route][data-variant="card"]');
      await expect(card).toBeVisible();
      assertTriangleGeometry(await readTriangleGeometry(card));
      await expectNoDocumentOverflow(page, width, "/");

      await page.goto(DETAIL_PATH);
      const lab = page.locator('[data-triangle-route][data-variant="lab"]');
      // The lab mounts after its verified local universe artifact is decoded.
      // Give the cold, parallel CI worker enough time without weakening the
      // geometry assertion that follows.
      await expect(lab).toBeVisible({ timeout: 15_000 });

      const forward = await readTriangleGeometry(lab);
      assertTriangleGeometry(forward);
      expect(forward.direction).toBe("forward");

      await page.getByRole("button", { exact: true, name: "Reverse" }).click();
      await expect(lab).toHaveAttribute("data-direction", "reverse");
      const reverse = await readTriangleGeometry(lab);
      assertTriangleGeometry(reverse);
      assertGeometryUnchanged(forward, reverse);
      await expectNoDocumentOverflow(page, width, DETAIL_PATH);
    });

    test(`${width}px stops route signals under reduced motion`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.setViewportSize({ width, height: width <= 640 ? 1_600 : 1_200 });

      await page.goto("/");
      const cardSnapshot = await readTriangleGeometry(
        page.locator('[data-triangle-route][data-variant="card"]'),
      );

      await page.goto(DETAIL_PATH);
      const detailSnapshots = [await readTriangleGeometry(page.locator('[data-triangle-route][data-variant="lab"]'))];

      for (const snapshot of [cardSnapshot, ...detailSnapshots]) {
        for (const edge of snapshot.edges) {
          expect(edge.signalAnimationName, `${snapshot.variant}: ${edge.id} animation name`).toBe("none");
          expect(edge.signalAnimationCount, `${snapshot.variant}: ${edge.id} active animations`).toBe(0);
        }
      }
    });
  }
});
