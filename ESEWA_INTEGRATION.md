# eSewa ePay V2 Integration (Sandbox / UAT)

Official spec: <https://developer.esewa.com.np/pages/Epay-V2>

## Environment variables

| Variable                | Sandbox default                                             | Notes                       |
| ----------------------- | ----------------------------------------------------------- | --------------------------- |
| `ESEWA_ENV`             | `sandbox`                                                   | `sandbox` or `production`   |
| `ESEWA_PRODUCT_CODE`    | `EPAYTEST`                                                  | Merchant code from eSewa    |
| `ESEWA_SECRET_KEY`      | `8gBm/:&EnhH.1/q`                                           | Signing secret — server only |
| `ESEWA_PAYMENT_URL`     | `https://rc-epay.esewa.com.np/api/epay/main/v2/form`        | Form POST target            |
| `ESEWA_STATUS_URL`      | `https://rc.esewa.com.np/api/epay/transaction/status/`      | Server-side status API      |
| `NEXT_PUBLIC_APP_URL`   | `http://localhost:3000`                                     | Used to build callback URLs |

The secret key is read only inside API routes and library files that run on
the server. It is never sent to the browser and never included in any client
component.

To go live: change `ESEWA_ENV=production`, set the production credentials
issued by eSewa, and set `NEXT_PUBLIC_APP_URL` to the deployed origin. No
code changes are required.

## Flow

```
Customer → Cart → Checkout → Select eSewa → Place Order
   ↓
POST /api/orders  (creates order, PENDING; decrements stock; keeps cart for retry)
   ↓
GET  /payment/esewa/redirect?orderId=…
   ↓ (client calls)
POST /api/payment/esewa/initiate  (server signs the request, returns form fields)
   ↓ (browser auto-submits)
POST https://rc-epay.esewa.com.np/api/epay/main/v2/form
   ↓
Customer pays on eSewa
   ↓
On success: eSewa redirects to /api/payment/esewa/success?data=<base64>
On failure: eSewa redirects to /api/payment/esewa/failure
```

The success endpoint:
1. Decodes the base64 JSON payload.
2. Verifies `product_code`, `transaction_uuid`, and the HMAC-SHA256 signature.
3. Looks the payment up by `transactionUuid` (unique).
4. Confirms the amount matches the order total.
5. Calls eSewa's transaction status API (`fetchEsewaStatus`) to confirm.
6. Idempotently updates the payment to `COMPLETED`, the order to `CONFIRMED`,
   records a timeline event, and empties the customer's cart.

The failure endpoint marks the payment `FAILED`, cancels the pending order,
and restocks the reserved inventory once.

## Files

Added:
- `lib/payments/esewa/config.js`      — env-aware config and callback URL helpers
- `lib/payments/esewa/signature.js`   — HMAC-SHA256 signing + response verification
- `lib/payments/esewa/client.js`      — status API client + status mapper
- `lib/payments/esewa/service.js`     — initiate / mark paid / mark failed / verify
- `app/api/payment/esewa/initiate/route.js`
- `app/api/payment/esewa/success/route.js`
- `app/api/payment/esewa/failure/route.js`
- `app/api/admin/customer-orders/[id]/verify-payment/route.js`
- `app/payment/esewa/redirect/page.jsx`  — auto-submits the signed form
- `app/payment/esewa/result/page.jsx`    — result screen shown after callback
- `prisma/migrations/20260913120000_esewa_payment_fields/migration.sql`

Modified:
- `prisma/schema.prisma`               — extended `CustomerPayment`
- `app/api/orders/route.js`            — skips cart-clear for eSewa; stamps `provider`
- `components/checkout/CheckoutView.jsx` — routes eSewa orders through `/payment/esewa/redirect`
- `app/admin/customer-orders/[id]/page.jsx` — richer payment row + "Verify with eSewa"
- `app/account/orders/page.jsx`        — shows payment method, status, txn uuid, ref
- `.env`                                — eSewa sandbox variables

## Migration

```
npx prisma migrate deploy   # applies 20260913120000_esewa_payment_fields
npx prisma generate
```

## Security

- All amounts are computed server-side from `CustomerOrder.total` (never from the browser).
- The signing secret only exists in server-side modules; the redirect page
  fetches signed fields via an authenticated POST and never sees the secret.
- The success handler is idempotent: a duplicated callback recognises the
  `COMPLETED` state and returns without side-effects (no double stock deduction).
- The unique constraint on `transactionUuid` prevents replay across payments.
- Every eSewa "COMPLETE" claim is re-verified against the status API before
  the order is credited.
- Admins that manually verify a payment record it in `AdminAuditLog`
  (`action=PAYMENT_VERIFIED`).
- Callback URLs live under `/api/payment/esewa/*`, which is outside the
  authenticated `/checkout` matcher — eSewa can reach them without a session.

## Testing (sandbox)

1. Log in, add items with variants, go to checkout.
2. Fill address, choose eSewa, click "Pay with eSewa".
3. Use eSewa's published test credentials on the sandbox page.
4. Successful test flow:
   - Order shows `CONFIRMED` / payment `COMPLETED` in `/account/orders`
   - Admin sees the same in `/admin/customer-orders/[id]` with the `ref_id`
5. Failed / cancelled test flow:
   - Cancel on eSewa
   - Order becomes `CANCELLED`, payment `FAILED`
   - Variant stock is restored
6. Amount tampering:
   - Modify `total_amount` in the intercepted form
   - Success callback rejects with mismatch — payment marked `FAILED`
7. Duplicate callback:
   - Replay the same success URL — second call is a no-op
8. Admin verification:
   - Trigger a pending payment (close eSewa mid-flow), then click
     "Verify with eSewa" in the admin order detail — server hits the status
     API and updates the payment accordingly.

## Known limitations

- No webhook — eSewa ePay V2 relies on redirect + status API. Ambiguous
  payments are resolved by the admin "Verify with eSewa" action.
- No automatic retry job. If a customer leaves the browser mid-flow,
  their payment stays PENDING until an admin verifies it or the record
  is manually cleaned up.
