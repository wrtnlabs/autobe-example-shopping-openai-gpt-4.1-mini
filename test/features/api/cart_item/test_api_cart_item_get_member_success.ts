import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallCartItem } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCartItem";
import type { IShoppingMallCarts } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCarts";
import type { IShoppingMallChannel } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallChannel";
import type { IShoppingMallMemberUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallMemberUser";
import type { IShoppingMallSale } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSale";
import type { IShoppingMallSellerUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSellerUser";

/**
 * Test the successful retrieval of a specific cart item by a member user.
 *
 * This test verifies the end-to-end flow of multi-role interactions
 * including:
 *
 * - Member user registration and login
 * - Admin user registration and login for sales channel creation
 * - Seller user registration and login to create a product sale
 * - Member user cart creation and adding a cart item referencing the sale
 * - Successful retrieval of the cart item by cartId and cartItemId
 * - Validation of data integrity and correct authorization
 * - Negative tests for invalid IDs and unauthorized access
 *
 * The test ensures realistic data creation with proper type safety and
 * usage of valid identifiers, adhering strictly to DTO schemas and API
 * contracts.
 */
export async function test_api_cart_item_get_member_success(
  connection: api.IConnection,
) {
  // 1. Member user joins
  const memberCreate = {
    email: typia.random<string & tags.Format<"email">>(),
    password_hash: "Test1234$",
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(),
    phone_number: RandomGenerator.mobile(),
    status: "active",
  } satisfies IShoppingMallMemberUser.ICreate;
  const member: IShoppingMallMemberUser.IAuthorized =
    await api.functional.auth.memberUser.join(connection, {
      body: memberCreate,
    });
  typia.assert(member);

  // Member login
  const memberLogin = {
    email: member.email as string & tags.Format<"email">,
    password: "Test1234$",
  } satisfies IShoppingMallMemberUser.ILogin;
  const memberLoggedIn: IShoppingMallMemberUser.IAuthorized =
    await api.functional.auth.memberUser.login(connection, {
      body: memberLogin,
    });
  typia.assert(memberLoggedIn);

  // 2. Admin user joins
  const adminCreate = {
    email: typia.random<string & tags.Format<"email">>(),
    password_hash: "AdminPass123$",
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(),
    status: "active",
  } satisfies IShoppingMallAdminUser.ICreate;
  const admin: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, { body: adminCreate });
  typia.assert(admin);

  // Admin login
  const adminLogin = {
    email: admin.email,
    password_hash: "AdminPass123$",
  } satisfies IShoppingMallAdminUser.ILogin;
  const adminLoggedIn: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.login(connection, { body: adminLogin });
  typia.assert(adminLoggedIn);

  // 3. Admin creates a sales channel
  const channelCreate = {
    code: RandomGenerator.alphaNumeric(5).toUpperCase(),
    name: RandomGenerator.name(),
    description: RandomGenerator.content({ paragraphs: 1 }),
    status: "active",
  } satisfies IShoppingMallChannel.ICreate;
  const channel: IShoppingMallChannel =
    await api.functional.shoppingMall.adminUser.channels.create(connection, {
      body: channelCreate,
    });
  typia.assert(channel);

  // 4. Seller user joins
  const sellerCreate = {
    email: typia.random<string & tags.Format<"email">>(),
    password: "SellerPass123$",
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(),
    phone_number: RandomGenerator.mobile(),
    business_registration_number:
      RandomGenerator.alphaNumeric(10).toUpperCase(),
  } satisfies IShoppingMallSellerUser.ICreate;
  const seller: IShoppingMallSellerUser.IAuthorized =
    await api.functional.auth.sellerUser.join(connection, {
      body: sellerCreate,
    });
  typia.assert(seller);

  // Seller login
  const sellerLogin = {
    email: seller.email,
    password: "SellerPass123$",
  } satisfies IShoppingMallSellerUser.ILogin;
  const sellerLoggedIn: IShoppingMallSellerUser.IAuthorized =
    await api.functional.auth.sellerUser.login(connection, {
      body: sellerLogin,
    });
  typia.assert(sellerLoggedIn);

  // 5. Seller creates a sale linked to channel
  const saleCreate = {
    shopping_mall_channel_id: channel.id,
    shopping_mall_section_id: null,
    shopping_mall_seller_user_id: seller.id,
    code: RandomGenerator.alphaNumeric(6).toUpperCase(),
    status: "active",
    name: RandomGenerator.name(),
    description: RandomGenerator.content({ paragraphs: 1 }),
    price: 10000,
  } satisfies IShoppingMallSale.ICreate;
  const sale: IShoppingMallSale =
    await api.functional.shoppingMall.sellerUser.sales.create(connection, {
      body: saleCreate,
    });
  typia.assert(sale);

  // Switch to member user (re-login to refresh auth context)
  const memberLogin2 = {
    email: member.email,
    password: "Test1234$",
  } satisfies IShoppingMallMemberUser.ILogin;
  const memberReLoggedIn: IShoppingMallMemberUser.IAuthorized =
    await api.functional.auth.memberUser.login(connection, {
      body: memberLogin2,
    });
  typia.assert(memberReLoggedIn);

  // 6. Member creates a cart
  const cartCreate = {
    member_user_id: member.id,
    status: "active",
  } satisfies IShoppingMallCarts.ICreate;
  const cart: IShoppingMallCarts =
    await api.functional.shoppingMall.memberUser.carts.createCart(connection, {
      body: cartCreate,
    });
  typia.assert(cart);

  // 7. Member adds a cart item linked to sale snapshot
  // Note: shopping_sale_snapshot_id is assumed to be the sale.id because details about snapshots are unavailable
  const cartItemCreate = {
    shopping_cart_id: cart.id,
    shopping_sale_snapshot_id: sale.id,
    quantity: 2,
    unit_price: sale.price,
    status: "pending",
  } satisfies IShoppingMallCartItem.ICreate;
  const cartItem: IShoppingMallCartItem =
    await api.functional.shoppingMall.memberUser.carts.cartItems.create(
      connection,
      { cartId: cart.id, body: cartItemCreate },
    );
  typia.assert(cartItem);

  // 8. Retrieve the cart item with cartId and cartItemId
  const retrieved: IShoppingMallCartItem =
    await api.functional.shoppingMall.memberUser.carts.cartItems.at(
      connection,
      { cartId: cart.id, cartItemId: cartItem.id },
    );
  typia.assert(retrieved);

  // 9. Validate retrieved cart item matches created cart item
  TestValidator.equals("cartItem id matches", retrieved.id, cartItem.id);
  TestValidator.equals(
    "cartItem cart id matches",
    retrieved.shopping_cart_id,
    cart.id,
  );
  TestValidator.equals(
    "cartItem sale snapshot id matches",
    retrieved.shopping_sale_snapshot_id,
    sale.id,
  );
  TestValidator.equals(
    "cartItem quantity matches",
    retrieved.quantity,
    cartItemCreate.quantity,
  );
  TestValidator.equals(
    "cartItem unit price matches",
    retrieved.unit_price,
    cartItemCreate.unit_price,
  );
  TestValidator.equals(
    "cartItem status matches",
    retrieved.status,
    cartItemCreate.status,
  );

  // 10. Failure test: retrieving with invalid cartId and cartItemId
  await TestValidator.error(
    "invalid cartId retrieval should fail",
    async () => {
      await api.functional.shoppingMall.memberUser.carts.cartItems.at(
        connection,
        {
          cartId: typia.random<string & tags.Format<"uuid">>(),
          cartItemId: cartItem.id,
        },
      );
    },
  );
  await TestValidator.error(
    "invalid cartItemId retrieval should fail",
    async () => {
      await api.functional.shoppingMall.memberUser.carts.cartItems.at(
        connection,
        {
          cartId: cart.id,
          cartItemId: typia.random<string & tags.Format<"uuid">>(),
        },
      );
    },
  );

  // 11. Failure test: unauthorized access attempt
  // Create another member user to test unauthorized access
  const otherMemberCreate = {
    email: typia.random<string & tags.Format<"email">>(),
    password_hash: "OtherPass123$",
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(),
    phone_number: RandomGenerator.mobile(),
    status: "active",
  } satisfies IShoppingMallMemberUser.ICreate;
  const otherMember: IShoppingMallMemberUser.IAuthorized =
    await api.functional.auth.memberUser.join(connection, {
      body: otherMemberCreate,
    });
  typia.assert(otherMember);

  // Other member login
  const otherMemberLogin = {
    email: otherMember.email as string & tags.Format<"email">,
    password: "OtherPass123$",
  } satisfies IShoppingMallMemberUser.ILogin;
  const otherMemberLoggedIn: IShoppingMallMemberUser.IAuthorized =
    await api.functional.auth.memberUser.login(connection, {
      body: otherMemberLogin,
    });
  typia.assert(otherMemberLoggedIn);

  // Test unauthorized retrieval of cart item with other member credentials
  await TestValidator.error(
    "unauthorized access to cart item should fail",
    async () => {
      await api.functional.shoppingMall.memberUser.carts.cartItems.at(
        connection,
        { cartId: cart.id, cartItemId: cartItem.id },
      );
    },
  );
}
