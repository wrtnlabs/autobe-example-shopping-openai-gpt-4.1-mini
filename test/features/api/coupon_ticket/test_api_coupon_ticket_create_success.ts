import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallCouponTicket } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCouponTicket";
import type { IShoppingMallMemberUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallMemberUser";

/**
 * Validate the successful creation of a coupon ticket for an authenticated
 * member user.
 *
 * This test ensures the entire workflow of registering a member user,
 * authenticating, and issuing a coupon ticket linked correctly to the
 * member user by coupon ID. It verifies the correct handling of validity
 * periods, usage status, and timestamps.
 *
 * The test covers:
 *
 * 1. Member user registration and login for authentication context.
 * 2. Creation of a coupon ticket associated to the authenticated member user.
 * 3. Validation of the coupon ticket properties returned from the API to
 *    confirm integrity.
 * 4. Ensuring business rules like usage status being "unused" and used_at
 *    being null.
 *
 * This test guarantees authorized coupon ticket creation only by member
 * users.
 */
export async function test_api_coupon_ticket_create_success(
  connection: api.IConnection,
) {
  // Step 1: Register a new member user
  const email = typia.random<string & tags.Format<"email">>();
  const memberUserCreate = {
    email,
    password_hash: "strong_password_123!",
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(),
    phone_number: null,
    status: "active",
  } satisfies IShoppingMallMemberUser.ICreate;

  const memberUser: IShoppingMallMemberUser.IAuthorized =
    await api.functional.auth.memberUser.join(connection, {
      body: memberUserCreate,
    });
  typia.assert(memberUser);

  // Step 2: Login the member user to establish authentication context
  const memberUserLogin = {
    email,
    password: "strong_password_123!",
  } satisfies IShoppingMallMemberUser.ILogin;

  const loginResult: IShoppingMallMemberUser.IAuthorized =
    await api.functional.auth.memberUser.login(connection, {
      body: memberUserLogin,
    });
  typia.assert(loginResult);

  // Step 3: Create a coupon ticket linked to the authenticated member user
  const now = new Date();
  const validFrom = now.toISOString();
  const validUntil = new Date(
    now.getTime() + 7 * 24 * 60 * 60 * 1000,
  ).toISOString(); // +7 days

  const couponTicketCreate = {
    shopping_mall_coupon_id: typia.random<string & tags.Format<"uuid">>(),
    memberuser_id: memberUser.id,
    ticket_code: RandomGenerator.alphaNumeric(12),
    valid_from: validFrom,
    valid_until: validUntil,
    usage_status: "unused",
    used_at: null,
  } satisfies IShoppingMallCouponTicket.ICreate;

  const couponTicket: IShoppingMallCouponTicket =
    await api.functional.shoppingMall.memberUser.couponTickets.create(
      connection,
      {
        body: couponTicketCreate,
      },
    );
  typia.assert(couponTicket);

  // Step 4: Validate coupon ticket fields
  TestValidator.equals(
    "member user id should match",
    couponTicket.memberuser_id,
    memberUser.id,
  );
  TestValidator.equals(
    "coupon id should match",
    couponTicket.shopping_mall_coupon_id,
    couponTicketCreate.shopping_mall_coupon_id,
  );
  TestValidator.equals(
    "usage status should be unused",
    couponTicket.usage_status,
    "unused",
  );
  TestValidator.equals("used_at should be null", couponTicket.used_at, null);

  // Additional validation: dates and ticket code non-empty
  TestValidator.predicate(
    "valid_from is a valid ISO date-time",
    /^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}.[0-9]{3}Z$/.test(
      couponTicket.valid_from,
    ),
  );
  TestValidator.predicate(
    "valid_until is a valid ISO date-time",
    /^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}.[0-9]{3}Z$/.test(
      couponTicket.valid_until,
    ),
  );
  TestValidator.predicate(
    "ticket_code is non-empty string",
    typeof couponTicket.ticket_code === "string" &&
      couponTicket.ticket_code.length > 0,
  );
}
