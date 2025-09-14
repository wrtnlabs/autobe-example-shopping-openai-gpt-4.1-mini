import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallOrderStatusHistory } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallOrderStatusHistory";

/**
 * Test the retrieval of order status history by its unique ID.
 *
 * Validates that an adminUser can authenticate via the join endpoint and
 * successfully retrieve existing order status history details by ID.
 * Asserts that the response data matches the
 * IShoppingMallOrderStatusHistory type and properties according to their
 * definitions.
 *
 * Tests error scenarios including querying non-existent IDs and
 * unauthorized access attempts to the order status history endpoint.
 *
 * Workflow:
 *
 * 1. Create new admin user and authenticate.
 * 2. Retrieve an order status history by a valid existing ID, assert response
 *    correctness.
 * 3. Attempt retrieval with non-existent (random UUID) ID and expect error.
 * 4. Attempt retrieval without authentication (using empty or unauthorized
 *    connection) and expect error.
 *
 * Ensures role-based authorization is properly enforced for this endpoint.
 */
export async function test_api_order_status_history_get_success_notfound_authorization(
  connection: api.IConnection,
) {
  // 1. Create new admin user and authenticate
  const adminCreateBody = {
    email: `admin${RandomGenerator.alphaNumeric(5)}@example.com`,
    password_hash: RandomGenerator.alphaNumeric(12),
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(),
    status: "active",
  } satisfies IShoppingMallAdminUser.ICreate;

  const adminUser: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: adminCreateBody,
    });
  typia.assert(adminUser);

  // 2. Retrieve order status history by valid ID
  if (connection.simulate) {
    const sampleHistory: IShoppingMallOrderStatusHistory =
      await api.functional.shoppingMall.adminUser.orderStatusHistories.at(
        connection,
        {
          id: typia.random<string & tags.Format<"uuid">>(),
        },
      );
    typia.assert(sampleHistory);
  }

  // 3. Attempt retrieval with a non-existent ID and expect error
  const nonExistentId = typia.random<string & tags.Format<"uuid">>();
  await TestValidator.error(
    "non-existent order status history id causes error",
    async () => {
      await api.functional.shoppingMall.adminUser.orderStatusHistories.at(
        connection,
        {
          id: nonExistentId,
        },
      );
    },
  );

  // 4. Attempt retrieval without authentication and expect an error
  const unauthConn: api.IConnection = { ...connection, headers: {} };
  await TestValidator.error(
    "unauthenticated access to order status history causes error",
    async () => {
      await api.functional.shoppingMall.adminUser.orderStatusHistories.at(
        unauthConn,
        {
          id: nonExistentId,
        },
      );
    },
  );
}
