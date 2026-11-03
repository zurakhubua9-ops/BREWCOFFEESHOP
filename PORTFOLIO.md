# Portfolio interaction notes

This project is a portfolio website. It does not charge money, send orders or reserve real venue capacity.

The bag supports product variants and quantities, local persistence, a saved order summary, download and deletion. Prices come from the menu catalog.

## Validation

JavaScript syntax checks passed. Headless Chromium interaction checks covered adding products, size pricing, quantity totals, persistence after reload, saving summaries and storage failure. No page JavaScript errors occurred in those scenarios. Mobile width checks at 390px passed.

Tests used local HTML/CSS/JavaScript with external media requests blocked. Full photo/video rendering and deployed-site behavior still require a final live check.

## Connecting real services later

Real orders, emails, authentication and shared venue availability require a backend. Keep local-only notices until actual delivery/booking confirmation is received from that service. Do not add real payment collection for this portfolio scope.
