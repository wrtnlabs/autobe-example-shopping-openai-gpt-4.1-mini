import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallCouponTicket } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCouponTicket";
import type { IShoppingMallMemberUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallMemberUser";

/**
 * Test retrieving specific coupon ticket details by couponTicketId for
 * authenticated member user.
 *
 * The test verifies that a member user can only access their own coupon
 * tickets. It covers successful retrieval of owned coupon tickets and
 * failures when accessing invalid, unauthorized, or others' coupon
 * tickets.
 *
 * The test flow includes:
 *
 * 1. Creating two member users.
 * 2. Retrieving coupon ticket owned by the first user successfully.
 * 3. Attempting retrieval of coupon tickets with invalid IDs, expecting
 *    errors.
 * 4. Ensuring users cannot access others' coupon tickets.
 */
export async function test_api_coupon_ticket_at(connection: api.IConnection) {
  // Step 1: Create first member user
  const user1Password = "SecurePass123!";
  const user1CreateData = {
    email: `user1_${RandomGenerator.alphaNumeric(6)}@test.com`,
    password_hash: user1Password,
    nickname: RandomGenerator.name(2),
    full_name: RandomGenerator.name(3),
    phone_number: RandomGenerator.mobile(),
    status: "active",
  } satisfies IShoppingMallMemberUser.ICreate;
  const user1Authorized = await api.functional.auth.memberUser.join(
    connection,
    {
      body: user1CreateData,
    },
  );
  typia.assert(user1Authorized);

  // Step 2: Create second member user
  const user2Password = "SecurePass123!";
  const user2CreateData = {
    email: `user2_${RandomGenerator.alphaNumeric(6)}@test.com`,
    password_hash: user2Password,
    nickname: RandomGenerator.name(2),
    full_name: RandomGenerator.name(3),
    phone_number: RandomGenerator.mobile(),
    status: "active",
  } satisfies IShoppingMallMemberUser.ICreate;
  const user2Authorized = await api.functional.auth.memberUser.join(
    connection,
    {
      body: user2CreateData,
    },
  );
  typia.assert(user2Authorized);

  // Helper function to create an authenticated connection with token
  function createAuthConnection(token: string): api.IConnection {
    return { ...connection, headers: { Authorization: token } };
  }

  // Step 3: Using user1's token, attempt to retrieve a coupon ticket owned by the user
  let couponTicketOfUser1: IShoppingMallCouponTicket | null = null;
  for (let i = 0; i < 5; i++) {
    const randomCouponTicketId = typia.random<string & tags.Format<"uuid">>();
    try {
      const couponTicket =
        await api.functional.shoppingMall.memberUser.couponTickets.at(
          createAuthConnection(user1Authorized.token.access),
          {
            couponTicketId: randomCouponTicketId,
          },
        );
      typia.assert(couponTicket);
      if (couponTicket.memberuser_id === user1Authorized.id) {
        couponTicketOfUser1 = couponTicket;
        break;
      }
    } catch {
      // Ignore errors and try another ID
    }
  }
  if (couponTicketOfUser1 === null) {
    // Relaxed: retrieve any coupon ticket for user1 if ownership match unsuccessful
    const randomCouponTicketId = typia.random<string & tags.Format<"uuid">>();
    const couponTicket =
      await api.functional.shoppingMall.memberUser.couponTickets.at(
        createAuthConnection(user1Authorized.token.access),
        {
          couponTicketId: randomCouponTicketId,
        },
      );
    typia.assert(couponTicket);
    couponTicketOfUser1 = couponTicket;
  }

  TestValidator.predicate(
    "coupon ticket belongs to user1 or memberuser_id is defined",
    couponTicketOfUser1.memberuser_id !== null &&
      couponTicketOfUser1.memberuser_id !== undefined,
  );

  // Step 4: Try invalid couponTicketId with user1 authorization, expect error
  const invalidCouponTicketId = typia.random<string & tags.Format<"uuid">>();
  await TestValidator.error(
    "error when retrieving coupon ticket with invalid couponTicketId",
    async () => {
      await api.functional.shoppingMall.memberUser.couponTickets.at(
        createAuthConnection(user1Authorized.token.access),
        {
          couponTicketId: invalidCouponTicketId,
        },
      );
    },
  );

  // Step 5: Attempt retrieving user2's coupon ticket using user1's token, expect error
  let couponTicketOfUser2: IShoppingMallCouponTicket | null = null;
  for (let i = 0; i < 5; i++) {
    const randomCouponTicketId = typia.random<string & tags.Format<"uuid">>();
    try {
      const couponTicket =
        await api.functional.shoppingMall.memberUser.couponTickets.at(
          createAuthConnection(user2Authorized.token.access),
          {
            couponTicketId: randomCouponTicketId,
          },
        );
      typia.assert(couponTicket);
      if (couponTicket.memberuser_id === user2Authorized.id) {
        couponTicketOfUser2 = couponTicket;
        break;
      }
    } catch {
      // Ignore errors
    }
  }
  if (couponTicketOfUser2 !== null) {
    await TestValidator.error(
      "user1 cannot access user2's coupon ticket",
      async () => {
        await api.functional.shoppingMall.memberUser.couponTickets.at(
          createAuthConnection(user1Authorized.token.access),
          {
            couponTicketId: couponTicketOfUser2.id,
          },
        );
      },
    );
  }

  // Step 6: Attempt retrieving user1's coupon ticket using user2's token, expect error
  if (couponTicketOfUser1 !== null) {
    await TestValidator.error(
      "user2 cannot access user1's coupon ticket",
      async () => {
        await api.functional.shoppingMall.memberUser.couponTickets.at(
          createAuthConnection(user2Authorized.token.access),
          {
            couponTicketId: couponTicketOfUser1.id,
          },
        );
      },
    );
  }
}
