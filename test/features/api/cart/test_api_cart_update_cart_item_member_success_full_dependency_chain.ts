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
 * This test validates the entire workflow of updating a cart item by a member
 * user, covering the full dependency chain including user
 * creation/authentication for memberUser, sellerUser, and adminUser, product
 * category and sales channel creation by admin, sale product creation by
 * seller, cart creation by member, cart item creation by member, and finally
 * updating the cart item by the member.
 *
 * The test covers role switching authentications, ID dependency handling
 * between entities, and business logic validation ensuring that the update
 * reflects correctly in the cart item.
 */
export async function test_api_cart_update_cart_item_member_success_full_dependency_chain(
  connection: api.IConnection,
) {
  // 1. Create and authenticate member user
  const memberUserEmail: string = typia.random<string & tags.Format<"email">>();
  const memberUserPassword = "TestPassword1234!";
  const memberUserCreate = {
    email: memberUserEmail,
    password_hash: memberUserPassword,
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(),
    phone_number: RandomGenerator.mobile(),
    status: "active",
  } satisfies IShoppingMallMemberUser.ICreate;
  const memberUser: IShoppingMallMemberUser.IAuthorized =
    await api.functional.auth.memberUser.join(connection, {
      body: memberUserCreate,
    });
  typia.assert(memberUser);
  await api.functional.auth.memberUser.login(connection, {
    body: {
      email: memberUserEmail,
      password: memberUserPassword,
    } satisfies IShoppingMallMemberUser.ILogin,
  });

  // 2. Create and authenticate seller user
  const sellerUserEmail: string = typia.random<string & tags.Format<"email">>();
  const sellerUserPassword = "SellerPass1234!";
  const sellerUserCreate = {
    email: sellerUserEmail,
    password: sellerUserPassword,
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(),
    phone_number: RandomGenerator.mobile(),
    business_registration_number: `BRN${RandomGenerator.alphaNumeric(9)}`,
  } satisfies IShoppingMallSellerUser.ICreate;
  const sellerUser: IShoppingMallSellerUser.IAuthorized =
    await api.functional.auth.sellerUser.join(connection, {
      body: sellerUserCreate,
    });
  typia.assert(sellerUser);
  await api.functional.auth.sellerUser.login(connection, {
    body: {
      email: sellerUserEmail,
      password: sellerUserPassword,
    } satisfies IShoppingMallSellerUser.ILogin,
  });

  // 3. Create and authenticate admin user
  const adminUserEmail: string = typia.random<string & tags.Format<"email">>();
  const adminUserPassword = "AdminPass1234!";
  const adminUserCreate = {
    email: adminUserEmail,
    password_hash: adminUserPassword,
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(),
    status: "active",
  } satisfies IShoppingMallAdminUser.ICreate;
  const adminUser: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: adminUserCreate,
    });
  typia.assert(adminUser);
  await api.functional.auth.adminUser.login(connection, {
    body: {
      email: adminUserEmail,
      password_hash: adminUserPassword,
    } satisfies IShoppingMallAdminUser.ILogin,
  });

  // 4. Admin creates product category
  const categoryCreate = {
    code: RandomGenerator.alphaNumeric(8),
    name: RandomGenerator.name(),
    status: "active",
    description: RandomGenerator.paragraph({ sentences: 3 }),
  } satisfies IShoppingMallCategory.ICreate;
  const category: IShoppingMallCategory =
    await api.functional.shoppingMall.adminUser.categories.create(connection, {
      body: categoryCreate,
    });
  typia.assert(category);

  // 5. Admin creates sales channel
  const channelCreate = {
    code: RandomGenerator.alphaNumeric(6),
    name: RandomGenerator.name(),
    status: "active",
    description: RandomGenerator.paragraph({ sentences: 4 }),
  } satisfies IShoppingMallChannel.ICreate;
  const channel: IShoppingMallChannel =
    await api.functional.shoppingMall.adminUser.channels.create(connection, {
      body: channelCreate,
    });
  typia.assert(channel);

  // 6. Switch to seller user for sale creation
  await api.functional.auth.sellerUser.login(connection, {
    body: {
      email: sellerUserEmail,
      password: sellerUserPassword,
    } satisfies IShoppingMallSellerUser.ILogin,
  });

  // 7. Seller creates sale product
  const saleCreate = {
    shopping_mall_channel_id: channel.id,
    shopping_mall_section_id: null,
    shopping_mall_seller_user_id: sellerUser.id,
    code: RandomGenerator.alphaNumeric(10),
    status: "active",
    name: RandomGenerator.name(3),
    description: RandomGenerator.content({ paragraphs: 1 }),
    price: 10000,
  } satisfies IShoppingMallSale.ICreate;
  const sale: IShoppingMallSale =
    await api.functional.shoppingMall.sellerUser.sales.create(connection, {
      body: saleCreate,
    });
  typia.assert(sale);

  // 8. Switch back to member user for cart creation
  await api.functional.auth.memberUser.login(connection, {
    body: {
      email: memberUserEmail,
      password: memberUserPassword,
    } satisfies IShoppingMallMemberUser.ILogin,
  });

  // 9. Create cart by member user
  const cartCreate = {
    guest_user_id: null,
    member_user_id: memberUser.id,
    status: "active",
  } satisfies IShoppingMallCarts.ICreate;
  const cart: IShoppingMallCarts =
    await api.functional.shoppingMall.memberUser.carts.createCart(connection, {
      body: cartCreate,
    });
  typia.assert(cart);

  // 10. Add initial cart item
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
      {
        cartId: cart.id,
        body: cartItemCreate,
      },
    );
  typia.assert(cartItem);

  // 11. Update the cart item - modify quantity and unit price
  const cartItemUpdateBody = {
    quantity: 5,
    unit_price: 9000, // discounted price
    status: "pending",
  } satisfies IShoppingMallCartItem.IUpdate;
  const updatedCartItem: IShoppingMallCartItem =
    await api.functional.shoppingMall.memberUser.carts.cartItems.update(
      connection,
      {
        cartId: cart.id,
        cartItemId: cartItem.id,
        body: cartItemUpdateBody,
      },
    );
  typia.assert(updatedCartItem);

  // 12. Validate updated cart item values
  TestValidator.equals(
    "updated cart item quantity",
    updatedCartItem.quantity,
    5,
  );
  TestValidator.equals(
    "updated cart item unit price",
    updatedCartItem.unit_price,
    9000,
  );
  TestValidator.equals(
    "updated cart item id unchanged",
    updatedCartItem.id,
    cartItem.id,
  );
  TestValidator.equals(
    "updated cart item cart id unchanged",
    updatedCartItem.shopping_cart_id,
    cart.id,
  );
  TestValidator.equals(
    "updated cart item status unchanged",
    updatedCartItem.status,
    "pending",
  );
}
