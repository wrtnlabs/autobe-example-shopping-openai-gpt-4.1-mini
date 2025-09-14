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
 * Test updating a sale unit under a sale product by admin user.
 *
 * This test does a complete workflow:
 *
 * 1. Create an admin user and authenticate
 * 2. Create a channel under the admin
 * 3. Create a seller user and authenticate
 * 4. Create a sale product associated with the channel and seller user
 * 5. As an admin user, create a sale unit under the sale product
 * 6. Update that sale unit with new data
 * 7. Validate the returned updated sale unit matches the requested update
 *
 * The test verifies role-based authentication switching and CRUD operations
 * correctness.
 */
export async function test_api_sales_sale_unit_update_admin_success(
  connection: api.IConnection,
) {
  // 1. Create admin user
  const adminUserEmail = typia.random<string & tags.Format<"email">>();
  const adminUserPassword = "AdminPass123!";
  const adminUserBody = {
    email: adminUserEmail,
    password_hash: adminUserPassword,
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(),
    status: "active",
  } satisfies IShoppingMallAdminUser.ICreate;
  const adminUser: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: adminUserBody,
    });
  typia.assert(adminUser);

  // 2. Admin user creates a channel
  await api.functional.auth.adminUser.login(connection, {
    body: {
      email: adminUserEmail,
      password_hash: adminUserPassword,
    } satisfies IShoppingMallAdminUser.ILogin,
  });

  const channelBody = {
    code: `chn${RandomGenerator.alphaNumeric(5)}`,
    name: `Channel ${RandomGenerator.name()}`,
    description: "Test channel for E2E",
    status: "active",
  } satisfies IShoppingMallChannel.ICreate;
  const channel: IShoppingMallChannel =
    await api.functional.shoppingMall.adminUser.channels.create(connection, {
      body: channelBody,
    });
  typia.assert(channel);

  // 3. Create seller user and authenticate
  const sellerUserEmail = typia.random<string & tags.Format<"email">>();
  const sellerUserPassword = "SellerPass123!";
  const sellerUserBody = {
    email: sellerUserEmail,
    password: sellerUserPassword,
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(),
    phone_number: null,
    business_registration_number: `BRN${RandomGenerator.alphaNumeric(9)}`,
  } satisfies IShoppingMallSellerUser.ICreate;
  const sellerUser: IShoppingMallSellerUser.IAuthorized =
    await api.functional.auth.sellerUser.join(connection, {
      body: sellerUserBody,
    });
  typia.assert(sellerUser);

  await api.functional.auth.sellerUser.login(connection, {
    body: {
      email: sellerUserEmail,
      password: sellerUserPassword,
    } satisfies IShoppingMallSellerUser.ILogin,
  });

  // 4. Seller user creates a sale product
  const saleProductBody = {
    shopping_mall_channel_id: channel.id,
    shopping_mall_section_id: null,
    shopping_mall_seller_user_id: sellerUser.id,
    code: `sale${RandomGenerator.alphaNumeric(6)}`,
    status: "active",
    name: `Product ${RandomGenerator.name()}`,
    description: "Test sale product",
    price: 10000,
  } satisfies IShoppingMallSale.ICreate;
  const saleProduct: IShoppingMallSale =
    await api.functional.shoppingMall.sellerUser.sales.create(connection, {
      body: saleProductBody,
    });
  typia.assert(saleProduct);

  // 5. Switch authentication back to admin user
  await api.functional.auth.adminUser.login(connection, {
    body: {
      email: adminUserEmail,
      password_hash: adminUserPassword,
    } satisfies IShoppingMallAdminUser.ILogin,
  });

  // 6. Admin user creates a sale unit
  const saleUnitCreateBody = {
    shopping_mall_sale_id: saleProduct.id,
    code: `unit${RandomGenerator.alphaNumeric(4)}`,
    name: `Unit ${RandomGenerator.name()}`,
    description: "Initial sale unit",
  } satisfies IShoppingMallSaleUnit.ICreate;
  const saleUnit: IShoppingMallSaleUnit =
    await api.functional.shoppingMall.adminUser.sales.saleUnits.create(
      connection,
      { saleId: saleProduct.id, body: saleUnitCreateBody },
    );
  typia.assert(saleUnit);

  // 7. Update the sale unit with new data
  const saleUnitUpdateBody = {
    code: `updated${RandomGenerator.alphaNumeric(4)}`,
    name: `Updated Unit ${RandomGenerator.name()}`,
    description: "Updated description",
  } satisfies IShoppingMallSaleUnit.IUpdate;
  const updatedSaleUnit: IShoppingMallSaleUnit =
    await api.functional.shoppingMall.adminUser.sales.saleUnits.update(
      connection,
      {
        saleId: saleProduct.id,
        saleUnitId: saleUnit.id,
        body: saleUnitUpdateBody,
      },
    );
  typia.assert(updatedSaleUnit);

  // Validate updated properties match requested update
  TestValidator.equals(
    "sale unit code matches update",
    updatedSaleUnit.code,
    saleUnitUpdateBody.code!,
  );
  TestValidator.equals(
    "sale unit name matches update",
    updatedSaleUnit.name,
    saleUnitUpdateBody.name!,
  );
  if (saleUnitUpdateBody.description === null) {
    TestValidator.equals(
      "sale unit description is null as requested",
      updatedSaleUnit.description,
      null,
    );
  } else {
    TestValidator.equals(
      "sale unit description matches update",
      updatedSaleUnit.description,
      saleUnitUpdateBody.description!,
    );
  }
}
