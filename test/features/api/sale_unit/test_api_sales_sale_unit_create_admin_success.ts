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
 * Test the successful creation of a sale unit under an existing sale
 * product by an admin user.
 *
 * This test covers the entire workflow involving multiple user roles and
 * resources:
 *
 * 1. Create an admin user and authenticate as admin.
 * 2. Create a new shopping mall sales channel using admin authentication.
 * 3. Create a seller user and authenticate as seller.
 * 4. Create a new sale product under the created channel, owned by the seller.
 * 5. Switch back to admin authentication.
 * 6. Create a new sale unit linked to the sale product by the admin user.
 * 7. Verify that the sale unit is created successfully and returns expected
 *    data.
 *
 * All entities created have appropriate relationships to ensure data
 * integrity. This test ensures that role-based access control is enforced
 * and resources are created correctly.
 */
export async function test_api_sales_sale_unit_create_admin_success(
  connection: api.IConnection,
) {
  // 1. Create admin user
  const adminEmail: string = typia.random<string & tags.Format<"email">>();
  const adminPassword: string = RandomGenerator.alphaNumeric(12);
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

  // 2. Create shopping mall sales channel as admin
  const channelCode: string = `chn${RandomGenerator.alphaNumeric(6)}`;
  const channelName: string = `Channel ${RandomGenerator.name()}`;
  const channel: IShoppingMallChannel =
    await api.functional.shoppingMall.adminUser.channels.create(connection, {
      body: {
        code: channelCode,
        name: channelName,
        description: "Test channel",
        status: "active",
      } satisfies IShoppingMallChannel.ICreate,
    });
  typia.assert(channel);

  // 3. Create seller user and authenticate
  const sellerEmail: string = typia.random<string & tags.Format<"email">>();
  const sellerPassword: string = RandomGenerator.alphaNumeric(12);
  const sellerUser: IShoppingMallSellerUser.IAuthorized =
    await api.functional.auth.sellerUser.join(connection, {
      body: {
        email: sellerEmail,
        password: sellerPassword,
        nickname: RandomGenerator.name(),
        full_name: RandomGenerator.name(),
        business_registration_number: `BRN${RandomGenerator.alphaNumeric(7)}`,
      } satisfies IShoppingMallSellerUser.ICreate,
    });
  typia.assert(sellerUser);

  // 4. Create sale product as seller
  const saleCode: string = `sale${RandomGenerator.alphaNumeric(6)}`;
  const saleName: string = `Sale Product ${RandomGenerator.name()}`;
  const saleProduct: IShoppingMallSale =
    await api.functional.shoppingMall.sellerUser.sales.create(connection, {
      body: {
        shopping_mall_channel_id: channel.id,
        shopping_mall_seller_user_id: sellerUser.id,
        code: saleCode,
        status: "active",
        name: saleName,
        price: 10000,
      } satisfies IShoppingMallSale.ICreate,
    });
  typia.assert(saleProduct);

  // 5. Switch back to admin user context (login)
  await api.functional.auth.adminUser.login(connection, {
    body: {
      email: adminEmail,
      password_hash: adminPassword,
    } satisfies IShoppingMallAdminUser.ILogin,
  });

  // 6. Create new sale unit linked to the sale product by admin
  const saleUnitCode: string = `unit${RandomGenerator.alphaNumeric(6)}`;
  const saleUnitName: string = `Sale Unit ${RandomGenerator.name()}`;
  const saleUnit: IShoppingMallSaleUnit =
    await api.functional.shoppingMall.adminUser.sales.saleUnits.create(
      connection,
      {
        saleId: saleProduct.id,
        body: {
          shopping_mall_sale_id: saleProduct.id,
          code: saleUnitCode,
          name: saleUnitName,
          description: "Test sale unit",
        } satisfies IShoppingMallSaleUnit.ICreate,
      },
    );
  typia.assert(saleUnit);

  // 7. Validate returned sale unit properties
  TestValidator.equals(
    "sale unit's saleId matches",
    saleUnit.shopping_mall_sale_id,
    saleProduct.id,
  );
  TestValidator.equals("sale unit's code matches", saleUnit.code, saleUnitCode);
  TestValidator.equals("sale unit's name matches", saleUnit.name, saleUnitName);
}
