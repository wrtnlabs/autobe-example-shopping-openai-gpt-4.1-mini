import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallCouponLog } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCouponLog";

/**
 * This test validates the coupon log detail retrieval API for admin users.
 *
 * 1. Admin user is created via the join API using realistic admin user data.
 * 2. The admin user logs in to obtain authorization.
 * 3. A coupon log record is fetched by ID using the authorized context.
 * 4. The coupon log response is validated for property correctness and types.
 * 5. Unauthorized access attempt to coupon log fetch is tested and expected to
 *    fail.
 * 6. Fetching a coupon log with invalid/non-existent ID is tested and expected
 *    to fail.
 *
 * This workflow ensures proper authorization, successful retrieval, and
 * error handling.
 */
export async function test_api_coupon_log_admin_at_success_and_authorization_error(
  connection: api.IConnection,
) {
  // Step 1: Create an admin user via join with a new email
  const adminCreateBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password_hash: RandomGenerator.alphaNumeric(32),
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(),
    status: "active",
  } satisfies IShoppingMallAdminUser.ICreate;

  const createdAdmin = await api.functional.auth.adminUser.join(connection, {
    body: adminCreateBody,
  });
  typia.assert(createdAdmin);

  // Step 2: Login with the same admin credentials
  const adminLoginBody = {
    email: adminCreateBody.email,
    password_hash: adminCreateBody.password_hash,
  } satisfies IShoppingMallAdminUser.ILogin;

  const loggedInAdmin = await api.functional.auth.adminUser.login(connection, {
    body: adminLoginBody,
  });
  typia.assert(loggedInAdmin);

  // Step 3: Use authenticated connection to fetch a coupon log by ID
  // For testing, we generate a random valid UUID
  const couponLogId = typia.random<string & tags.Format<"uuid">>();

  const couponLog = await api.functional.shoppingMall.adminUser.couponLogs.at(
    connection,
    { id: couponLogId },
  );
  typia.assert(couponLog);

  // Additional validation: ensure the returned coupon log id matches requested
  TestValidator.equals(
    "coupon log id matches request",
    couponLog.id,
    couponLogId,
  );

  // Step 4: Test unauthorized access to coupon log fetch
  const unauthenticatedConnection: api.IConnection = {
    ...connection,
    headers: {}, // reset headers to simulate lack of authentication
  };

  await TestValidator.error("unauthorized coupon log fetch fails", async () => {
    await api.functional.shoppingMall.adminUser.couponLogs.at(
      unauthenticatedConnection,
      { id: couponLogId },
    );
  });

  // Step 5: Test fetching a coupon log with a non-existent ID (random UUID not likely existing)
  const nonExistentCouponLogId = typia.random<string & tags.Format<"uuid">>();

  await TestValidator.error(
    "fetching coupon log with non-existent id fails",
    async () => {
      await api.functional.shoppingMall.adminUser.couponLogs.at(connection, {
        id: nonExistentCouponLogId,
      });
    },
  );
}
