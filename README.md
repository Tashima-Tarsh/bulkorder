# BulkOrder

Simple local Excel/CSV upload demo.

## Run

```bash
npm install
npm run dev
```

Open:

```
http://localhost:3000
```

## What you can do

- Upload `.xlsx`, `.xls` or `.csv`
- Validate each row
- See valid and invalid rows
- Create one backend task record per valid row
- Start a task manually from the page to simulate the backend taking it

## Columns

Required:
- `user_id`
- `address_line1` or `address`
- `city`
- `state`
- `pincode`
- `flipkart_link` or `product_url`
- `quantity`
- `max_price`

Optional:
- `full_name`
- `mobile`
- `address_line2`

Use **Download template** on the page for a ready CSV example.

This repository currently demonstrates only the Excel intake and task creation flow. It does not place retailer orders or process payment.
