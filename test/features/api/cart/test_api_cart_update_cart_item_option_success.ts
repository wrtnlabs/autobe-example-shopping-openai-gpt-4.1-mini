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

/**
 * This test validates the update of a cart item option by a member user.
 *
 * The scenario involves multiple steps:
 *
 * 1. Register and authenticate a member user.
 * 2. Register and authenticate an admin user.
 * 3. Admin creates a sale option group.
 * 4. Admin creates a sale option under that group.
 * 5. Register and authenticate a seller user.
 * 6. Seller creates a sale product.
 * 7. Seller creates a sale unit for the product.
 * 8. Seller creates a sale unit option with the admin-created option group and
 *    option.
 * 9. Member user creates a cart.
 * 10. Member user adds a cart item linked to the created sale product snapshot.
 * 11. Member user updates the cart item option's option group and option id to
 *     another valid ids.
 *
 * This tests the successful update functionality and proper role-based
 * authentication flows. All API responses are asserted for type safety, and
 * key properties are validated.
 *
 * Note: Since there is no API to create a cart item option standalone, this
 * test simulates the cart item option id by generating a random UUID. In a
 * real environment, this should be replaced with actual existing cart item
 * option ids.
 */
export async function test_api_cart_update_cart_item_option_success(
  connection: api.IConnection,
) {
  // 1. Create and authenticate a member user
  const memberUserEmail: string = typia.random<string & tags.Format<"email">>();
  const memberUser: IShoppingMallMemberUser.IAuthorized =
    await api.functional.auth.memberUser.join(connection, {
      body: {
        email: memberUserEmail,
        password_hash: "StrongPassword123!",
        nickname: RandomGenerator.name(),
        full_name: RandomGenerator.name(2),
        phone_number: RandomGenerator.mobile(),
        status: "active",
      } satisfies IShoppingMallMemberUser.ICreate,
    });
  typia.assert(memberUser);

  // 2. Create and authenticate an admin user
  const adminUserEmail: string = typia.random<string & tags.Format<"email">>();
  const adminUser: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: {
        email: adminUserEmail,
        password_hash: "StrongPassword123!",
        nickname: RandomGenerator.name(),
        full_name: RandomGenerator.name(2),
        status: "active",
      } satisfies IShoppingMallAdminUser.ICreate,
    });
  typia.assert(adminUser);

  // 3. Using admin authentication, create a sale option group
  // Switch to admin user by login
  await api.functional.auth.adminUser.login(connection, {
    body: {
      email: adminUserEmail,
      password_hash: "StrongPassword123!",
    } satisfies IShoppingMallAdminUser.ILogin,
  });

  const saleOptionGroup: IShoppingMallSaleOptionGroup =
    await api.functional.shoppingMall.adminUser.saleOptionGroups.create(
      connection,
      {
        body: {
          code: RandomGenerator.alphaNumeric(10),
          name: RandomGenerator.paragraph({
            sentences: 3,
            wordMin: 4,
            wordMax: 8,
          }),
        } satisfies IShoppingMallSaleOptionGroup.ICreate,
      },
    );
  typia.assert(saleOptionGroup);

  // 4. Using admin authentication, create a sale option under the created group
  const saleOption: IShoppingMallSaleOption =
    await api.functional.shoppingMall.adminUser.saleOptions.create(connection, {
      body: {
        shopping_mall_sale_option_group_id: saleOptionGroup.id,
        code: RandomGenerator.alphaNumeric(12),
        name: RandomGenerator.paragraph({
          sentences: 3,
          wordMin: 4,
          wordMax: 8,
        }),
        type: "selection",
      } satisfies IShoppingMallSaleOption.ICreate,
    });
  typia.assert(saleOption);

  // 5. Create and authenticate a seller user
  const sellerUserEmail: string = typia.random<string & tags.Format<"email">>();
  const sellerUser: IShoppingMallSellerUser.IAuthorized =
    await api.functional.auth.sellerUser.join(connection, {
      body: {
        email: sellerUserEmail,
        password: "StrongPassword123!",
        nickname: RandomGenerator.name(),
        full_name: RandomGenerator.name(2),
        phone_number: RandomGenerator.mobile(),
        business_registration_number: RandomGenerator.alphaNumeric(12),
      } satisfies IShoppingMallSellerUser.ICreate,
    });
  typia.assert(sellerUser);

  // Login as seller user
  await api.functional.auth.sellerUser.login(connection, {
    body: {
      email: sellerUserEmail,
      password: "StrongPassword123!",
    } satisfies IShoppingMallSellerUser.ILogin,
  });

  // 6. Create a sale product by seller
  const saleProduct: IShoppingMallSale =
    await api.functional.shoppingMall.sellerUser.sales.create(connection, {
      body: {
        shopping_mall_channel_id: typia.random<string & tags.Format<"uuid">>(),
        shopping_mall_section_id: null,
        shopping_mall_seller_user_id: sellerUser.id,
        code: RandomGenerator.alphaNumeric(10),
        status: "active",
        name: RandomGenerator.paragraph({
          sentences: 3,
          wordMin: 4,
          wordMax: 8,
        }),
        description: RandomGenerator.content({ paragraphs: 1 }),
        price: 10000,
      } satisfies IShoppingMallSale.ICreate,
    });
  typia.assert(saleProduct);

  // 7. Create a sale unit for the product
  const saleUnit: IShoppingMallSaleUnit =
    await api.functional.shoppingMall.sellerUser.sales.saleUnits.create(
      connection,
      {
        saleId: saleProduct.id,
        body: {
          shopping_mall_sale_id: saleProduct.id,
          code: RandomGenerator.alphaNumeric(10),
          name: RandomGenerator.paragraph({ sentences: 2 }),
          description: RandomGenerator.paragraph({ sentences: 1 }),
        } satisfies IShoppingMallSaleUnit.ICreate,
      },
    );
  typia.assert(saleUnit);

  // 8. Create a sale unit option linked to the sale option group and sale option
  const saleUnitOption: IShoppingMallSaleUnitOption =
    await api.functional.shoppingMall.sellerUser.sales.saleUnits.saleUnitOptions.create(
      connection,
      {
        saleId: saleProduct.id,
        saleUnitId: saleUnit.id,
        body: {
          shopping_mall_sale_unit_id: saleUnit.id,
          shopping_mall_sale_option_id: saleOption.id,
          additional_price: 500,
          stock_quantity: 100,
        } satisfies IShoppingMallSaleUnitOption.ICreate,
      },
    );
  typia.assert(saleUnitOption);

  // 9. Switch to member user login before creating cart and cart item
  await api.functional.auth.memberUser.login(connection, {
    body: {
      email: memberUserEmail,
      password: "StrongPassword123!",
    } satisfies IShoppingMallMemberUser.ILogin,
  });

  // 10. Create a shopping cart linked to the member user
  const cart: IShoppingMallCarts =
    await api.functional.shoppingMall.memberUser.carts.createCart(connection, {
      body: {
        guest_user_id: null,
        member_user_id: memberUser.id,
        status: "active",
      } satisfies IShoppingMallCarts.ICreate,
    });
  typia.assert(cart);

  // 11. Create a cart item linked to the sale product snapshot
  // Here, since no snapshot creation method is provided, we generate a uuid
  // acknowledging this is a test UUID for the snapshot not created in this flow
  const saleSnapshotId: string & tags.Format<"uuid"> = typia.random<
    string & tags.Format<"uuid">
  >();

  const cartItem: IShoppingMallCartItem =
    await api.functional.shoppingMall.memberUser.carts.cartItems.create(
      connection,
      {
        cartId: cart.id,
        body: {
          shopping_cart_id: cart.id,
          shopping_sale_snapshot_id: saleSnapshotId,
          quantity: 1,
          unit_price: saleProduct.price,
          status: "active",
        } satisfies IShoppingMallCartItem.ICreate,
      },
    );
  typia.assert(cartItem);

  // 12. For update test, create another sale option group and option to update to
  const saleOptionGroup2: IShoppingMallSaleOptionGroup =
    await api.functional.shoppingMall.adminUser.saleOptionGroups.create(
      connection,
      {
        body: {
          code: RandomGenerator.alphaNumeric(10),
          name: RandomGenerator.paragraph({
            sentences: 3,
            wordMin: 4,
            wordMax: 8,
          }),
        } satisfies IShoppingMallSaleOptionGroup.ICreate,
      },
    );
  typia.assert(saleOptionGroup2);

  const saleOption2: IShoppingMallSaleOption =
    await api.functional.shoppingMall.adminUser.saleOptions.create(connection, {
      body: {
        shopping_mall_sale_option_group_id: saleOptionGroup2.id,
        code: RandomGenerator.alphaNumeric(12),
        name: RandomGenerator.paragraph({
          sentences: 3,
          wordMin: 4,
          wordMax: 8,
        }),
        type: "selection",
      } satisfies IShoppingMallSaleOption.ICreate,
    });
  typia.assert(saleOption2);

  // 13. Because the cart item option does not have a creation API in the materials,
  // we simulate creating the cart item option by randomly generating one
  // In practice, this would be fetched or created for the cart item
  const cartItemOptionId: string & tags.Format<"uuid"> = typia.random<
    string & tags.Format<"uuid">
  >();

  // 14. Update the cart item option to use new option group & option IDs
  const updatedCartItemOption: IShoppingMallCartItemOption =
    await api.functional.shoppingMall.memberUser.cartItems.cartItemOptions.updateCartItemOption(
      connection,
      {
        cartItemId: cartItem.id,
        cartItemOptionId: cartItemOptionId,
        body: {
          shopping_cart_item_id: cartItem.id,
          shopping_sale_option_group_id: saleOptionGroup2.id,
          shopping_sale_option_id: saleOption2.id,
        } satisfies IShoppingMallCartItemOption.IUpdate,
      },
    );
  typia.assert(updatedCartItemOption);

  TestValidator.equals(
    "Updated cartItemOption has correct option group",
    updatedCartItemOption.shopping_sale_option_group_id,
    saleOptionGroup2.id,
  );

  TestValidator.equals(
    "Updated cartItemOption has correct sale option",
    updatedCartItemOption.shopping_sale_option_id,
    saleOption2.id,
  );
}
