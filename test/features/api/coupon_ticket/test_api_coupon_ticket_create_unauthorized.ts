import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallCouponTicket } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCouponTicket";
import type { IShoppingMallMemberUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallMemberUser";

/**
 * Test that creating a coupon ticket without authentication fails.
 *
 * This test performs the required join operation to register a member user,
 * then attempts to create a coupon ticket using an unauthenticated
 * connection. The attempt should throw an HTTP error indicating
 * unauthorized access.
 */
export async function test_api_coupon_ticket_create_unauthorized(
  connection: api.IConnection,
) {
  // 1. Join the member user to establish the user in the system
  const user = await api.functional.auth.memberUser.join(connection, {
    body: {
      email: typia.random<string & tags.Format<"email">>(),
      password_hash: RandomGenerator.alphaNumeric(10),
      nickname: RandomGenerator.name(),
      full_name: RandomGenerator.name(),
      phone_number: null,
      status: "active",
    } satisfies IShoppingMallMemberUser.ICreate,
  });
  typia.assert(user);

  // 2. Prepare an unauthenticated connection with empty headers
  const unauthenticatedConnection: api.IConnection = {
    ...connection,
    headers: {},
  };

  // 3. Prepare a coupon ticket creation payload using valid data
  const now = new Date();
  const validFrom = now.toISOString();
  const validUntil = new Date(
    now.getTime() + 7 * 24 * 60 * 60 * 1000,
  ).toISOString(); // 7 days later

  const couponTicketCreate = {
    shopping_mall_coupon_id: typia.random<string & tags.Format<"uuid">>(),
    ticket_code: RandomGenerator.alphaNumeric(12),
    valid_from: validFrom,
    valid_until: validUntil,
    usage_status: "unused",
    used_at: null,
  } satisfies IShoppingMallCouponTicket.ICreate;

  // 4. Attempt to create coupon ticket using unauthenticated connection and expect error
  await TestValidator.error(
    "should reject coupon ticket creation without authentication",
    async () => {
      await api.functional.shoppingMall.memberUser.couponTickets.create(
        unauthenticatedConnection,
        { body: couponTicketCreate },
      );
    },
  );
}
