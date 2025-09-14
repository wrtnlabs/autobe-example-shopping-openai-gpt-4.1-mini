import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallGuestUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallGuestUser";

export async function test_api_cart_delete_cart_item_option_guest_user_valid_and_unauthorized(
  connection: api.IConnection,
) {
  // 1. First guest user joins and authenticates
  const guestUser1: IShoppingMallGuestUser.IAuthorized =
    await api.functional.auth.guestUser.join(connection, {
      body: {
        ip_address: "127.0.0.1",
        access_url: "https://guest.example.com/shop",
        referrer: null,
        user_agent: null,
      } satisfies IShoppingMallGuestUser.IJoin,
    });
  typia.assert(guestUser1);

  // Create separate connection for guestUser1 to isolate auth token
  const guestUser1Connection: api.IConnection = {
    ...connection,
    headers: { Authorization: guestUser1.token.access },
  };

  // Setup random UUIDs for cart item and option
  const cartItemId = typia.random<string & tags.Format<"uuid">>();
  const cartItemOptionId = typia.random<string & tags.Format<"uuid">>();

  // 2. Successfully delete the cart item option with authorized user
  await api.functional.shoppingMall.guestUser.cartItems.cartItemOptions.eraseCartItemOption(
    guestUser1Connection,
    {
      cartItemId,
      cartItemOptionId,
    },
  );

  // 3. Attempt to delete the same cart item option again, expect error
  await TestValidator.error(
    "deleting already deleted cart item option should fail",
    async () => {
      await api.functional.shoppingMall.guestUser.cartItems.cartItemOptions.eraseCartItemOption(
        guestUser1Connection,
        {
          cartItemId,
          cartItemOptionId,
        },
      );
    },
  );

  // 4. Second guest user joins and authenticates (different identity)
  const guestUser2: IShoppingMallGuestUser.IAuthorized =
    await api.functional.auth.guestUser.join(connection, {
      body: {
        ip_address: "192.168.1.1",
        access_url: "https://guest.example.com/shop",
        referrer: null,
        user_agent: null,
      } satisfies IShoppingMallGuestUser.IJoin,
    });
  typia.assert(guestUser2);

  // Create separate connection for guestUser2 to isolate auth token
  const guestUser2Connection: api.IConnection = {
    ...connection,
    headers: { Authorization: guestUser2.token.access },
  };

  // 5. Attempt to delete the first user's cart item option as second user, expect permission error
  await TestValidator.error(
    "unauthorized deletion attempt of another guest user's cart item option should fail",
    async () => {
      await api.functional.shoppingMall.guestUser.cartItems.cartItemOptions.eraseCartItemOption(
        guestUser2Connection,
        {
          cartItemId,
          cartItemOptionId,
        },
      );
    },
  );
}
