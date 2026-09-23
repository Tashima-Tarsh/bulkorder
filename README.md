# BulkOrder

AWS-ready Excel/CSV intake and backend job orchestration service.

## What it does

1. Upload one `.xlsx`, `.xls` or `.csv` file.
2. Parse and validate every row.
3. Persist the import and each row in PostgreSQL.
4. Queue one BullMQ job per valid row in Redis.
5. Retry transient failures with exponential backoff.
6. Show import/job progress in a small web dashboard.
7. Optionally POST each valid row to an existing order backend through `DOWNSTREAM_ORDER_API_URL`.

The importer intentionally does **not** store OTPs, card PAN/CVV, or retailer login sessions. Those belong in the downstream order/payment flow if legitimately required.

## Spreadsheet columns

Required:

- `user_id`
- `address_line1` (or `address`)
- `city`
- `state`
- `pincode`
- `flipkart_link` (or `product_url`)
- `quantity`
- `max_price`

Optional:

- `full_name`
- `mobile`
- `address_line2`

Download a ready CSV template from `/api/template.csv`.

## Run on AWS / Docker

```bash
cp .env.example .env
# set a strong POSTGRES_PASSWORD in your shell or .env
docker compose up -d --build
```

Open:

```
http://YOUR_SERVER_IP:3000
```

For production, put the service behind HTTPS (ALB + ACM, Caddy, Nginx, etc.) and do not expose PostgreSQL or Redis publicly.

## Downstream order engine integration

Set:

```env
DOWNSTREAM_ORDER_API_URL=https://your-order-engine.example.com/api/imported-order
DOWNSTREAM_ORDER_API_TOKEN=...
```

Each row is sent as JSON with an `X-Idempotency-Key` header. The downstream service should use that key to prevent duplicate execution.

If no downstream endpoint is configured, valid rows stop at `READY_FOR_EXECUTION`, so you can verify the Excel pipeline safely before connecting the real order engine.

## Statuses

Import:
- `PROCESSING`
- `COMPLETED`
- `COMPLETED_WITH_ERRORS`
- `FAILED`

Row:
- `INVALID`
- `QUEUED`
- `PROCESSING`
- `READY_FOR_EXECUTION`
- `DISPATCHED`
- `FAILED`

## Limits

- 8 MB upload limit
- 5,000 spreadsheet rows per import
- worker concurrency: 8
- 5 retries with exponential backoff
