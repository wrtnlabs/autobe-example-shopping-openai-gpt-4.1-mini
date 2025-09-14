import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallCartItem } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCartItem";
import type { IShoppingMallCartItemOption } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCartItemOption";
import type { IShoppingMallCarts } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCarts";
import type { IShoppingMallMemberUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallMemberUser";
import type { IShoppingMallSale } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSale";
import type { IShoppingMallSaleOption } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSaleOption";
import type { IShoppingMallSaleOptionGroup } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSaleOptionGroup";
import type { IShoppingMallSaleUnit } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSaleUnit";
import type { IShoppingMallSaleUnitOption } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSaleUnitOption";
import type { IShoppingMallSellerUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSellerUser";

export async function test_api_cart_soft_delete_cart_item_option_success(
  connection: api.IConnection,
) {
  // 1. Create member user and authenticate
  const memberUserEmail = typia.random<string & tags.Format<"email">>();
  const memberUser: IShoppingMallMemberUser.IAuthorized =
    await api.functional.auth.memberUser.join(connection, {
      body: {
        email: memberUserEmail,
        password_hash: "strong-password",
        nickname: RandomGenerator.name(),
        full_name: RandomGenerator.name(),
        phone_number: RandomGenerator.mobile(),
        status: "active",
      } satisfies IShoppingMallMemberUser.ICreate,
    });
  typia.assert(memberUser);

  // 2. Create admin user and authenticate
  const adminUserEmail = typia.random<string & tags.Format<"email">>();
  const adminUser: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: {
        email: adminUserEmail,
        password_hash: "strong-password",
        nickname: RandomGenerator.name(),
        full_name: RandomGenerator.name(),
        status: "active",
      } satisfies IShoppingMallAdminUser.ICreate,
    });
  typia.assert(adminUser);

  // 3. Admin creates sale option group
  const saleOptionGroup: IShoppingMallSaleOptionGroup =
    await api.functional.shoppingMall.adminUser.saleOptionGroups.create(
      connection,
      {
        body: {
          code: RandomGenerator.alphaNumeric(8),
          name: RandomGenerator.name(),
        } satisfies IShoppingMallSaleOptionGroup.ICreate,
      },
    );
  typia.assert(saleOptionGroup);

  // 4. Admin creates sale option under the group
  const saleOption: IShoppingMallSaleOption =
    await api.functional.shoppingMall.adminUser.saleOptions.create(connection, {
      body: {
        shopping_mall_sale_option_group_id: saleOptionGroup.id,
        code: RandomGenerator.alphaNumeric(8),
        name: RandomGenerator.name(),
        type: "selection",
      } satisfies IShoppingMallSaleOption.ICreate,
    });
  typia.assert(saleOption);

  // 5. Create seller user and authenticate
  const sellerUserEmail = typia.random<string & tags.Format<"email">>();
  const sellerUser: IShoppingMallSellerUser.IAuthorized =
    await api.functional.auth.sellerUser.join(connection, {
      body: {
        email: sellerUserEmail,
        password: "strong-password",
        nickname: RandomGenerator.name(),
        full_name: RandomGenerator.name(),
        phone_number: RandomGenerator.mobile(),
        business_registration_number: RandomGenerator.alphaNumeric(10),
      } satisfies IShoppingMallSellerUser.ICreate,
    });
  typia.assert(sellerUser);

  // 6. Seller creates a sale product
  const sale: IShoppingMallSale =
    await api.functional.shoppingMall.sellerUser.sales.create(connection, {
      body: {
        shopping_mall_channel_id: typia.random<string & tags.Format<"uuid">>(),
        shopping_mall_section_id: null,
        shopping_mall_seller_user_id: sellerUser.id,
        code: RandomGenerator.alphaNumeric(8),
        status: "active",
        name: RandomGenerator.name(),
        description: RandomGenerator.content({ paragraphs: 1 }),
        price: 10000,
      } satisfies IShoppingMallSale.ICreate,
    });
  typia.assert(sale);

  // 7. Seller creates sale unit for the product
  const saleUnit: IShoppingMallSaleUnit =
    await api.functional.shoppingMall.sellerUser.sales.saleUnits.create(
      connection,
      {
        saleId: sale.id,
        body: {
          shopping_mall_sale_id: sale.id,
          code: RandomGenerator.alphaNumeric(6),
          name: RandomGenerator.name(1),
          description: null,
        } satisfies IShoppingMallSaleUnit.ICreate,
      },
    );
  typia.assert(saleUnit);

  // 8. Seller creates a sale unit option
  const saleUnitOption: IShoppingMallSaleUnitOption =
    await api.functional.shoppingMall.sellerUser.sales.saleUnits.saleUnitOptions.create(
      connection,
      {
        saleId: sale.id,
        saleUnitId: saleUnit.id,
        body: {
          shopping_mall_sale_unit_id: saleUnit.id,
          shopping_mall_sale_option_id: saleOption.id,
          additional_price: 3000,
          stock_quantity: 100,
        } satisfies IShoppingMallSaleUnitOption.ICreate,
      },
    );
  typia.assert(saleUnitOption);

  // 9. Member user creates a cart
  await api.functional.auth.memberUser.login(connection, {
    body: {
      email: memberUserEmail,
      password: "strong-password",
    } satisfies IShoppingMallMemberUser.ILogin,
  });

  const cart: IShoppingMallCarts =
    await api.functional.shoppingMall.memberUser.carts.createCart(connection, {
      body: {
        member_user_id: memberUser.id,
        status: "active",
      } satisfies IShoppingMallCarts.ICreate,
    });
  typia.assert(cart);

  // 10. Member user adds a cart item linked to sale snapshot
  const cartItem: IShoppingMallCartItem =
    await api.functional.shoppingMall.memberUser.carts.cartItems.create(
      connection,
      {
        cartId: cart.id,
        body: {
          shopping_cart_id: cart.id,
          shopping_sale_snapshot_id: typia.random<
            string & tags.Format<"uuid">
          >(),
          quantity: 1,
          unit_price: sale.price,
          status: "pending",
        } satisfies IShoppingMallCartItem.ICreate,
      },
    );
  typia.assert(cartItem);

  // 11. Member user creates a cart item option to be soft deleted
  const cartItemOption: IShoppingMallCartItemOption =
    await api.functional.shoppingMall.memberUser.cartItems.cartItemOptions.create(
      connection,
      {
        cartItemId: cartItem.id,
        body: {
          shopping_cart_item_id: cartItem.id,
          shopping_sale_option_group_id: saleOptionGroup.id,
          shopping_sale_option_id: saleOption.id,
        } satisfies IShoppingMallCartItemOption.ICreate,
      },
    );
  typia.assert(cartItemOption);

  // 12. Member user soft deletes the cart item option
  await api.functional.shoppingMall.memberUser.cartItems.cartItemOptions.eraseCartItemOption(
    connection,
    {
      cartItemId: cartItem.id,
      cartItemOptionId: cartItemOption.id,
    },
  );
}
