import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallCouponTicket } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCouponTicket";
import type { IShoppingMallMemberUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallMemberUser";

/**
 * Test case for creating a coupon ticket with a non-existent coupon ID
 *
 * This test validates the business logic that the system rejects attempts
 * to create a coupon ticket linked to a coupon ID that does not exist in
 * the system. It covers an authenticated member user scenario.
 *
 * Test steps:
 *
 * 1. Register a new member user via the /auth/memberUser/join endpoint.
 * 2. Attempt to create a coupon ticket using the
 *    /shoppingMall/memberUser/couponTickets endpoint, providing a random
 *    UUID as the coupon ID that is guaranteed to be non-existent.
 * 3. Validate that the system rejects the creation attempt by checking that an
 *    error is thrown (such as HttpError 404 or similar).
 *
 * This ensures the backend properly enforces referential integrity and
 * prevents the issuance of coupon tickets for invalid coupons.
 */
export async function test_api_coupon_ticket_create_coupon_not_found(
  connection: api.IConnection,
) {
  // Step 1: Register a new member user
  const memberUserCreate = {
    email: typia.random<string & tags.Format<"email">>(),
    password_hash: RandomGenerator.alphaNumeric(12),
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(2),
    phone_number: null,
    status: "active",
  } satisfies IShoppingMallMemberUser.ICreate;

  const memberUser: IShoppingMallMemberUser.IAuthorized =
    await api.functional.auth.memberUser.join(connection, {
      body: memberUserCreate,
    });
  typia.assert(memberUser);

  // Step 2: Attempt to create a coupon ticket with a non-existent coupon ID
  const invalidCouponId = typia.random<string & tags.Format<"uuid">>(); // random UUID

  const couponTicketCreate = {
    shopping_mall_coupon_id: invalidCouponId,
    memberuser_id: memberUser.id,
    ticket_code: RandomGenerator.alphaNumeric(12),
    valid_from: new Date().toISOString(),
    valid_until: new Date(Date.now() + 86400_000).toISOString(), // +1 day
    usage_status: "unused",
    used_at: null,
  } satisfies IShoppingMallCouponTicket.ICreate;

  await TestValidator.error(
    "should fail to create coupon ticket with non-existent coupon ID",
    async () => {
      await api.functional.shoppingMall.memberUser.couponTickets.create(
        connection,
        {
          body: couponTicketCreate,
        },
      );
    },
  );
}
