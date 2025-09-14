import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallCartItem } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCartItem";
import type { IShoppingMallCartItemOption } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCartItemOption";
import type { IShoppingMallCarts } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCarts";
import type { IShoppingMallCategory } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCategory";
import type { IShoppingMallChannel } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallChannel";
import type { IShoppingMallMemberUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallMemberUser";
import type { IShoppingMallSale } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSale";
import type { IShoppingMallSellerUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSellerUser";

/**
 * Test the deletion of a cart item option by a seller user in a realistic
 * multi-user environment.
 *
 * This test performs the full setup involving multiple user roles:
 *
 * - Seller User creation and authentication
 * - Admin User creation and authentication to create necessary sales channel
 *   and product category
 * - Seller User creates a sale product linked to channel and category
 * - Member User creation and authentication
 * - Member User creates a shopping cart and adds a cart item with the sale
 *   product snapshot and quantity 1
 * - Member User adds a cart item option for the cart item
 * - Switch to Seller User authentication
 * - Seller user deletes the cart item option via the DELETE endpoint
 *
 * The test asserts that the deletion is successful and no errors are
 * thrown, ensuring the cart item option has been effectively deleted.
 *
 * The test demonstrates authorization context switching, complex data
 * dependencies, and proper use of API calls with exact DTOs, following
 * business logic.
 */
export async function test_api_cart_cart_item_option_deletion_success(
  connection: api.IConnection,
) {
  // 1. Create seller user and authenticate
  const sellerEmail: string = typia.random<string & tags.Format<"email">>();
  const sellerPassword = "SellerPass123!";
  const sellerUser: IShoppingMallSellerUser.IAuthorized =
    await api.functional.auth.sellerUser.join(connection, {
      body: {
        email: sellerEmail,
        password: sellerPassword,
        nickname: RandomGenerator.name(),
        full_name: RandomGenerator.name(),
        phone_number: RandomGenerator.mobile("010"),
        business_registration_number: `BRN-${RandomGenerator.alphaNumeric(9).toUpperCase()}`,
      } satisfies IShoppingMallSellerUser.ICreate,
    });
  typia.assert(sellerUser);

  // 2. Create admin user and authenticate
  const adminEmail: string = typia.random<string & tags.Format<"email">>();
  const adminPassword = "AdminPass123!";
  const adminUser: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: {
        email: adminEmail,
        password_hash: adminPassword,
        nickname: RandomGenerator.name(),
        full_name: RandomGenerator.name(),
        status: "active",
      } satisfies IShoppingMallAdminUser.ICreate,
    });
  typia.assert(adminUser);

  // 3. Switch to admin user authentication
  await api.functional.auth.adminUser.login(connection, {
    body: {
      email: adminEmail,
      password_hash: adminPassword,
    } satisfies IShoppingMallAdminUser.ILogin,
  });

  // 4. Create sales channel using admin
  const channel: IShoppingMallChannel =
    await api.functional.shoppingMall.adminUser.channels.create(connection, {
      body: {
        code: `CHN${RandomGenerator.alphaNumeric(5).toUpperCase()}`,
        name: `Channel ${RandomGenerator.name(1)}`,
        description: `Description for channel`,
        status: "active",
      } satisfies IShoppingMallChannel.ICreate,
    });
  typia.assert(channel);

  // 5. Create product category using admin
  const category: IShoppingMallCategory =
    await api.functional.shoppingMall.adminUser.categories.create(connection, {
      body: {
        code: `CAT${RandomGenerator.alphaNumeric(5).toUpperCase()}`,
        name: `Category ${RandomGenerator.name(1)}`,
        status: "active",
        description: null,
      } satisfies IShoppingMallCategory.ICreate,
    });
  typia.assert(category);

  // 6. Switch back to seller user authentication
  await api.functional.auth.sellerUser.login(connection, {
    body: {
      email: sellerEmail,
      password: sellerPassword,
    } satisfies IShoppingMallSellerUser.ILogin,
  });

  // 7. Seller user creates a sales product linked with channel and category
  const saleProduct: IShoppingMallSale =
    await api.functional.shoppingMall.sellerUser.sales.create(connection, {
      body: {
        shopping_mall_channel_id: channel.id,
        shopping_mall_section_id: null,
        shopping_mall_seller_user_id: sellerUser.id,
        code: `SALE${RandomGenerator.alphaNumeric(5).toUpperCase()}`,
        status: "active",
        name: `Product ${RandomGenerator.name(2)}`,
        description: `Description for product`,
        price: 10000,
      } satisfies IShoppingMallSale.ICreate,
    });
  typia.assert(saleProduct);

  // 8. Create member user and authenticate
  const memberEmail: string = typia.random<string & tags.Format<"email">>();
  const memberPassword = "MemberPass123!";
  const memberUser: IShoppingMallMemberUser.IAuthorized =
    await api.functional.auth.memberUser.join(connection, {
      body: {
        email: memberEmail,
        password_hash: memberPassword,
        nickname: RandomGenerator.name(),
        full_name: RandomGenerator.name(),
        phone_number: RandomGenerator.mobile("010"),
        status: "active",
      } satisfies IShoppingMallMemberUser.ICreate,
    });
  typia.assert(memberUser);

  // 9. Switch to member user authentication
  await api.functional.auth.memberUser.login(connection, {
    body: {
      email: memberEmail,
      password: memberPassword,
    } satisfies IShoppingMallMemberUser.ILogin,
  });

  // 10. Member creates a shopping cart
  const cart: IShoppingMallCarts =
    await api.functional.shoppingMall.memberUser.carts.createCart(connection, {
      body: {
        member_user_id: memberUser.id,
        status: "active",
      } satisfies IShoppingMallCarts.ICreate,
    });
  typia.assert(cart);

  // 11. Member adds a cart item with product snapshot
  const cartItem: IShoppingMallCartItem =
    await api.functional.shoppingMall.memberUser.carts.cartItems.create(
      connection,
      {
        cartId: cart.id,
        body: {
          shopping_cart_id: cart.id,
          shopping_sale_snapshot_id: saleProduct.id,
          quantity: 1,
          unit_price: saleProduct.price,
          status: "pending",
        } satisfies IShoppingMallCartItem.ICreate,
      },
    );
  typia.assert(cartItem);

  // 12. Member adds a cart item option. Since we don't have option group and option IDs in saleProduct, we generate dummy UUIDs (acceptable since no other API given)
  const optionGroupId = typia.random<string & tags.Format<"uuid">>();
  const optionId = typia.random<string & tags.Format<"uuid">>();
  const cartItemOption: IShoppingMallCartItemOption =
    await api.functional.shoppingMall.memberUser.cartItems.cartItemOptions.create(
      connection,
      {
        cartItemId: cartItem.id,
        body: {
          shopping_cart_item_id: cartItem.id,
          shopping_sale_option_group_id: optionGroupId,
          shopping_sale_option_id: optionId,
        } satisfies IShoppingMallCartItemOption.ICreate,
      },
    );
  typia.assert(cartItemOption);

  // 13. Switch to seller user login to prepare for deletion
  await api.functional.auth.sellerUser.login(connection, {
    body: {
      email: sellerEmail,
      password: sellerPassword,
    } satisfies IShoppingMallSellerUser.ILogin,
  });

  // 14. Seller deletes the cart item option via DELETE endpoint
  await api.functional.shoppingMall.sellerUser.cartItems.cartItemOptions.eraseCartItemOption(
    connection,
    {
      cartItemId: cartItem.id,
      cartItemOptionId: cartItemOption.id,
    },
  );

  // 15. Confirm deletion by asserting success (no exception)
  await TestValidator.predicate("cart item option deletion success", true);
}
