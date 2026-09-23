/**
 * Hakkiveda — Order State Machine
 *
 * Inspired by Shopware 6's three-track state architecture:
 *   1. Order status     — overall lifecycle
 *   2. Payment status   — money flow
 *   3. Fulfillment status — goods delivery
 *
 * Each track has its own set of states and a map of valid transitions.
 * Only transitions listed here are allowed — everything else is blocked.
 */

// ─── Order Status ───────────────────────────────────────────────────────────
export const ORDER_STATES = {
  PENDING:    { label: "Pending",    color: "amber"  },
  CONFIRMED:  { label: "Confirmed",  color: "blue"   },
  PROCESSING: { label: "Processing", color: "indigo" },
  SHIPPED:    { label: "Shipped",    color: "cyan"   },
  DELIVERED:  { label: "Delivered",  color: "green"  },
  CANCELLED:  { label: "Cancelled",  color: "red"    },
  RETURNED:   { label: "Returned",   color: "orange" },
  REFUNDED:   { label: "Refunded",   color: "slate"  },
};

export const ORDER_TRANSITIONS = {
  PENDING:    ["CONFIRMED", "PROCESSING", "CANCELLED"],
  CONFIRMED:  ["PROCESSING", "CANCELLED"],
  PROCESSING: ["SHIPPED", "CANCELLED"],
  SHIPPED:    ["DELIVERED", "RETURNED"],
  DELIVERED:  ["RETURNED"],
  CANCELLED:  [],  // terminal
  RETURNED:   ["REFUNDED"],
  REFUNDED:   [],  // terminal
};

// ─── Payment Status ─────────────────────────────────────────────────────────
export const PAYMENT_STATES = {
  PENDING:   { label: "Pending",   color: "amber"  },
  COMPLETED: { label: "Completed", color: "green"  },
  FAILED:    { label: "Failed",    color: "red"    },
  REFUNDED:  { label: "Refunded",  color: "slate"  },
};

export const PAYMENT_TRANSITIONS = {
  PENDING:   ["COMPLETED", "FAILED"],
  COMPLETED: ["REFUNDED"],
  FAILED:    ["PENDING"],       // allow retry
  REFUNDED:  [],                // terminal
};

// ─── Fulfillment Status ─────────────────────────────────────────────────────
export const FULFILLMENT_STATES = {
  UNFULFILLED:         { label: "Unfulfilled",         color: "amber"  },
  PARTIALLY_FULFILLED: { label: "Partially Fulfilled", color: "blue"   },
  FULFILLED:           { label: "Fulfilled",           color: "green"  },
  RETURNED:            { label: "Returned",            color: "orange" },
};

export const FULFILLMENT_TRANSITIONS = {
  UNFULFILLED:         ["PARTIALLY_FULFILLED", "FULFILLED"],
  PARTIALLY_FULFILLED: ["FULFILLED", "RETURNED"],
  FULFILLED:           ["RETURNED"],
  RETURNED:            [],  // terminal
};

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Get the valid next states for a given track and current state. */
export function getAvailableTransitions(track, currentState) {
  const map = {
    order: ORDER_TRANSITIONS,
    payment: PAYMENT_TRANSITIONS,
    fulfillment: FULFILLMENT_TRANSITIONS,
  }[track];
  return map?.[currentState] || [];
}

/** Check whether a specific transition is allowed. */
export function isTransitionAllowed(track, from, to) {
  return getAvailableTransitions(track, from).includes(to);
}

/** Get the state metadata (label, color) for a track and state. */
export function getStateInfo(track, state) {
  const map = {
    order: ORDER_STATES,
    payment: PAYMENT_STATES,
    fulfillment: FULFILLMENT_STATES,
  }[track];
  return map?.[state] || { label: state, color: "slate" };
}

/**
 * Suggest automatic side-effects when an order status changes.
 * Returns recommended updates for the other two tracks.
 * The admin can override these — they're suggestions, not rules.
 */
export function suggestSideEffects(orderStatus, currentPayment, currentFulfillment) {
  const suggestions = {};

  switch (orderStatus) {
    case "SHIPPED":
      if (["UNFULFILLED", "PARTIALLY_FULFILLED"].includes(currentFulfillment)) {
        suggestions.fulfillmentStatus = "FULFILLED";
      }
      break;
    case "DELIVERED":
      if (currentFulfillment !== "FULFILLED") {
        suggestions.fulfillmentStatus = "FULFILLED";
      }
      break;
    case "CANCELLED":
      if (currentFulfillment === "UNFULFILLED") {
        // no fulfillment change needed — nothing was shipped
      }
      if (currentPayment === "COMPLETED") {
        suggestions.paymentStatus = "REFUNDED";
      }
      break;
    case "RETURNED":
      if (currentFulfillment !== "RETURNED") {
        suggestions.fulfillmentStatus = "RETURNED";
      }
      break;
    case "REFUNDED":
      if (currentPayment !== "REFUNDED") {
        suggestions.paymentStatus = "REFUNDED";
      }
      break;
  }

  return suggestions;
}
