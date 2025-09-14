import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallCoupon } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCoupon";

/**
 * Validate access control by attempting to get coupon details without
 * adminUser authentication.
 *
 * This E2E test covers the security scenario where an unauthorized request
 * is made to the coupon detail endpoint reserved for adminUsers.
 *
 * The following steps are performed:
 *
 * 1. Create an admin user to ensure that adminUser authentication context can
 *    be established.
 * 2. Attempt to retrieve coupon details using a separate unauthenticated
 *    connection, which should fail.
 *
 * Expected result: the coupon detail retrieval call without proper
 * authorization must fail with an HTTP unauthorized error or throw an
 * authorization exception.
 */
export async function test_api_coupon_detail_get_adminuser_unauthorized(
  connection: api.IConnection,
) {
  // Step 1: Create admin user to establish baseline context
  const adminUserCreateBody = {
    email: `${RandomGenerator.alphaNumeric(6).toLowerCase()}@example.com`,
    password_hash: RandomGenerator.alphaNumeric(12),
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(2),
    status: "active",
  } satisfies IShoppingMallAdminUser.ICreate;

  const adminUserAuth: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: adminUserCreateBody,
    });
  typia.assert(adminUserAuth);

  // Step 2: Create a new connection without authentication headers
  const unauthenticatedConnection: api.IConnection = {
    ...connection,
    headers: {},
  };

  // Step 3: Use a random valid UUID as couponId for test call
  const couponId = typia.random<string & tags.Format<"uuid">>();

  // Step 4: Attempt to call coupon detail endpoint without authentication, expect error
  await TestValidator.error(
    "GET /shoppingMall/adminUser/coupons/{couponId} without adminUser authentication should fail",
    async () => {
      await api.functional.shoppingMall.adminUser.coupons.at(
        unauthenticatedConnection,
        { couponId },
      );
    },
  );
}
