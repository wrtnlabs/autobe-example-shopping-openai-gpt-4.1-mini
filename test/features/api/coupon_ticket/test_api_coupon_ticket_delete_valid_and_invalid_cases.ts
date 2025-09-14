import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallCouponTicket } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCouponTicket";
import type { IShoppingMallMemberUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallMemberUser";

export async function test_api_coupon_ticket_delete_valid_and_invalid_cases(
  connection: api.IConnection,
) {
  // 1. Create first member user (User A) and authenticate
  const userABody = {
    email: typia.random<string & tags.Format<"email">>(),
    password_hash: "hash_a12345",
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(2),
    phone_number: null,
    status: "active",
  } satisfies IShoppingMallMemberUser.ICreate;
  const userA: IShoppingMallMemberUser.IAuthorized =
    await api.functional.auth.memberUser.join(connection, {
      body: userABody,
    });
  typia.assert(userA);

  // 2. Create coupon ticket assigned to User A
  const now = new Date();
  const validFrom = now.toISOString();
  const validUntil = new Date(
    now.getTime() + 7 * 24 * 60 * 60 * 1000,
  ).toISOString();
  const ticketCode = RandomGenerator.alphaNumeric(16);

  const couponTicketBody = {
    shopping_mall_coupon_id: typia.random<string & tags.Format<"uuid">>(),
    memberuser_id: userA.id,
    ticket_code: ticketCode,
    valid_from: validFrom,
    valid_until: validUntil,
    usage_status: "unused",
  } satisfies IShoppingMallCouponTicket.ICreate;
  const couponTicket: IShoppingMallCouponTicket =
    await api.functional.shoppingMall.memberUser.couponTickets.create(
      connection,
      {
        body: couponTicketBody,
      },
    );
  typia.assert(couponTicket);
  TestValidator.equals(
    "created coupon ticket memberuser_id matches",
    couponTicket.memberuser_id,
    userA.id,
  );

  // 3. Successfully delete coupon ticket by User A
  await api.functional.shoppingMall.memberUser.couponTickets.erase(connection, {
    couponTicketId: couponTicket.id,
  });

  // 4. Create second member user (User B) and authenticate
  const userBBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password_hash: "hash_b12345",
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(2),
    phone_number: null,
    status: "active",
  } satisfies IShoppingMallMemberUser.ICreate;
  const userB: IShoppingMallMemberUser.IAuthorized =
    await api.functional.auth.memberUser.join(connection, {
      body: userBBody,
    });
  typia.assert(userB);

  // 5. Attempt to delete User A's coupon ticket by User B - expecting error
  // We need a coupon ticket owned by user A to attempt deletion again.
  // Create a new coupon ticket by User A for deletion attempt
  const couponTicketBody2 = {
    shopping_mall_coupon_id: typia.random<string & tags.Format<"uuid">>(),
    memberuser_id: userA.id,
    ticket_code: RandomGenerator.alphaNumeric(16),
    valid_from: validFrom,
    valid_until: validUntil,
    usage_status: "unused",
  } satisfies IShoppingMallCouponTicket.ICreate;
  const couponTicket2: IShoppingMallCouponTicket =
    await api.functional.shoppingMall.memberUser.couponTickets.create(
      connection,
      {
        body: couponTicketBody2,
      },
    );
  typia.assert(couponTicket2);
  TestValidator.equals(
    "created coupon ticket2 memberuser_id matches",
    couponTicket2.memberuser_id,
    userA.id,
  );

  // Attempt to delete couponTicket2 owned by User A with User B auth
  await TestValidator.error(
    "User B cannot delete User A's coupon ticket",
    async () => {
      await api.functional.shoppingMall.memberUser.couponTickets.erase(
        connection,
        {
          couponTicketId: couponTicket2.id,
        },
      );
    },
  );

  // 6. Attempt to delete non-existing coupon ticket with invalid UUID by User B
  const fakeCouponTicketId = typia.random<string & tags.Format<"uuid">>();
  await TestValidator.error(
    "User B cannot delete non-existing coupon ticket",
    async () => {
      await api.functional.shoppingMall.memberUser.couponTickets.erase(
        connection,
        {
          couponTicketId: fakeCouponTicketId,
        },
      );
    },
  );

  // 7. Attempt to delete coupon ticket without authentication
  // Create unauthenticated connection by removing headers
  const unauthenticatedConnection: api.IConnection = {
    ...connection,
    headers: {},
  };
  await TestValidator.error(
    "Unauthenticated user cannot delete coupon ticket",
    async () => {
      await api.functional.shoppingMall.memberUser.couponTickets.erase(
        unauthenticatedConnection,
        {
          couponTicketId: couponTicket2.id,
        },
      );
    },
  );
}
