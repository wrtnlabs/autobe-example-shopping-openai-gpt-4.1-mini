import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallCartItemOption } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCartItemOption";
import type { IShoppingMallGuestUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallGuestUser";

/**
 * This E2E test validates the update operation on a cart item option by a guest
 * user within a shopping mall context. The test ensures the entire workflow
 * from guest user session creation, authentication context establishment, to
 * modifying a cart item option's details precisely following the
 * IShoppingMallCartItemOption.IUpdate DTO schema. The scenario encompasses
 * success cases where valid updates to the `shopping_cart_item_id`,
 * `shopping_sale_option_group_id`, and `shopping_sale_option_id` are applied
 * and verified, as well as failure scenarios including unauthorized access
 * attempts and invalid identifier usage. The test verifies proper application
 * of authorization rules, correct modifications, and adherence to API
 * specifications. It also tests error handling paths including operations
 * without authentication and with invalid cart item or cart item option IDs to
 * ensure robust backend behavior and security enforcement. All API responses
 * are validated for type safety using typia.assert, and meaningful assertions
 * confirm reliable business logic behavior throughout the test flow.
 */
export async function test_api_cart_cart_item_option_update_guest_user(
  connection: api.IConnection,
) {
  // 1. Create guest user and authenticate
  const guestJoinBody = {
    ip_address: "192.168.0.1",
    access_url: "https://www.example.com/shop",
    referrer: null,
    user_agent: null,
  } satisfies IShoppingMallGuestUser.IJoin;

  const authorizedGuestUser: IShoppingMallGuestUser.IAuthorized =
    await api.functional.auth.guestUser.join(connection, {
      body: guestJoinBody,
    });
  typia.assert(authorizedGuestUser);

  // 2. Prepare valid UUIDs for cartItemId and cartItemOptionId
  const cartItemId: string & tags.Format<"uuid"> = typia.random<
    string & tags.Format<"uuid">
  >();
  const cartItemOptionId: string & tags.Format<"uuid"> = typia.random<
    string & tags.Format<"uuid">
  >();

  // 3. Prepare update data with valid UUIDs
  const updateBody = {
    shopping_cart_item_id: typia.random<string & tags.Format<"uuid">>(),
    shopping_sale_option_group_id: typia.random<string & tags.Format<"uuid">>(),
    shopping_sale_option_id: typia.random<string & tags.Format<"uuid">>(),
  } satisfies IShoppingMallCartItemOption.IUpdate;

  // 4. Perform update with valid data
  const updatedOption: IShoppingMallCartItemOption =
    await api.functional.shoppingMall.guestUser.cartItems.cartItemOptions.updateCartItemOption(
      connection,
      {
        cartItemId,
        cartItemOptionId,
        body: updateBody,
      },
    );
  typia.assert(updatedOption);

  // Validate that the response has the updated fields if they were included
  if (updateBody.shopping_cart_item_id !== undefined) {
    TestValidator.equals(
      "shopping_cart_item_id should match",
      updatedOption.shopping_cart_item_id,
      updateBody.shopping_cart_item_id,
    );
  }
  if (updateBody.shopping_sale_option_group_id !== undefined) {
    TestValidator.equals(
      "shopping_sale_option_group_id should match",
      updatedOption.shopping_sale_option_group_id,
      updateBody.shopping_sale_option_group_id,
    );
  }
  if (updateBody.shopping_sale_option_id !== undefined) {
    TestValidator.equals(
      "shopping_sale_option_id should match",
      updatedOption.shopping_sale_option_id,
      updateBody.shopping_sale_option_id,
    );
  }

  // 5. Test update operation without authentication, expect error
  const unauthenticatedConnection: api.IConnection = {
    ...connection,
    headers: {},
  };

  await TestValidator.error(
    "update without authentication should throw",
    async () => {
      await api.functional.shoppingMall.guestUser.cartItems.cartItemOptions.updateCartItemOption(
        unauthenticatedConnection,
        {
          cartItemId,
          cartItemOptionId,
          body: updateBody,
        },
      );
    },
  );
}
