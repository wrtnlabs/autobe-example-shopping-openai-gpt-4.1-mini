import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallCartItem } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCartItem";
import type { IShoppingMallCarts } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCarts";
import type { IShoppingMallCategory } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCategory";
import type { IShoppingMallChannel } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallChannel";
import type { IShoppingMallMemberUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallMemberUser";
import type { IShoppingMallSale } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSale";
import type { IShoppingMallSellerUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSellerUser";

/**
 * This end-to-end test case verifies the complete, successful creation of a
 * shopping cart item by a member user with a full dependency chain. It covers
 * the entire realistic business workflow starting from creating authentication
 * contexts for member, seller, and admin users through join and login
 * operations. Then it creates a product category and sales channel by the admin
 * user, followed by product sale creation by the seller user. Next, the member
 * user creates a shopping cart. Finally, the member user adds a cart item to
 * the created cart, linking it to the shopping mall sale product snapshot. The
 * test checks the validity and consistency of all created IDs for successful
 * API interactions and ensures proper switching between different
 * authentication contexts corresponding to each user role. All API responses
 * are validated with typia.assert() to guarantee type conformity. All required
 * properties are provided with realistic, descriptive values following property
 * documentation and format constraints. This workflow confirms that
 * authorization roles, product setup, and cart item creation properly function
 * in the integrated system environment.
 */
export async function test_api_cart_create_cart_item_member_success_full_dependency_chain(
  connection: api.IConnection,
) {
  // 1. Create member user and authenticate
  const memberEmail = typia.random<string & tags.Format<"email">>();
  const memberPassword = "1q2w3e4r";
  const memberUser: IShoppingMallMemberUser.IAuthorized =
    await api.functional.auth.memberUser.join(connection, {
      body: {
        email: memberEmail,
        password_hash: memberPassword,
        nickname: RandomGenerator.name(),
        full_name: RandomGenerator.name(2),
        phone_number: RandomGenerator.mobile(),
        status: "active",
      } satisfies IShoppingMallMemberUser.ICreate,
    });
  typia.assert(memberUser);

  // 2. Create seller user and authenticate
  const sellerEmail = typia.random<string & tags.Format<"email">>();
  const sellerPassword = "1q2w3e4r";
  const businessNumber = `${RandomGenerator.alphaNumeric(3).toUpperCase()}-${RandomGenerator.alphaNumeric(6)}`;
  const sellerUser: IShoppingMallSellerUser.IAuthorized =
    await api.functional.auth.sellerUser.join(connection, {
      body: {
        email: sellerEmail,
        password: sellerPassword,
        nickname: RandomGenerator.name(),
        full_name: RandomGenerator.name(2),
        phone_number: RandomGenerator.mobile(),
        business_registration_number: businessNumber,
      } satisfies IShoppingMallSellerUser.ICreate,
    });
  typia.assert(sellerUser);

  // 3. Create admin user and authenticate
  const adminEmail = typia.random<string & tags.Format<"email">>();
  const adminPassword = "1q2w3e4r";
  const adminUser: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: {
        email: adminEmail,
        password_hash: adminPassword,
        nickname: RandomGenerator.name(),
        full_name: RandomGenerator.name(2),
        status: "active",
      } satisfies IShoppingMallAdminUser.ICreate,
    });
  typia.assert(adminUser);

  // 4. Login as admin user for category and channel creation
  await api.functional.auth.adminUser.login(connection, {
    body: {
      email: adminEmail,
      password_hash: adminPassword,
    } satisfies IShoppingMallAdminUser.ILogin,
  });

  // 5. Create product category
  const categoryCode = RandomGenerator.alphaNumeric(10).toLowerCase();
  const categoryName = `Category ${RandomGenerator.name()}`;
  const category: IShoppingMallCategory =
    await api.functional.shoppingMall.adminUser.categories.create(connection, {
      body: {
        code: categoryCode,
        name: categoryName,
        status: "active",
        description: `Description for ${categoryName}`,
      } satisfies IShoppingMallCategory.ICreate,
    });
  typia.assert(category);

  // 6. Create sales channel
  const channelCode = RandomGenerator.alphaNumeric(8).toLowerCase();
  const channelName = `Channel ${RandomGenerator.name()}`;
  const channel: IShoppingMallChannel =
    await api.functional.shoppingMall.adminUser.channels.create(connection, {
      body: {
        code: channelCode,
        name: channelName,
        status: "active",
        description: `Description for ${channelName}`,
      } satisfies IShoppingMallChannel.ICreate,
    });
  typia.assert(channel);

  // 7. Login as seller user for product sale creation
  await api.functional.auth.sellerUser.login(connection, {
    body: {
      email: sellerEmail,
      password: sellerPassword,
    } satisfies IShoppingMallSellerUser.ILogin,
  });

  // 8. Create shopping mall sale product
  const saleCode = RandomGenerator.alphaNumeric(12).toUpperCase();
  const saleName = `Product ${RandomGenerator.name(2)}`;
  const price = Math.floor(Math.random() * 100000) + 1000; // Price between 1000 - 101000
  const sale: IShoppingMallSale =
    await api.functional.shoppingMall.sellerUser.sales.create(connection, {
      body: {
        shopping_mall_channel_id: channel.id,
        shopping_mall_section_id: null,
        shopping_mall_seller_user_id: sellerUser.id,
        code: saleCode,
        status: "active",
        name: saleName,
        description: `Description for ${saleName}`,
        price: price,
      } satisfies IShoppingMallSale.ICreate,
    });
  typia.assert(sale);

  // 9. Login as member user to create cart and cart item
  await api.functional.auth.memberUser.login(connection, {
    body: {
      email: memberEmail,
      password: memberPassword,
    } satisfies IShoppingMallMemberUser.ILogin,
  });

  // 10. Create shopping cart associated with member user
  const cartStatus = "active";
  const cart: IShoppingMallCarts =
    await api.functional.shoppingMall.memberUser.carts.createCart(connection, {
      body: {
        guest_user_id: null,
        member_user_id: memberUser.id,
        status: cartStatus,
      } satisfies IShoppingMallCarts.ICreate,
    });
  typia.assert(cart);

  // 11. Add cart item to the created cart
  const cartItemStatus = "pending";
  const quantity = RandomGenerator.pick([1, 2, 3, 4, 5]);
  const unitPrice = sale.price;
  const cartItem: IShoppingMallCartItem =
    await api.functional.shoppingMall.memberUser.carts.cartItems.create(
      connection,
      {
        cartId: cart.id,
        body: {
          shopping_cart_id: cart.id,
          shopping_sale_snapshot_id: sale.id,
          quantity: quantity,
          unit_price: unitPrice,
          status: cartItemStatus,
          deleted_at: null,
        } satisfies IShoppingMallCartItem.ICreate,
      },
    );
  typia.assert(cartItem);

  // 12. Verify that cartItem's shopping_cart_id and shopping_sale_snapshot_id match expected IDs
  TestValidator.equals(
    "cart item cart ID matches cart",
    cartItem.shopping_cart_id,
    cart.id,
  );
  TestValidator.equals(
    "cart item sale snapshot ID matches sale",
    cartItem.shopping_sale_snapshot_id,
    sale.id,
  );
  TestValidator.predicate(
    "cart item quantity is positive",
    cartItem.quantity > 0,
  );
  TestValidator.equals(
    "cart item unit price matches sale price",
    cartItem.unit_price,
    sale.price,
  );
  TestValidator.equals(
    "cart item status is correct",
    cartItem.status,
    cartItemStatus,
  );
}
