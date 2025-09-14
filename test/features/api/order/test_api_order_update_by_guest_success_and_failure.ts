import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallGuestUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallGuestUser";
import type { IShoppingMallOrder } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallOrder";

/**
 * Tests the ability of a guest user to update an existing order.
 *
 * This test verifies both successful updates by the authenticated guest
 * user and failure scenarios including unauthorized access attempts and
 * updates to non-existent orders.
 *
 * The process involves guest user session creation (authentication join),
 * order update attempts with valid and invalid tokens, and validation of
 * updated order data.
 *
 * Steps:
 *
 * 1. Create a new guest user session using /auth/guestUser/join
 * 2. With this session, update an existing order's status, payment status, and
 *    total price to valid new values
 * 3. Assert the update was successful and the returned data matches
 *    expectations
 * 4. Create a second guest user session to simulate an unauthorized user
 * 5. Attempt to update the first order with the second user's token; expect
 *    failure
 * 6. Attempt to update a non-existent order ID with the authorized guest user;
 *    expect failure
 *
 * This comprehensive test covers primary success and major failure cases
 * around guest user order updates.
 */
export async function test_api_order_update_by_guest_success_and_failure(
  connection: api.IConnection,
) {
  // 1. Guest user joins to obtain an authorized session
  const guestSession1: IShoppingMallGuestUser.IAuthorized =
    await api.functional.auth.guestUser.join(connection, {
      body: {
        ip_address: "127.0.0.1",
        access_url: "https://shoppingmall.example.com",
        referrer: null,
        user_agent: null,
      } satisfies IShoppingMallGuestUser.IJoin,
    });
  typia.assert(guestSession1);

  // 2. Assume an existing order ID for update - simulate realistic UUID
  // In a real test, this would be obtained from order creation or fixture
  const existingOrderId = typia.random<string & tags.Format<"uuid">>();

  // 3. Compose update payload with realistic order_status, payment_status, total_price
  const updatedOrderPayload = {
    order_status: "confirmed",
    payment_status: "paid",
    total_price: 25000,
  } satisfies IShoppingMallOrder.IUpdate;

  // 4. Update order with authorized guest token
  const updatedOrder: IShoppingMallOrder =
    await api.functional.shoppingMall.guestUser.orders.updateOrder(connection, {
      orderId: existingOrderId,
      body: updatedOrderPayload,
    });
  typia.assert(updatedOrder);

  // 5. Validate that the returned order matches the update request where applicable
  TestValidator.equals(
    "order ID matches after update",
    updatedOrder.id,
    existingOrderId,
  );
  TestValidator.equals(
    "order status updated correctly",
    updatedOrder.order_status,
    updatedOrderPayload.order_status,
  );
  TestValidator.equals(
    "payment status updated correctly",
    updatedOrder.payment_status,
    updatedOrderPayload.payment_status,
  );
  TestValidator.equals(
    "total price updated correctly",
    updatedOrder.total_price,
    updatedOrderPayload.total_price,
  );

  // 6. Create a second guest user session for unauthorized update attempt
  const guestSession2: IShoppingMallGuestUser.IAuthorized =
    await api.functional.auth.guestUser.join(connection, {
      body: {
        ip_address: "192.168.1.1",
        access_url: "https://shoppingmall.example.com",
        referrer: null,
        user_agent: null,
      } satisfies IShoppingMallGuestUser.IJoin,
    });
  typia.assert(guestSession2);

  // 7. Attempt to update the order with the second guest user's token
  // This is expected to fail as user is unauthorized
  const unauthorizedUpdatePayload = {
    order_status: "cancelled",
  } satisfies IShoppingMallOrder.IUpdate;

  // Compose a new connection object to simulate request with second guest token
  // SDK manages headers automatically, so we simulate the login by calling join
  // and use the same connection object but the token handling is internal

  await TestValidator.error(
    "unauthorized guest cannot update order",
    async () => {
      const tempConn: api.IConnection = { ...connection };

      // Call join API for guestSession2 to set Authorization header
      await api.functional.auth.guestUser.join(tempConn, {
        body: {
          ip_address: "192.168.1.1",
          access_url: "https://shoppingmall.example.com",
          referrer: null,
          user_agent: null,
        } satisfies IShoppingMallGuestUser.IJoin,
      });

      // Now attempt update with this new token in tempConn
      await api.functional.shoppingMall.guestUser.orders.updateOrder(tempConn, {
        orderId: existingOrderId,
        body: unauthorizedUpdatePayload,
      });
    },
  );

  // 8. Attempt to update a non-existent order ID with the authorized guest
  // This should fail (error expected)
  const nonExistentOrderId = typia.random<string & tags.Format<"uuid">>();

  await TestValidator.error(
    "updating non-existent order should fail",
    async () => {
      await api.functional.shoppingMall.guestUser.orders.updateOrder(
        connection,
        {
          orderId: nonExistentOrderId,
          body: updatedOrderPayload,
        },
      );
    },
  );
}
