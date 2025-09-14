import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallCarts } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCarts";
import type { IShoppingMallMemberUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallMemberUser";

/**
 * Test scenario for retrieving detailed shopping cart information for an
 * authenticated member user.
 *
 * This test performs the following steps:
 *
 * 1. Authenticate a member user by invoking the join API for member users.
 * 2. Generate a valid UUID to simulate a cartId.
 * 3. Retrieve detailed shopping cart information using the getCart API with
 *    the generated cartId.
 * 4. Validate that all required fields exist in the returned cart data and
 *    have valid formats.
 * 5. Verify that the cart belongs to the authenticated member user by matching
 *    member_user_id.
 *
 * The test asserts correctness of data format, ownership, and
 * authentication context, ensuring the end-to-end functionality works as
 * expected.
 */
export async function test_api_cart_detail_success(
  connection: api.IConnection,
) {
  // 1. Member user registration and authentication
  const memberUser: IShoppingMallMemberUser.IAuthorized =
    await api.functional.auth.memberUser.join(connection, {
      body: {
        email: RandomGenerator.alphaNumeric(8) + "@example.com",
        password_hash: RandomGenerator.alphaNumeric(16),
        nickname: RandomGenerator.name(),
        full_name: RandomGenerator.name(2),
        phone_number: null,
        status: "active",
      } satisfies IShoppingMallMemberUser.ICreate,
    });
  typia.assert(memberUser);

  // 2. Simulate a valid shopping cart ID (UUID format)
  const cartId: string & tags.Format<"uuid"> = typia.random<
    string & tags.Format<"uuid">
  >();

  // 3. Retrieve detailed shopping cart data by cartId
  const cart: IShoppingMallCarts =
    await api.functional.shoppingMall.memberUser.carts.getCart(connection, {
      cartId: cartId,
    });
  typia.assert(cart);

  // 4. Validate required fields and data integrity
  TestValidator.predicate(
    "cart id is non-empty string",
    typeof cart.id === "string" && cart.id.length > 0,
  );

  TestValidator.equals(
    "cart member_user_id matches memberUser id",
    cart.member_user_id,
    memberUser.id,
  );
  TestValidator.predicate(
    "cart guest_user_id is null or string",
    cart.guest_user_id === null || typeof cart.guest_user_id === "string",
  );

  TestValidator.predicate(
    "cart status is non-empty string",
    typeof cart.status === "string" && cart.status.length > 0,
  );

  TestValidator.predicate(
    "cart created_at is valid date-time string",
    typeof cart.created_at === "string" &&
      !Number.isNaN(Date.parse(cart.created_at)),
  );
  TestValidator.predicate(
    "cart updated_at is valid date-time string",
    typeof cart.updated_at === "string" &&
      !Number.isNaN(Date.parse(cart.updated_at)),
  );

  TestValidator.predicate(
    "cart deleted_at is null or valid date-time string",
    cart.deleted_at === null ||
      (typeof cart.deleted_at === "string" &&
        !Number.isNaN(Date.parse(cart.deleted_at))),
  );
}
