import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallCategory } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCategory";
import type { IShoppingMallChannel } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallChannel";
import type { IShoppingMallSale } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSale";
import type { IShoppingMallSaleUnit } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSaleUnit";
import type { IShoppingMallSellerUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSellerUser";

/**
 * Validate admin user access to detailed information of a sale unit under a
 * sale product.
 *
 * This test implements a comprehensive workflow involving multiple user
 * roles and entities:
 *
 * 1. Create an admin user for managing categories and channels.
 * 2. Login as admin user to authenticate.
 * 3. Create a product category using the admin user credentials.
 * 4. Create a sales channel using the admin user credentials.
 * 5. Create a seller user who will own sale products.
 * 6. Login as seller user to authenticate.
 * 7. Create a sale product under the seller user, linking to the created
 *    channel and category.
 * 8. Create a sale unit under the sale product with unique code and name.
 * 9. Switch to admin user credentials by logging in again.
 * 10. Request the sale unit detail via admin user API and validate returned
 *     data correctness.
 *
 * This test validates role-based access control, entity linkage, and data
 * accuracy.
 */
export async function test_api_sale_sale_unit_detail_with_admin_authorization(
  connection: api.IConnection,
) {
  // 1. Create an admin user
  const adminUserCreateBody = {
    email: RandomGenerator.alphaNumeric(8) + "@admin.example.com",
    password_hash: RandomGenerator.alphaNumeric(16),
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(),
    status: "active",
  } satisfies IShoppingMallAdminUser.ICreate;
  const adminUser: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: adminUserCreateBody,
    });
  typia.assert(adminUser);

  // 2. Admin user login to authenticate
  const adminUserLoginBody = {
    email: adminUserCreateBody.email,
    password_hash: adminUserCreateBody.password_hash,
  } satisfies IShoppingMallAdminUser.ILogin;
  const adminUserSession: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.login(connection, {
      body: adminUserLoginBody,
    });
  typia.assert(adminUserSession);

  // 3. Create a product category with admin authorization
  const categoryCreateBody = {
    code: RandomGenerator.alphaNumeric(5),
    name: RandomGenerator.name(),
    status: "active",
    description: RandomGenerator.paragraph({ sentences: 3 }),
  } satisfies IShoppingMallCategory.ICreate;
  const category: IShoppingMallCategory =
    await api.functional.shoppingMall.adminUser.categories.create(connection, {
      body: categoryCreateBody,
    });
  typia.assert(category);

  // 4. Create a sales channel with admin authorization
  const channelCreateBody = {
    code: RandomGenerator.alphaNumeric(5),
    name: RandomGenerator.name(),
    status: "active",
    description: RandomGenerator.paragraph({ sentences: 2 }),
  } satisfies IShoppingMallChannel.ICreate;
  const channel: IShoppingMallChannel =
    await api.functional.shoppingMall.adminUser.channels.create(connection, {
      body: channelCreateBody,
    });
  typia.assert(channel);

  // 5. Create a seller user
  const sellerUserCreateBody = {
    email: RandomGenerator.alphaNumeric(8) + "@seller.example.com",
    password: RandomGenerator.alphaNumeric(16),
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(),
    business_registration_number: RandomGenerator.alphaNumeric(12),
  } satisfies IShoppingMallSellerUser.ICreate;
  const sellerUser: IShoppingMallSellerUser.IAuthorized =
    await api.functional.auth.sellerUser.join(connection, {
      body: sellerUserCreateBody,
    });
  typia.assert(sellerUser);

  // 6. Seller user login
  const sellerUserLoginBody = {
    email: sellerUserCreateBody.email,
    password: sellerUserCreateBody.password,
  } satisfies IShoppingMallSellerUser.ILogin;
  const sellerUserSession: IShoppingMallSellerUser.IAuthorized =
    await api.functional.auth.sellerUser.login(connection, {
      body: sellerUserLoginBody,
    });
  typia.assert(sellerUserSession);

  // 7. Create sale product under seller user
  const saleProductCreateBody = {
    shopping_mall_channel_id: channel.id,
    shopping_mall_section_id: null,
    shopping_mall_seller_user_id: sellerUser.id,
    code: RandomGenerator.alphaNumeric(10),
    status: "active",
    name: RandomGenerator.name(),
    description: RandomGenerator.paragraph({ sentences: 4 }),
    price: 10000,
  } satisfies IShoppingMallSale.ICreate;
  const saleProduct: IShoppingMallSale =
    await api.functional.shoppingMall.sellerUser.sales.create(connection, {
      body: saleProductCreateBody,
    });
  typia.assert(saleProduct);

  // 8. Create sale unit under the sale product
  const saleUnitCreateBody = {
    shopping_mall_sale_id: saleProduct.id,
    code: RandomGenerator.alphaNumeric(10),
    name: RandomGenerator.name(),
    description: RandomGenerator.paragraph({ sentences: 2 }),
  } satisfies IShoppingMallSaleUnit.ICreate;
  const saleUnit: IShoppingMallSaleUnit =
    await api.functional.shoppingMall.sellerUser.sales.saleUnits.create(
      connection,
      {
        saleId: saleProduct.id,
        body: saleUnitCreateBody,
      },
    );
  typia.assert(saleUnit);

  // 9. Admin user login again to switch role context
  const reLoginAdminUser: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.login(connection, {
      body: adminUserLoginBody,
    });
  typia.assert(reLoginAdminUser);

  // 10. Admin user requests sale unit detail
  const readSaleUnit: IShoppingMallSaleUnit =
    await api.functional.shoppingMall.adminUser.sales.saleUnits.at(connection, {
      saleId: saleProduct.id,
      saleUnitId: saleUnit.id,
    });
  typia.assert(readSaleUnit);

  // Validate that the returned sale unit matches the created one
  TestValidator.equals("sale unit id matches", readSaleUnit.id, saleUnit.id);
  TestValidator.equals(
    "sale unit code matches",
    readSaleUnit.code,
    saleUnit.code,
  );
  TestValidator.equals(
    "sale unit name matches",
    readSaleUnit.name,
    saleUnit.name,
  );
  TestValidator.equals(
    "sale unit description matches",
    readSaleUnit.description,
    saleUnit.description,
  );
  TestValidator.equals(
    "sale unit sale id matches",
    readSaleUnit.shopping_mall_sale_id,
    saleProduct.id,
  );
}
