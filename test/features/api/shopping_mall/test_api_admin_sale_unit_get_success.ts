import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallChannel } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallChannel";
import type { IShoppingMallSale } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSale";
import type { IShoppingMallSaleUnit } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSaleUnit";
import type { IShoppingMallSellerUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSellerUser";

/**
 * Validate admin user can retrieve a sale unit's details successfully.
 *
 * This E2E test covers the entire business workflow required for an admin
 * user to obtain detailed information about a sale unit in the shopping
 * mall system. It includes multi-role authentication, resource creations,
 * and role switching.
 *
 * Steps:
 *
 * 1. Create and authenticate an admin user.
 * 2. Admin creates a sales channel.
 * 3. Create and authenticate a seller user.
 * 4. Seller creates a sale product linked to the channel.
 * 5. Admin creates a sale unit under the sale product.
 * 6. Admin retrieves the sale unit to confirm correct and authorized access.
 * 7. Confirm via assertions that retrieved data matches the creation inputs.
 */
export async function test_api_admin_sale_unit_get_success(
  connection: api.IConnection,
) {
  // 1. Admin join: create admin user
  const adminCreateBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password_hash: RandomGenerator.alphaNumeric(12),
    nickname: RandomGenerator.name(2),
    full_name: RandomGenerator.name(2),
    status: "active",
  } satisfies IShoppingMallAdminUser.ICreate;
  const admin: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: adminCreateBody,
    });
  typia.assert(admin);

  // Admin login
  const adminLoginBody = {
    email: adminCreateBody.email,
    password_hash: adminCreateBody.password_hash,
  } satisfies IShoppingMallAdminUser.ILogin;
  await api.functional.auth.adminUser.login(connection, {
    body: adminLoginBody,
  });

  // Admin creates channel
  const channelCreateBody = {
    code: RandomGenerator.alphaNumeric(6).toLowerCase(),
    name: RandomGenerator.name(2),
    description: RandomGenerator.paragraph({ sentences: 5 }),
    status: "active",
  } satisfies IShoppingMallChannel.ICreate;
  const channel: IShoppingMallChannel =
    await api.functional.shoppingMall.adminUser.channels.create(connection, {
      body: channelCreateBody,
    });
  typia.assert(channel);

  // Seller join: create seller user
  const sellerCreateBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password: RandomGenerator.alphaNumeric(12),
    nickname: RandomGenerator.name(2),
    full_name: RandomGenerator.name(2),
    phone_number: RandomGenerator.mobile(),
    business_registration_number:
      RandomGenerator.alphaNumeric(10).toUpperCase(),
  } satisfies IShoppingMallSellerUser.ICreate;
  const seller: IShoppingMallSellerUser.IAuthorized =
    await api.functional.auth.sellerUser.join(connection, {
      body: sellerCreateBody,
    });
  typia.assert(seller);

  // Seller login
  const sellerLoginBody = {
    email: sellerCreateBody.email,
    password: sellerCreateBody.password,
  } satisfies IShoppingMallSellerUser.ILogin;
  await api.functional.auth.sellerUser.login(connection, {
    body: sellerLoginBody,
  });

  // Seller creates sale product linked to channel
  const saleCreateBody = {
    shopping_mall_channel_id: channel.id,
    shopping_mall_section_id: null,
    shopping_mall_seller_user_id: seller.id,
    code: RandomGenerator.alphaNumeric(8).toUpperCase(),
    status: "active",
    name: RandomGenerator.name(3),
    description: RandomGenerator.paragraph({ sentences: 6 }),
    price: Math.floor(Math.random() * 100000) / 100,
  } satisfies IShoppingMallSale.ICreate;
  const sale: IShoppingMallSale =
    await api.functional.shoppingMall.sellerUser.sales.create(connection, {
      body: saleCreateBody,
    });
  typia.assert(sale);

  // Switch back to admin context
  await api.functional.auth.adminUser.login(connection, {
    body: adminLoginBody,
  });

  // Admin creates sale unit linked to sale product
  const saleUnitCreateBody = {
    shopping_mall_sale_id: sale.id,
    code: RandomGenerator.alphaNumeric(6).toUpperCase(),
    name: RandomGenerator.name(2),
    description: RandomGenerator.paragraph({ sentences: 4 }),
  } satisfies IShoppingMallSaleUnit.ICreate;
  const saleUnit: IShoppingMallSaleUnit =
    await api.functional.shoppingMall.adminUser.sales.saleUnits.create(
      connection,
      {
        saleId: sale.id,
        body: saleUnitCreateBody,
      },
    );
  typia.assert(saleUnit);

  // Admin retrieves the sale unit
  const retrievedSaleUnit: IShoppingMallSaleUnit =
    await api.functional.shoppingMall.adminUser.sales.saleUnits.at(connection, {
      saleId: sale.id,
      saleUnitId: saleUnit.id,
    });
  typia.assert(retrievedSaleUnit);

  // Validate the retrieved data matches created data
  TestValidator.equals(
    "retrieved sale unit ID matches created",
    retrievedSaleUnit.id,
    saleUnit.id,
  );
  TestValidator.equals(
    "retrieved sale unit sale ID matches created",
    retrievedSaleUnit.shopping_mall_sale_id,
    sale.id,
  );
  TestValidator.equals(
    "retrieved sale unit code matches created",
    retrievedSaleUnit.code,
    saleUnitCreateBody.code,
  );
  TestValidator.equals(
    "retrieved sale unit name matches created",
    retrievedSaleUnit.name,
    saleUnitCreateBody.name,
  );
  TestValidator.equals(
    "retrieved sale unit description matches created",
    retrievedSaleUnit.description,
    saleUnitCreateBody.description,
  );
}
