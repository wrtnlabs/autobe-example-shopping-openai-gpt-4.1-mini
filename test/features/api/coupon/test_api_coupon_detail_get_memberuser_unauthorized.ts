import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallCoupon } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCoupon";
import type { IShoppingMallMemberUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallMemberUser";

/**
 * Test that unauthorized attempts to retrieve coupon details without proper
 * memberUser authentication are rejected with an appropriate error.
 *
 * This test first creates a member user account to satisfy prerequisites but
 * then attempts to fetch coupon details without authentication, expecting a
 * failure.
 *
 * Steps:
 *
 * 1. Member user joins to create an authorized account.
 * 2. Attempt to fetch coupon detail with an unauthenticated connection.
 * 3. Verify that an error is thrown indicating unauthorized access.
 */
export async function test_api_coupon_detail_get_memberuser_unauthorized(
  connection: api.IConnection,
) {
  // 1. Create a new member user account to fulfill authentication prerequisite
  const createMemberUserBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password_hash: RandomGenerator.alphaNumeric(8),
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(),
    phone_number: null,
    status: "active",
  } satisfies IShoppingMallMemberUser.ICreate;

  const memberUser = await api.functional.auth.memberUser.join(connection, {
    body: createMemberUserBody,
  });
  typia.assert(memberUser);

  // 2. Use an unauthenticated connection (empty headers) for unauthorized access
  const unauthenticatedConnection: api.IConnection = {
    ...connection,
    headers: {},
  };

  // Use a random valid UUID string as couponId
  const randomCouponId = typia.random<string & tags.Format<"uuid">>();

  // 3. Attempt to fetch coupon detail without authentication, expect error
  await TestValidator.error(
    "unauthorized coupon detail access throws error",
    async () => {
      await api.functional.shoppingMall.memberUser.coupons.at(
        unauthenticatedConnection,
        { couponId: randomCouponId },
      );
    },
  );
}
