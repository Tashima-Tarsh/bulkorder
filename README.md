# BulkOrder

Premium local workflow prototype for the bulk-order flow:

**Flipkart product → quantity/max price → funding → customer Excel → child checkout orders → human-required verification → confirmation dashboard**

## Run

\`\`\`bash
npm install
npm run dev
\`\`\`

Open \`http://localhost:3000\`.

## Current workflow

1. Paste a Flipkart product URL and try to fetch title/image/price.
2. If Flipkart does not expose price to the simple server fetch, enter the current price manually.
3. Set total quantity and maximum price per unit.
4. Prepare the funding step using only a master-card label and optional last 4 digits.
5. Upload Excel/CSV customers.
6. Create child orders; total quantity is distributed across valid recipients.
7. Run the demo checkout workflow. Orders move independently through product check, cart, address, card, payment and confirmation.
8. Some demo orders pause at Flipkart OTP or bank/3DS verification so the Action Required/resume UI can be tested.

## Excel columns

Required:
- \`user_id\`
- \`address_line1\` or \`address\`
- \`city\`
- \`state\`
- \`pincode\`

Optional:
- \`full_name\`
- \`mobile\`
- \`address_line2\`

The product link, quantity and maximum price are batch-level settings and do not need to be repeated in Excel.

## Important

This repository currently provides the complete **visible workflow prototype**. Virtual cards and final retailer order references are explicitly demo references. It does not bypass retailer OTP/CAPTCHA/3DS, and it does not claim a real payment/order was completed.

Before real payments/orders, replace the demo issuer and retailer execution adapters with approved provider integrations and keep OTP/3DS as human-required actions.
