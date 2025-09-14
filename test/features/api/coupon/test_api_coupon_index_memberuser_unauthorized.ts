import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IPage } from "@ORGANIZATION/PROJECT-api/lib/structures/IPage";
import type { IPageIShoppingMallCoupon } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageIShoppingMallCoupon";
import type { IShoppingMallCoupon } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCoupon";
import type { IShoppingMallMemberUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallMemberUser";

/**
 * This test function verifies that accessing the member user coupons list API
 * endpoint without proper authorization is correctly rejected. The API endpoint
 * is PATCH /shoppingMall/memberUser/coupons which requires memberUser role
 * authorization. Before testing unauthorized access, the member user join
 * function (POST /auth/memberUser/join) must be called as a prerequisite to
 * establish any member user in the system. No authentication headers or tokens
 * will be set for this test, simulating an unauthorized or unauthenticated user
 * attempting access.
 *
 * The test will attempt to call the coupons index API with an empty request
 * body (since all fields are optional in the coupon search criteria DTO). It
 * expects the API to reject the request due to missing authentication or
 * insufficient role privileges. The test verifies that an error is thrown in
 * this case, confirming that the authorization mechanism protects the resource
 * appropriately.
 *
 * Key points:
 *
 * 1. Call the dependency join API to match scenario requirements.
 * 2. Attempt to call the coupons index API without any authentication context.
 * 3. Confirm that the call throws an error indicating unauthorized access.
 * 4. Do not set headers or tokens manually - rely on the lack of authentication.
 * 5. Provide an empty search criteria body for the coupons index API call.
 * 6. Validate the error is thrown using TestValidator.error with an async
 *    callback.
 *
 * This test confirms the security of the coupons listing endpoint for member
 * users against unauthorized access attempts.
 */
export async function test_api_coupon_index_memberuser_unauthorized(
  connection: api.IConnection,
) {
  // 1. Prerequisite: Join member user for proper testing alignment
  //    (This call establishes member user accounts, but no authentication
  //    context will be used to simulate unauthorized access)
  await api.functional.auth.memberUser.join(connection, {
    body: {
      email: "unauth_test@example.com",
      password_hash: "dummyPassword123!",
      nickname: "unauthorizedUser",
      full_name: "Unauthorized User",
      phone_number: null,
      status: "active",
    } satisfies IShoppingMallMemberUser.ICreate,
  });

  // 2. Attempt to call the coupons index without authentication
  //    Using empty filter criteria as body
  await TestValidator.error(
    "should reject coupon index access without authorization",
    async () => {
      await api.functional.shoppingMall.memberUser.coupons.index(connection, {
        body: {
          coupon_code: null,
          coupon_name: null,
          status: null,
          page: null,
          limit: null,
          start_date_from: null,
          end_date_to: null,
          order_by: null,
        } satisfies IShoppingMallCoupon.IRequest,
      });
    },
  );
}
