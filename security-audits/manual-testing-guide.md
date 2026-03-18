# Manual Security Testing Guide

This document outlines the manual procedures to verify the security hardening and stability measures implemented in the platform.

## 1. Super-Admin Security Gate
**Objective**: Ensure the platform management interface is inaccessible to unauthorized users.

*   **Unauthorized Access**:
    1.  Log out of the application.
    2.  Try to visit `http://lvh.me:3000/super-admin`.
    3.  **Expected Result**: Automatic redirection to the main login page. The dashboard sidebar and layout must not be visible.
*   **Authorized Access**:
    1.  Log in with an email listed in `SUPER_ADMIN_EMAILS` (e.g., `mr.luckymano2005@gmail.com`).
    2.  **Expected Result**: Full access to global stats and management features.

---

## 2. Tenant Data Isolation (Anti-IDOR)
**Objective**: Verify that one merchant cannot view or modify another merchant's data.

*   **The Cross-Store Test**:
    1.  Open Store A (`burger.lvh.me`) and log in as Owner A.
    2.  Open Store B (`pizza.lvh.me`) in a separate Incognito window.
    3.  Obtain a UUID for a resource (Order, Menu Item, Category) from Store B's DevTools.
    4.  Attempt to call a server action (e.g., `deleteMenuItemServer`) using Store B's UUID while authenticated as Owner A.
    5.  **Expected Result**: Server returns `Unauthorized: Tenant ownership required`.

---

## 3. Cart & Session Isolation
**Objective**: Prevent session hijacking or cross-user cart manipulation.

*   **Session Cross-Check**:
    1.  Add items to a cart in Browser Session 1.
    2.  Copy the `sessionId` from `localStorage`.
    3.  In Browser Session 2, attempt to update a `cartId` from Session 1 using Session 2's ID via the console.
    4.  **Expected Result**: Action rejected or ignored due to session-record mismatch in the database.

---

## 4. Store Status Validation
**Objective**: Ensure actions are blocked when a store is suspended.

*   **Suspension Enforcement**:
    1.  Use the Super-Admin panel to set a store's status to `Suspended`.
    2.  Visit the store URL.
    3.  **Expected Result**: "Store Offline" screen appears.
    4.  Manually attempt to call `createOrder` for that store via the console.
    5.  **Expected Result**: Action fails with error: `Store is currently suspended. Orders are not being accepted.`

---

## 5. Security Header Verification
**Objective**: Confirm production-grade browser protections are active.

*   **Header Audit**:
    1.  Open Browser DevTools -> Network Tab.
    2.  Refresh the store page and select the top-level document request.
    3.  Check **Response Headers**.
    4.  **Expected Result**:
        *   `Content-Security-Policy`: Present and restricting sources.
        *   `X-Frame-Options`: `DENY`
        *   `X-Content-Type-Options`: `nosniff`
        *   `X-XSS-Protection`: `1; mode=block`

---

## 6. Performance & Redis Caching
**Objective**: Verify that security gates are optimized.

*   **Console Log Monitoring**:
    1.  Monitor the server terminal output during navigation.
    2.  **Expected Result**: `[Cache Hit]` logs should appear for frequent authorization checks (Tenant Config, Ownership), indicating Redis is successfully offloading database queries.
