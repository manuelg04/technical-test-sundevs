"use client";

import { startTransition, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./order-studio.module.css";
import {
  addCartItem,
  checkoutOrder,
  createDraft,
  formatMoney,
  getMenu,
  getUserId,
  removeCartItem,
  updateCartItem,
} from "@/lib/api";
import { MenuItem, MenuResponse, OrderItem, OrderView } from "@/lib/types";

type ItemFormState = {
  quantity: number;
  modifiers: Record<string, string[]>;
};

function buildInitialForm(item: MenuItem): ItemFormState {
  return {
    quantity: 1,
    modifiers: Object.fromEntries(
      item.modifierGroups.map((group) => [group.code, []]),
    ),
  };
}

function getSelectionsFromOrderItem(item: OrderItem): ItemFormState {
  return {
    quantity: item.quantity,
    modifiers: Object.fromEntries(
      item.modifierGroups.map((group) => [
        group.groupCode,
        group.selections.map((selection) => selection.code),
      ]),
    ),
  };
}

export function OrderStudio() {
  const router = useRouter();
  const [menu, setMenu] = useState<MenuResponse | null>(null);
  const [draft, setDraft] = useState<OrderView | null>(null);
  const [forms, setForms] = useState<Record<string, ItemFormState>>({});
  const [editingItems, setEditingItems] = useState<Record<string, string | null>>(
    {},
  );
  const [error, setError] = useState<string | null>(null);
  const [busyItemCode, setBusyItemCode] = useState<string | null>(null);
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [checkoutKey, setCheckoutKey] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    void getMenu()
      .then((menuResponse) => {
        if (!alive) {
          return;
        }
        setMenu(menuResponse);
        setForms(
          Object.fromEntries(
            menuResponse.items.map((item) => [item.code, buildInitialForm(item)]),
          ),
        );
      })
      .catch((caughtError: Error) => {
        if (!alive) {
          return;
        }
        setError(caughtError.message);
      });

    return () => {
      alive = false;
    };
  }, []);

  const menuByCode = useMemo(
    () => new Map(menu?.items.map((item) => [item.code, item]) ?? []),
    [menu],
  );

  const groupedItems = useMemo(() => {
    if (!menu) {
      return [];
    }

    return menu.categories.map((category) => ({
      category,
      items: menu.items.filter((item) => item.category === category),
    }));
  }, [menu]);

  const ensureDraft = async () => {
    if (draft) {
      return draft;
    }

    const nextDraft = await createDraft();
    setDraft(nextDraft);
    return nextDraft;
  };

  const resetForm = (itemCode: string) => {
    const menuItem = menuByCode.get(itemCode);
    if (!menuItem) {
      return;
    }

    setForms((current) => ({
      ...current,
      [itemCode]: buildInitialForm(menuItem),
    }));
    setEditingItems((current) => ({
      ...current,
      [itemCode]: null,
    }));
  };

  const toggleSelection = (
    itemCode: string,
    groupCode: string,
    optionCode: string,
    maxSelections: number,
  ) => {
    setForms((current) => {
      const form = current[itemCode];
      const currentSelections = form.modifiers[groupCode] ?? [];
      const alreadySelected = currentSelections.includes(optionCode);
      const nextSelections = alreadySelected
        ? currentSelections.filter((selection) => selection !== optionCode)
        : maxSelections === 1
          ? [optionCode]
          : currentSelections.length < maxSelections
            ? [...currentSelections, optionCode]
            : currentSelections;

      return {
        ...current,
        [itemCode]: {
          ...form,
          modifiers: {
            ...form.modifiers,
            [groupCode]: nextSelections,
          },
        },
      };
    });
  };

  const submitItem = async (itemCode: string) => {
    const form = forms[itemCode];
    const editingItemId = editingItems[itemCode];

    setError(null);
    setBusyItemCode(itemCode);
    try {
      const currentDraft = await ensureDraft();
      const payload = {
        menuItemCode: itemCode,
        quantity: form.quantity,
        modifiers: form.modifiers,
      };

      const nextDraft = editingItemId
        ? await updateCartItem(currentDraft.orderId, editingItemId, payload)
        : await addCartItem(currentDraft.orderId, payload);

      setDraft(nextDraft);
      resetForm(itemCode);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : "Unexpected failure",
      );
    } finally {
      setBusyItemCode(null);
    }
  };

  const beginEdit = (item: OrderItem) => {
    setForms((current) => ({
      ...current,
      [item.menuItemCode]: getSelectionsFromOrderItem(item),
    }));
    setEditingItems((current) => ({
      ...current,
      [item.menuItemCode]: item.itemId,
    }));
  };

  const deleteItem = async (item: OrderItem) => {
    if (!draft) {
      return;
    }

    setError(null);
    setBusyItemCode(item.menuItemCode);
    try {
      const nextDraft = await removeCartItem(draft.orderId, item.itemId);
      setDraft(nextDraft);
      if (editingItems[item.menuItemCode] === item.itemId) {
        resetForm(item.menuItemCode);
      }
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : "Unexpected failure",
      );
    } finally {
      setBusyItemCode(null);
    }
  };

  const submitCheckout = async () => {
    if (!draft) {
      return;
    }

    setCheckoutBusy(true);
    setError(null);
    const stableKey = checkoutKey ?? crypto.randomUUID();
    setCheckoutKey(stableKey);

    try {
      const response = await checkoutOrder(draft.orderId, stableKey);
      startTransition(() => {
        router.push(`/orders/${response.orderId}`);
      });
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : "Unexpected failure",
      );
    } finally {
      setCheckoutBusy(false);
    }
  };

  return (
    <main className={styles.shell}>
      <div className={styles.frame}>
        <section className={styles.hero}>
          <span className={styles.eyebrow}>Restaurant ordering API demo</span>
          <h1>Draft a cart, place the order, inspect every event.</h1>
          <p>
            This UI keeps the interaction intentionally small: menu browsing,
            cart mutations, server-authoritative checkout and an order timeline
            that remains append-only from the backend.
          </p>
          <div className={styles.statusBar}>
            <div className={styles.statusPill}>User {getUserId()}</div>
            <div className={styles.statusPill}>
              Draft {draft ? draft.orderId : "not created"}
            </div>
            <div className={styles.statusPill}>
              State {draft ? draft.status : "idle"}
            </div>
          </div>
        </section>

        <div className={styles.grid}>
          <section className={styles.menuSection}>
            {groupedItems.map(({ category, items }) => (
              <article className={styles.categoryBlock} key={category}>
                <div className={styles.categoryHeader}>
                  <h2>{category}</h2>
                  <span>{items.length} menu items</span>
                </div>

                <div className={styles.cards}>
                  {items.map((item) => {
                    const form = forms[item.code] ?? buildInitialForm(item);
                    const isEditing = Boolean(editingItems[item.code]);
                    return (
                      <div className={styles.card} key={item.code}>
                        <div className={styles.cardTop}>
                          <div>
                            <h3>{item.name}</h3>
                            <p>{item.description}</p>
                          </div>
                          <div className={styles.priceTag}>
                            {formatMoney(item.basePriceCents)}
                          </div>
                        </div>

                        <div className={styles.controls}>
                          <label className={styles.quantity}>
                            <span>Qty</span>
                            <input
                              type="number"
                              min={1}
                              max={10}
                              value={form.quantity}
                              onChange={(event) =>
                                setForms((current) => ({
                                  ...current,
                                  [item.code]: {
                                    ...form,
                                    quantity: Number(event.target.value) || 1,
                                  },
                                }))
                              }
                            />
                          </label>

                          {item.modifierGroups.map((group) => (
                            <div className={styles.modifierGroup} key={group.code}>
                              <div className={styles.modifierHeader}>
                                <strong>{group.name}</strong>
                                <span className={styles.modifierHint}>
                                  {group.required
                                    ? "Choose exactly 1"
                                    : `Up to ${group.maxSelections}`}
                                </span>
                              </div>
                              <div className={styles.options}>
                                {group.options.map((option) => {
                                  const selected =
                                    form.modifiers[group.code]?.includes(option.code) ??
                                    false;
                                  return (
                                    <button
                                      className={`${styles.option} ${
                                        selected ? styles.optionActive : ""
                                      }`}
                                      key={option.code}
                                      type="button"
                                      onClick={() =>
                                        toggleSelection(
                                          item.code,
                                          group.code,
                                          option.code,
                                          group.maxSelections,
                                        )
                                      }
                                    >
                                      {option.name} · {formatMoney(option.priceCents)}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          ))}

                          <div className={styles.actionRow}>
                            <button
                              className={styles.primaryButton}
                              type="button"
                              disabled={busyItemCode === item.code}
                              onClick={() => void submitItem(item.code)}
                            >
                              {isEditing ? "Update cart item" : "Add to cart"}
                            </button>
                            {isEditing ? (
                              <button
                                className={styles.ghostButton}
                                type="button"
                                onClick={() => resetForm(item.code)}
                              >
                                Cancel edit
                              </button>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </article>
            ))}
          </section>

          <aside className={styles.cartPane}>
            <div className={styles.cartHeader}>
              <h2>Draft Cart</h2>
              <p>
                Cart events are persisted immediately. Checkout remains
                asynchronous and server-authoritative.
              </p>
            </div>

            {error ? <div className={styles.error}>{error}</div> : null}

            {!draft ? (
              <div className={styles.emptyState}>
                The draft is created lazily on the first cart action.
              </div>
            ) : null}

            <div className={styles.cartItems}>
              {draft?.items.map((item) => (
                <div className={styles.cartItem} key={item.itemId}>
                  <div className={styles.cartItemHead}>
                    <strong>{item.name}</strong>
                    <span>{formatMoney(item.lineUnitTotalCents * item.quantity)}</span>
                  </div>
                  <div className={styles.cartMeta}>
                    <span>Qty {item.quantity}</span>
                    <span>Base {formatMoney(item.basePriceCents)}</span>
                    <span>Line {formatMoney(item.lineUnitTotalCents)}</span>
                  </div>
                  <div className={styles.modifierList}>
                    {item.modifierGroups.flatMap((group) =>
                      group.selections.map((selection) => (
                        <span
                          className={styles.modifierBadge}
                          key={`${item.itemId}-${group.groupCode}-${selection.code}`}
                        >
                          {group.groupName}: {selection.name}
                        </span>
                      )),
                    )}
                  </div>
                  <div className={styles.actionRow}>
                    <button
                      className={styles.secondaryButton}
                      type="button"
                      onClick={() => beginEdit(item)}
                    >
                      Edit
                    </button>
                    <button
                      className={styles.dangerButton}
                      type="button"
                      onClick={() => void deleteItem(item)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {draft?.pricingPreview ? (
              <div className={styles.totals}>
                <div className={styles.totalRow}>
                  <span>Subtotal</span>
                  <span>{formatMoney(draft.pricingPreview.subtotalCents)}</span>
                </div>
                <div className={styles.totalRow}>
                  <span>Preview service fee</span>
                  <span>{formatMoney(draft.pricingPreview.serviceFeeCents)}</span>
                </div>
                <div className={styles.totalRow}>
                  <strong>Preview total</strong>
                  <strong>{formatMoney(draft.pricingPreview.totalCents)}</strong>
                </div>
              </div>
            ) : null}

            <div className={styles.checkoutRow}>
              <button
                className={styles.primaryButton}
                type="button"
                disabled={!draft || draft.items.length === 0 || checkoutBusy}
                onClick={() => void submitCheckout()}
              >
                {checkoutBusy ? "Submitting..." : "Checkout"}
              </button>
              <div className={styles.emptyState}>
                Checkout returns 202 and the worker finishes the order in the
                background.
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
