"use client";

import Link from "next/link";
import useSWR from "swr";
import styles from "./order-detail.module.css";
import { formatMoney, getOrder, getOrderTimeline } from "@/lib/api";

const refreshInterval = Number(
  process.env.NEXT_PUBLIC_POLLING_INTERVAL_MS ?? 2000,
);

export function OrderDetail({ orderId }: { orderId: string }) {
  const order = useSWR(["order", orderId], () => getOrder(orderId), {
    refreshInterval: (current) =>
      current &&
      (current.status === "CONFIRMED" || current.status === "FAILED")
        ? 0
        : refreshInterval,
  });

  const timeline = useSWR(["timeline", orderId], () => getOrderTimeline(orderId), {
    refreshInterval: () =>
      order.data &&
      (order.data.status === "CONFIRMED" || order.data.status === "FAILED")
        ? 0
        : refreshInterval,
  });

  if (order.error) {
    return (
      <main className={styles.shell}>
        <div className={styles.frame}>
          <Link className={styles.backLink} href="/">
            Back to menu
          </Link>
          <div className={styles.error}>{order.error.message}</div>
        </div>
      </main>
    );
  }

  if (!order.data) {
    return (
      <main className={styles.shell}>
        <div className={styles.frame}>
          <div className={styles.muted}>Loading order...</div>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.shell}>
      <div className={styles.frame}>
        <div className={styles.topbar}>
          <Link className={styles.backLink} href="/">
            Back to menu
          </Link>
          <div className={styles.muted}>Polling every {refreshInterval} ms</div>
        </div>

        <section className={styles.hero}>
          <h1>Order {order.data.orderId}</h1>
          <div className={styles.meta}>
            <span className={styles.pill}>Status {order.data.status}</span>
            <span className={styles.pill}>User {order.data.userId}</span>
            <span className={styles.pill}>
              Updated {new Date(order.data.updatedAt).toLocaleTimeString()}
            </span>
          </div>
        </section>

        <div className={styles.grid}>
          <section className={styles.panel}>
            <h2>Order Snapshot</h2>
            <div className={styles.orderItems}>
              {order.data.items.map((item) => (
                <article className={styles.orderItem} key={item.itemId}>
                  <div className={styles.row}>
                    <strong>{item.name}</strong>
                    <strong>{formatMoney(item.lineUnitTotalCents * item.quantity)}</strong>
                  </div>
                  <div className={styles.muted}>
                    Qty {item.quantity} · Unit {formatMoney(item.lineUnitTotalCents)}
                  </div>
                  <div className={styles.muted}>
                    {item.modifierGroups
                      .flatMap((group) =>
                        group.selections.map(
                          (selection) => `${group.groupName}: ${selection.name}`,
                        ),
                      )
                      .join(" · ") || "No modifiers"}
                  </div>
                </article>
              ))}
            </div>

            {order.data.pricing ? (
              <>
                <div className={styles.row}>
                  <span>Subtotal</span>
                  <span>{formatMoney(order.data.pricing.subtotalCents)}</span>
                </div>
                <div className={styles.row}>
                  <span>Service fee</span>
                  <span>{formatMoney(order.data.pricing.serviceFeeCents)}</span>
                </div>
                <div className={styles.row}>
                  <strong>Total</strong>
                  <strong>{formatMoney(order.data.pricing.totalCents)}</strong>
                </div>
              </>
            ) : (
              <div className={styles.muted}>
                Final pricing is populated by the worker after checkout.
              </div>
            )}
          </section>

          <section className={styles.panel}>
            <h2>Timeline</h2>
            {!timeline.data ? (
              <div className={styles.muted}>Loading timeline...</div>
            ) : (
              <div className={styles.timelineList}>
                {timeline.data.items.map((event) => (
                  <article className={styles.timelineCard} key={event.eventId}>
                    <div className={styles.row}>
                      <strong>{event.type}</strong>
                      <span>{new Date(event.timestamp).toLocaleString()}</span>
                    </div>
                    <div className={styles.timelineMeta}>
                      <span>Source {event.source}</span>
                      <span>Correlation {event.correlationId}</span>
                    </div>
                    <pre className={styles.payload}>
                      {JSON.stringify(event.payload, null, 2)}
                    </pre>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
