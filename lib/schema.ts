import { integer, numeric, pgTable, text, timestamp, uuid, boolean } from 'drizzle-orm/pg-core';

// Packet table
export const packet = pgTable('packet', {
  id: integer('id').primaryKey(),
  name: text('name'),
  userId: text('user_id'),
  createdAt: timestamp('created_at', { withTimezone: false }),
  description: text('description'),
  updatedAt: timestamp('updated_at', { withTimezone: false }),
  cost: numeric('cost'),
  currencyCode: text('currency_code')
});

// Itinerary Day table
export const itineraryDay = pgTable('itinerary_day', {
  id: text('id').primaryKey(),
  name: text('name'),
  packetId: text('packet_id'),
  dayNumber: text('day_number'),
  description: text('description'),
  createdAt: timestamp('created_at', { withTimezone: false }),
  updatedAt: timestamp('updated_at', { withTimezone: false })
});

// Marker table
export const marker = pgTable('marker', {
  id: uuid('id').primaryKey(),
  title: text('title'),
  lon: text('lon'),
  lat: text('lat'),
  packetId: uuid('packet_id'),
  userId: text('user_id'),
  description: text('description'),
  dayId: text('day_id'),
  type: text('type'),
  sortOrder: integer('sort_order'),
  createdAt: timestamp('created_at', { withTimezone: false }),
  updatedAt: timestamp('updated_at', { withTimezone: false })
});

// Orders table
export const orders = pgTable('orders', {
  id: integer('id').primaryKey(),
  orderNumber: text('order_number'),
  buyerId: text('buyer_id'),
  sellerId: text('seller_id'),
  itemId: text('item_id'),
  itemType: text('item_type'),
  quantity: integer('quantity'),
  totalPrice: numeric('total_price'),
  status: text('status'),
  createdAt: timestamp('created_at', { withTimezone: true }),
  updatedAt: timestamp('updated_at', { withTimezone: true })
});

// Packet Favorites table
export const packetFavorites = pgTable('packet_favorites', {
  id: integer('id').primaryKey(),
  userId: text('user_id'),
  createdAt: timestamp('created_at', { withTimezone: false }),
  packetId: text('packet_id')
});

// Packet Purchase table
export const packetPurchase = pgTable('packet_purchase', {
  id: integer('id').primaryKey(),
  userId: text('user_id'),
  itemId: text('item_id'),
  itemType: text('item_type'),
  orderId: integer('order_id'),
  acquiredAt: timestamp('acquired_at', { withTimezone: true }),
  revoked: boolean('revoked')
});

// Payment Log table
export const paymentLog = pgTable('payment_log', {
  id: integer('id').primaryKey(),
  orderId: text('order_id'),
  buyerId: text('buyer_id'),
  sellerId: text('seller_id'),
  totalAmount: numeric('total_amount'),
  platformFee: numeric('platform_fee'),
  sellerAmount: numeric('seller_amount'),
  stripePaymentIntent: text('stripe_payment_intent'),
  paidAt: timestamp('paid_at', { withTimezone: true }),
  status: text('status')
});

// Refund Log table
export const refundLog = pgTable('refund_log', {
  id: integer('id').primaryKey(),
  paymentLogId: integer('payment_log_id'),
  refundAmount: numeric('refund_amount'),
  stripeRefundId: text('stripe_refund_id'),
  refundedAt: timestamp('refunded_at', { withTimezone: true }),
  status: text('status')
});

// Seller Payout table
export const sellerPayout = pgTable('seller_payout', {
  id: integer('id').primaryKey(),
  sellerId: text('seller_id'),
  paymentLogId: integer('payment_log_id'),
  amount: numeric('amount'),
  stripeTransferId: text('stripe_transfer_id'),
  transferredAt: timestamp('transferred_at', { withTimezone: true }),
  status: text('status')
});

// User table
export const user = pgTable('user', {
  id: integer('id').primaryKey(),
  familyName: text('family_name'),
  country: text('country'),
  city: text('city'),
  gender: text('gender'),
  age: text('age'),
  auth0Id: text('auth0_id'),
  auth0Email: text('auth0_email'),
  auth0LoginConnection: text('auth0_login_connection'),
  email: text('email'),
  givenName: text('given_name'),
  updatedAt: timestamp('updated_at', { withTimezone: false }),
  createdAt: timestamp('created_at', { withTimezone: false }),
  avatarUrl: text('avatar_url'),
  languageCode: text('language_code')
}); 