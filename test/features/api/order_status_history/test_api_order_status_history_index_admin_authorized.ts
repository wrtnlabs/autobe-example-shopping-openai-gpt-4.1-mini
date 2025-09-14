import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IPage } from "@ORGANIZATION/PROJECT-api/lib/structures/IPage";
import type { IPageIShoppingMallOrderStatusHistory } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageIShoppingMallOrderStatusHistory";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallOrderStatusHistory } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallOrderStatusHistory";

/**
 * This E2E test verifies the adminUser's ability to search and retrieve
 * order status history records through the paginated PATCH
 * /shoppingMall/adminUser/orderStatusHistories endpoint.
 *
 * The tests include creating an administrator user account, logging in with
 * that account to set the authentication context, and then performing
 * multiple search retrievals with varied filters and pagination parameters
 * to validate functionality.
 *
 * Successful scenarios cover retrieving lists with and without filters such
 * as orderId, oldStatus, newStatus, changed timestamp ranges, different
 * page limits, and checking the response structure and pagination
 * correctness.
 *
 * Failure scenarios ensure unauthorized attempts (without admin
 * authentication) are rejected, invalid input parameters like negative page
 * numbers or limits raise errors, and edge cases like empty results due to
 * non-existent filtering values are handled properly.
 *
 * The test only utilizes API functions for admin user join and login to
 * establish auth context and the main order status histories search
 * function, ensuring that only authorized admin users have access as per
 * the business rule.
 *
 * All API responses are validated with typia.assert to confirm schema
 * conformance, and TestValidator assertions verify business rules and error
 * enforcement.
 *
 * The test maintains type safety and uses realistic random data for
 * creating test admin user accounts.
 */
export async function test_api_order_status_history_index_admin_authorized(
  connection: api.IConnection,
) {
  // 1. Create admin user account (join) for authorization context
  const createAdminBody = {
    email: `admin${Date.now()}@example.com`,
    password_hash: RandomGenerator.alphaNumeric(16),
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(2),
    status: "active",
  } satisfies IShoppingMallAdminUser.ICreate;
  const adminUser: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: createAdminBody,
    });
  typia.assert(adminUser);

  // 2. Login with admin user credentials to switch authentication context
  const loginBody = {
    email: createAdminBody.email,
    password_hash: createAdminBody.password_hash,
  } satisfies IShoppingMallAdminUser.ILogin;
  const loggedInAdmin: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.login(connection, { body: loginBody });
  typia.assert(loggedInAdmin);

  // 3. Use authorized admin context for order status history searches

  // Test without filters (basic pagination)
  const resultDefault: IPageIShoppingMallOrderStatusHistory =
    await api.functional.shoppingMall.adminUser.orderStatusHistories.index(
      connection,
      {
        body: {}, // No filters, defaults
      },
    );
  typia.assert(resultDefault);
  TestValidator.predicate(
    "pagination records length non-negative",
    resultDefault.data.length >= 0,
  );
  TestValidator.predicate(
    "pagination current page is 0 or more",
    resultDefault.pagination.current >= 0,
  );
  TestValidator.predicate(
    "pagination limit is 0 or more",
    resultDefault.pagination.limit >= 0,
  );

  // Test filtering by an unlikely orderId to generate empty results
  const resultEmpty: IPageIShoppingMallOrderStatusHistory =
    await api.functional.shoppingMall.adminUser.orderStatusHistories.index(
      connection,
      {
        body: {
          order_id: typia.random<string & tags.Format<"uuid">>(),
          page: 0,
          limit: 10,
        } satisfies IShoppingMallOrderStatusHistory.IRequest,
      },
    );
  typia.assert(resultEmpty);
  TestValidator.equals(
    "empty data array on non-existent orderId",
    resultEmpty.data.length,
    0,
  );

  // Test filtering by old_status and new_status with random strings
  const filterOldStatus = RandomGenerator.name(1);
  const filterNewStatus = RandomGenerator.name(1);
  const resultFilterStatus: IPageIShoppingMallOrderStatusHistory =
    await api.functional.shoppingMall.adminUser.orderStatusHistories.index(
      connection,
      {
        body: {
          old_status: filterOldStatus,
          new_status: filterNewStatus,
          page: 0,
          limit: 5,
        } satisfies IShoppingMallOrderStatusHistory.IRequest,
      },
    );
  typia.assert(resultFilterStatus);

  // Search with changed_at range: from recent date to now
  const changedFrom = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const changedTo = new Date().toISOString();
  const resultDateRange: IPageIShoppingMallOrderStatusHistory =
    await api.functional.shoppingMall.adminUser.orderStatusHistories.index(
      connection,
      {
        body: {
          changed_at_from: changedFrom,
          changed_at_to: changedTo,
          page: 0,
          limit: 10,
        } satisfies IShoppingMallOrderStatusHistory.IRequest,
      },
    );
  typia.assert(resultDateRange);

  // Test invalid input: negative page number - expect error
  await TestValidator.error("page cannot be negative", async () => {
    await api.functional.shoppingMall.adminUser.orderStatusHistories.index(
      connection,
      {
        body: {
          page: -1,
        } satisfies IShoppingMallOrderStatusHistory.IRequest,
      },
    );
  });

  // Test invalid input: negative limit number - expect error
  await TestValidator.error("limit cannot be negative", async () => {
    await api.functional.shoppingMall.adminUser.orderStatusHistories.index(
      connection,
      {
        body: {
          limit: -5,
        } satisfies IShoppingMallOrderStatusHistory.IRequest,
      },
    );
  });

  // Unauthorized access test: try access without admin login
  // - Use a cloned connection without Authorization header
  const unauthConnection: api.IConnection = { ...connection, headers: {} };
  await TestValidator.error("unauthorized access should fail", async () => {
    await api.functional.shoppingMall.adminUser.orderStatusHistories.index(
      unauthConnection,
      {
        body: {},
      },
    );
  });
}
