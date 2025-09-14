import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallCarts } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCarts";
import type { IShoppingMallMemberUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallMemberUser";

/**
 * This test validates the update operation on a shopping cart by an
 * authenticated member user owner.
 *
 * The test flow includes member user registration and authentication,
 * creation of a shopping cart linked to the member user, updating the
 * cart's status and ownership details, and validating that these updates
 * are applied correctly. The validation also includes asserting the
 * correctness of timestamp fields.
 */
export async function test_api_cart_update_as_owner_success(
  connection: api.IConnection,
) {
  // 1. Register a member user with required fields
  const memberUserCreate = {
    email: typia.random<string & tags.Format<"email">>(),
    password_hash: RandomGenerator.alphaNumeric(16),
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(2),
    phone_number: RandomGenerator.mobile(),
    status: "active",
  } satisfies IShoppingMallMemberUser.ICreate;

  // Authenticate and obtain the authorized member user info including token
  const memberUserAuthorized: IShoppingMallMemberUser.IAuthorized =
    await api.functional.auth.memberUser.join(connection, {
      body: memberUserCreate,
    });
  typia.assert(memberUserAuthorized);

  // 2. Create a shopping cart associated with the newly registered member user
  const cartCreate: IShoppingMallCarts.ICreate = {
    guest_user_id: null,
    member_user_id: memberUserAuthorized.id,
    status: "active",
  };
  const createdCart: IShoppingMallCarts =
    await api.functional.shoppingMall.memberUser.carts.createCart(connection, {
      body: cartCreate,
    });
  typia.assert(createdCart);

  TestValidator.equals(
    "created cart member_user_id matches",
    createdCart.member_user_id,
    memberUserAuthorized.id,
  );
  TestValidator.equals("created cart status", createdCart.status, "active");

  // 3. Update the cart's status with a new value from allowed statuses
  const allowedStatuses = ["active", "abandoned", "expired"] as const;
  const newStatus = RandomGenerator.pick(allowedStatuses);

  const cartUpdate: IShoppingMallCarts.IUpdate = {
    guest_user_id: null,
    member_user_id: memberUserAuthorized.id,
    status: newStatus,
  };

  const updatedCart: IShoppingMallCarts =
    await api.functional.shoppingMall.memberUser.carts.updateCart(connection, {
      cartId: typia.assert<string & tags.Format<"uuid">>(createdCart.id),
      body: cartUpdate,
    });
  typia.assert(updatedCart);

  // 4. Assert the updates were applied correctly
  TestValidator.equals(
    "updated cart ID unchanged",
    updatedCart.id,
    createdCart.id,
  );
  TestValidator.equals(
    "updated cart member_user_id unchanged",
    updatedCart.member_user_id,
    memberUserAuthorized.id,
  );
  TestValidator.equals(
    "updated cart guest_user_id is null",
    updatedCart.guest_user_id,
    null,
  );
  TestValidator.equals(
    "updated cart status updated",
    updatedCart.status,
    newStatus,
  );

  // Validate created_at and updated_at timestamps have proper ISO 8601 UTC format
  TestValidator.predicate(
    "created_at is ISO 8601 UTC string",
    typeof updatedCart.created_at === "string" &&
      /^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9:.]+Z$/.test(updatedCart.created_at),
  );
  TestValidator.predicate(
    "updated_at is ISO 8601 UTC string",
    typeof updatedCart.updated_at === "string" &&
      /^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9:.]+Z$/.test(updatedCart.updated_at),
  );

  // Validate deleted_at is null or undefined
  TestValidator.predicate(
    "deleted_at is null or undefined",
    updatedCart.deleted_at === null || updatedCart.deleted_at === undefined,
  );
}
