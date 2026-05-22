
GHOCHU PIZZA FULL PROJECT - RUN GUIDE

1) Open this folder in VS Code.

2) Backend setup:
   cd server
   npm install
   copy .env.example .env
   Edit .env and add your MONGO_URI.
   For first test you can leave Razorpay/Cloudinary/Email blank unless you use upload/payment/email features.
   npm run seed
   npm run dev

3) Frontend setup in a second terminal:
   cd client
   npm install
   npm run dev

4) Open:
   http://localhost:5173

5) Test backend:
   http://localhost:5000/api/health

Default seeded accounts:
   Admin: admin@ghochupizza.com / Admin@123
   Customer: customer@test.com / Test@123

Important:
- Products load from /api/products when MongoDB is connected and seeded.
- If backend is off, frontend falls back to demo products.
- Checkout uses /api/orders/guest so it works without login during demo.
- Real logged-in orders are already available at /api/orders with JWT.
