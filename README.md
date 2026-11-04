# Collection's by Zoni — Official Website (Design 1)

Client-approved Design 1 website for Collection's by Zoni, live on GitHub Pages.

- Theme: Sunshine Yellow (final, colour picker removed)
- Homepage: index.html / design-1.html
- Pages: Shop, Product, Cart, Checkout, Track Order
- Product images are served from the store's image host (collections-by-zoni.surge.sh/products/)

## Admin Panel

Open `admin.html` on the live site (also linked as "Admin Panel" in the store
footer). Default password on first sign-in: `zoniadmin` (change it in Settings).

The admin panel is connected to the storefront through a shared data store in
the browser (localStorage key `zoni_admin_v1`, see `zoni-connector.js`):

- Products, categories, per-size prices, sold-out sizes, size charts, reviews
  and store settings edited in the admin panel appear on the storefront.
- Orders placed at checkout are recorded into the admin panel with full item
  and address detail; the admin can set order status and the TCS consignment
  number, which the customer then sees on the Track Order page.
- Data & Backup in the panel exports/imports the whole store as one JSON file,
  which is how the data moves between devices.

