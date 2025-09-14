import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IPage } from "@ORGANIZATION/PROJECT-api/lib/structures/IPage";
import type { IPageIShoppingMallPayment } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageIShoppingMallPayment";
import type { IShoppingMallGuestUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallGuestUser";
import type { IShoppingMallPayment } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallPayment";

/**
 * Test the failure scenario when an unauthorized guest user attempts to
 * retrieve payment applications for an order without a valid guest user
 * authentication context. The operation should be denied and return
 * appropriate authorization error.
 *
 * This test first executes the required guestUser join to establish a valid
 * guestUser role authentication context. Then, it attempts to call the
 * shoppingMall.guestUser.orders.payments.index API using an unauthenticated
 * connection (empty headers) to simulate unauthorized access.
 *
 * The test validates that the API call fails with an authorization error
 * (e.g., HttpError 401 or 403). It uses a random orderId in UUID format and
 * a valid payment filtering request body satisfying all schema
 * requirements.
 *
 * Await and async usage are strictly applied to all API calls and
 * TestValidator.error to ensure proper asynchronous test validation.
 */
export async function test_api_guest_user_order_payments_unauthorized_error(
  connection: api.IConnection,
) {
  // 1. Run the required guestUser join dependency to establish authentication context
  const guestUser: IShoppingMallGuestUser.IAuthorized =
    await api.functional.auth.guestUser.join(connection, {
      body: {
        ip_address: "127.0.0.1",
        access_url: "https://example.com",
        referrer: null,
        user_agent: null,
      } satisfies IShoppingMallGuestUser.IJoin,
    });
  typia.assert(guestUser);

  // 2. Create an unauthenticated connection with empty headers (simulate missing token)
  const unauthenticated: api.IConnection = { ...connection, headers: {} };

  // 3. Attempt to call payments index API without authorization, expect error
  await TestValidator.error(
    "unauthorized guest user cannot access order payments",
    async () => {
      await api.functional.shoppingMall.guestUser.orders.payments.index(
        unauthenticated,
        {
          orderId: typia.random<string & tags.Format<"uuid">>(),
          body: {
            page: 1,
            limit: 30,
            payment_method: null,
            payment_status: null,
            created_at_from: null,
            created_at_to: null,
          } satisfies IShoppingMallPayment.IRequest,
        },
      );
    },
  );
}
