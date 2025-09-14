import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallCouponTicket } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCouponTicket";
import type { IShoppingMallMemberUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallMemberUser";

/**
 * Test updating a coupon ticket with an authenticated member user,
 * verifying successful updates and expected authorization failures.
 *
 * This test covers the following:
 *
 * 1. Creating and authenticating a member user (User A).
 * 2. Simulating an existing coupon ticket owned by User A.
 * 3. Successfully updating the coupon ticket's status and usage by User A.
 * 4. Creating and authenticating a different member user (User B).
 * 5. Attempting to update a non-existent coupon ticket and expecting failure.
 * 6. Attempting unauthorized update by User B on User A's coupon ticket and
 *    expecting authorization failure.
 */
export async function test_api_coupon_ticket_update_member_user_success_and_authorization_failures(
  connection: api.IConnection,
) {
  // 1. Create and authenticate member user A
  const memberCreateBodyA = {
    email: typia.random<string & tags.Format<"email">>(),
    password_hash: "password1234",
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(),
    phone_number: RandomGenerator.mobile(),
    status: "active",
  } satisfies IShoppingMallMemberUser.ICreate;
  const memberA = await api.functional.auth.memberUser.join(connection, {
    body: memberCreateBodyA,
  });
  typia.assert(memberA);

  // 2. Simulate an existing coupon ticket owned by member A by generating a random UUID to represent couponTicketId
  const existingCouponTicketId = typia.random<string & tags.Format<"uuid">>();

  // 3. Successful update by member A
  const updateBody = {
    usage_status: "used",
    used_at: new Date().toISOString(),
    memberuser_id: memberA.id,
  } satisfies IShoppingMallCouponTicket.IUpdate;

  const updatedCouponTicket =
    await api.functional.shoppingMall.memberUser.couponTickets.update(
      connection,
      { couponTicketId: existingCouponTicketId, body: updateBody },
    );
  typia.assert(updatedCouponTicket);

  TestValidator.equals(
    "updated usage status matches",
    updatedCouponTicket.usage_status,
    updateBody.usage_status,
  );
  TestValidator.equals(
    "updated used_at matches",
    updatedCouponTicket.used_at,
    updateBody.used_at,
  );
  TestValidator.equals(
    "updated memberuser_id matches",
    updatedCouponTicket.memberuser_id,
    updateBody.memberuser_id,
  );

  // 4. Create and authenticate member user B to test unauthorized update
  const memberCreateBodyB = {
    email: typia.random<string & tags.Format<"email">>(),
    password_hash: "password1234",
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(),
    phone_number: RandomGenerator.mobile(),
    status: "active",
  } satisfies IShoppingMallMemberUser.ICreate;
  const memberB = await api.functional.auth.memberUser.join(connection, {
    body: memberCreateBodyB,
  });
  typia.assert(memberB);

  // 5. Try to update non-existent coupon ticket ID
  await TestValidator.error(
    "updating non-existent coupon ticket should fail",
    async () => {
      await api.functional.shoppingMall.memberUser.couponTickets.update(
        connection,
        {
          couponTicketId: typia.random<string & tags.Format<"uuid">>(),
          body: {
            usage_status: "used",
          } satisfies IShoppingMallCouponTicket.IUpdate,
        },
      );
    },
  );

  // 6. Member B attempts to update member A's coupon ticket - expect authorization failure
  // Switch to member B context by logging in
  await api.functional.auth.memberUser.login(connection, {
    body: {
      email: memberCreateBodyB.email,
      password: "password1234",
    } satisfies IShoppingMallMemberUser.ILogin,
  });

  await TestValidator.error(
    "unauthorized member user cannot update another's coupon ticket",
    async () => {
      await api.functional.shoppingMall.memberUser.couponTickets.update(
        connection,
        {
          couponTicketId: existingCouponTicketId,
          body: {
            usage_status: "used",
          } satisfies IShoppingMallCouponTicket.IUpdate,
        },
      );
    },
  );
}
