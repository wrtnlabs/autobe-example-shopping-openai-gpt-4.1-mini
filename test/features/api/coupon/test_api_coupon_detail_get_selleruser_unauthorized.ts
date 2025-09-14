import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallCoupon } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCoupon";
import type { IShoppingMallSellerUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSellerUser";

/**
 * Confirms that accessing the coupon detail endpoint without sellerUser
 * authentication is properly denied with an authorization failure.
 *
 * The test creates a sellerUser via join endpoint to have baseline
 * authentication, but then deliberately tries to access the coupon detail
 * endpoint with a connection that lacks authorization headers. It verifies
 * that the call fails, ensuring proper access control enforcement for the
 * endpoint.
 *
 * Steps:
 *
 * 1. Call the sellerUser join endpoint creating a new user.
 * 2. Construct a new unauthenticated connection (headers cleared).
 * 3. Attempt to access the coupon detail endpoint with the unauthorized
 *    connection.
 * 4. Catch and validate that an authorization error occurs.
 *
 * Ensures security policies prevent unauthorized coupon data access.
 */
export async function test_api_coupon_detail_get_selleruser_unauthorized(
  connection: api.IConnection,
) {
  // 1. Call sellerUser join endpoint with valid random payload
  const joinBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password: RandomGenerator.alphaNumeric(12),
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(2),
    phone_number: RandomGenerator.mobile(),
    business_registration_number: RandomGenerator.alphaNumeric(10),
  } satisfies IShoppingMallSellerUser.ICreate;

  await api.functional.auth.sellerUser.join(connection, { body: joinBody });

  // 2. Create unauthenticated connection by clearing headers
  const unauthConn: api.IConnection = { ...connection, headers: {} };

  // 3. Attempt to access coupon detail with unauthorized connection
  const couponId = typia.random<string & tags.Format<"uuid">>();

  await TestValidator.error(
    "Accessing coupon detail without sellerUser authentication should fail",
    async () => {
      await api.functional.shoppingMall.sellerUser.coupons.at(unauthConn, {
        couponId,
      });
    },
  );
}
