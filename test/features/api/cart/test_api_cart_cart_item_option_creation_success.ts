import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IPage } from "@ORGANIZATION/PROJECT-api/lib/structures/IPage";
import type { IPageIShoppingMallSaleOption } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageIShoppingMallSaleOption";
import type { IPageIShoppingMallSaleOptionGroup } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageIShoppingMallSaleOptionGroup";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallCartItem } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCartItem";
import type { IShoppingMallCartItemOption } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCartItemOption";
import type { IShoppingMallCarts } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCarts";
import type { IShoppingMallMemberUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallMemberUser";
import type { IShoppingMallSaleOption } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSaleOption";
import type { IShoppingMallSaleOptionGroup } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSaleOptionGroup";
import type { IShoppingMallSellerUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSellerUser";

/**
 * This test verifies the successful creation of a cart item option.
 *
 * The workflow:
 *
 * 1. Seller user joins and login.
 * 2. Member user joins and login.
 * 3. Member user creates a new cart.
 * 4. Member user adds a cart item referencing some sale snapshot.
 * 5. Seller user logs in and queries sale option groups.
 * 6. Seller user queries sale options.
 * 7. Admin user joins and login.
 * 8. Admin user creates a cart item option referencing the created cart item and
 *    sale option details.
 * 9. Validations and assertions are performed.
 */
export async function test_api_cart_cart_item_option_creation_success(
  connection: api.IConnection,
) {
  // 1. Seller user joins
  const sellerEmail: string = typia.random<string & tags.Format<"email">>();
  const sellerJoin = await api.functional.auth.sellerUser.join(connection, {
    body: {
      email: sellerEmail,
      password: "Password123!",
      nickname: RandomGenerator.name(),
      full_name: RandomGenerator.name(),
      phone_number: RandomGenerator.mobile(),
      business_registration_number: `BRN-${RandomGenerator.alphaNumeric(10)}`,
    } satisfies IShoppingMallSellerUser.ICreate,
  });
  typia.assert(sellerJoin);

  // Seller user login
  const sellerLogin = await api.functional.auth.sellerUser.login(connection, {
    body: {
      email: sellerEmail,
      password: "Password123!",
    } satisfies IShoppingMallSellerUser.ILogin,
  });
  typia.assert(sellerLogin);

  // 2. Member user joins
  const memberEmail: string = typia.random<string & tags.Format<"email">>();
  const memberJoin = await api.functional.auth.memberUser.join(connection, {
    body: {
      email: memberEmail,
      password_hash: "Password123!",
      nickname: RandomGenerator.name(),
      full_name: RandomGenerator.name(),
      phone_number: RandomGenerator.mobile(),
      status: "active",
    } satisfies IShoppingMallMemberUser.ICreate,
  });
  typia.assert(memberJoin);

  // Member user login
  const memberLogin = await api.functional.auth.memberUser.login(connection, {
    body: {
      email: memberEmail,
      password: "Password123!",
    } satisfies IShoppingMallMemberUser.ILogin,
  });
  typia.assert(memberLogin);

  // 3. Create a new cart for member user
  const newCart = await api.functional.shoppingMall.memberUser.carts.createCart(
    connection,
    {
      body: {
        member_user_id: memberJoin.id,
        status: "active",
      } satisfies IShoppingMallCarts.ICreate,
    },
  );
  typia.assert(newCart);

  // 4. Add a new cart item to the cart
  // For sale snapshot id, generate random uuid (in real test, should be valid id)
  const cartItem =
    await api.functional.shoppingMall.memberUser.carts.cartItems.create(
      connection,
      {
        cartId: newCart.id,
        body: {
          shopping_cart_id: newCart.id,
          shopping_sale_snapshot_id: typia.random<
            string & tags.Format<"uuid">
          >(),
          quantity: 1,
          unit_price: 10000,
          status: "pending",
        } satisfies IShoppingMallCartItem.ICreate,
      },
    );
  typia.assert(cartItem);

  // 5. Seller user login again (in case need token refresh or verification)
  const sellerLogin2 = await api.functional.auth.sellerUser.login(connection, {
    body: {
      email: sellerEmail,
      password: "Password123!",
    } satisfies IShoppingMallSellerUser.ILogin,
  });
  typia.assert(sellerLogin2);

  // 6. Search for sale option groups
  const optionGroupPage =
    await api.functional.shoppingMall.sellerUser.saleOptionGroups.index(
      connection,
      {
        body: {
          page: 1,
          limit: 10,
        } satisfies IShoppingMallSaleOptionGroup.IRequest,
      },
    );
  typia.assert(optionGroupPage);
  TestValidator.predicate(
    "optionGroupPage has data",
    optionGroupPage.data.length > 0,
  );

  const firstOptionGroup = optionGroupPage.data[0];

  // 7. Search for sale options
  const optionPage =
    await api.functional.shoppingMall.sellerUser.saleOptions.index(connection, {
      body: {
        page: 1,
        limit: 10,
      } satisfies IShoppingMallSaleOption.IRequest,
    });
  typia.assert(optionPage);
  TestValidator.predicate("optionPage has data", optionPage.data.length > 0);

  const firstOption = optionPage.data[0];

  // 8. Admin user join
  const adminEmail: string = typia.random<string & tags.Format<"email">>();
  const adminJoin = await api.functional.auth.adminUser.join(connection, {
    body: {
      email: adminEmail,
      password_hash: "AdminPass123!",
      nickname: RandomGenerator.name(),
      full_name: RandomGenerator.name(),
      status: "active",
    } satisfies IShoppingMallAdminUser.ICreate,
  });
  typia.assert(adminJoin);

  // Admin user login
  const adminLogin = await api.functional.auth.adminUser.login(connection, {
    body: {
      email: adminEmail,
      password_hash: "AdminPass123!",
    } satisfies IShoppingMallAdminUser.ILogin,
  });
  typia.assert(adminLogin);

  // 9. Create cart item option referencing cart item
  const cartItemOption =
    await api.functional.shoppingMall.adminUser.cartItems.cartItemOptions.create(
      connection,
      {
        cartItemId: cartItem.id,
        body: {
          shopping_cart_item_id: cartItem.id,
          shopping_sale_option_group_id: firstOptionGroup.id,
          shopping_sale_option_id: firstOption.id,
        } satisfies IShoppingMallCartItemOption.ICreate,
      },
    );
  typia.assert(cartItemOption);

  TestValidator.equals(
    "cartItemOption references cartItem",
    cartItemOption.shopping_cart_item_id,
    cartItem.id,
  );
  TestValidator.equals(
    "cartItemOption references option group",
    cartItemOption.shopping_sale_option_group_id,
    firstOptionGroup.id,
  );
  TestValidator.equals(
    "cartItemOption references option",
    cartItemOption.shopping_sale_option_id,
    firstOption.id,
  );
}
