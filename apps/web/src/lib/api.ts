import { MenuResponse, OrderView, TimelineResponse } from "./types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001";
const USER_ID = process.env.NEXT_PUBLIC_USER_ID ?? "demo-user";

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "x-user-id": USER_ID,
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const fallback = `${response.status} ${response.statusText}`;
    const errorPayload =
      response.headers.get("content-type")?.includes("application/json")
        ? ((await response.json()) as { message?: string | string[] })
        : null;
    const message = Array.isArray(errorPayload?.message)
      ? errorPayload.message.join(", ")
      : errorPayload?.message ?? fallback;
    throw new Error(message);
  }

  return (await response.json()) as T;
}

export function formatMoney(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

export function getUserId() {
  return USER_ID;
}

export async function getMenu() {
  return requestJson<MenuResponse>("/menu");
}

export async function createDraft() {
  return requestJson<OrderView>("/carts", {
    method: "POST",
  });
}

export async function addCartItem(
  orderId: string,
  payload: {
    menuItemCode: string;
    quantity: number;
    modifiers: Record<string, string[]>;
  },
) {
  return requestJson<OrderView>(`/carts/${orderId}/items`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateCartItem(
  orderId: string,
  itemId: string,
  payload: {
    menuItemCode: string;
    quantity: number;
    modifiers: Record<string, string[]>;
  },
) {
  return requestJson<OrderView>(`/carts/${orderId}/items/${itemId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function removeCartItem(orderId: string, itemId: string) {
  return requestJson<OrderView>(`/carts/${orderId}/items/${itemId}`, {
    method: "DELETE",
  });
}

export async function checkoutOrder(orderId: string, idempotencyKey: string) {
  return requestJson<{ orderId: string; status: string }>("/orders", {
    method: "POST",
    headers: {
      "Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify({ draftOrderId: orderId }),
  });
}

export async function getOrder(orderId: string) {
  return requestJson<OrderView>(`/orders/${orderId}`);
}

export async function getOrderTimeline(orderId: string, pageSize = 20) {
  return requestJson<TimelineResponse>(
    `/orders/${orderId}/timeline?page=1&pageSize=${pageSize}`,
  );
}
