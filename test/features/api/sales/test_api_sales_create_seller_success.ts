import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallChannel } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallChannel";
import type { IShoppingMallSale } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSale";
import type { IShoppingMallSellerUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSellerUser";

/**
 * Successfully create a new product sale for sellerUser.
 *
 * This test verifies the following workflow:
 *
 * 1. Create an admin user and authenticate
 * 2. Create a sales channel under admin authentication
 * 3. Create a seller user and authenticate
 * 4. Create a sale product referencing the channel and seller user
 * 5. Validate that the created sale product correctly reflects the inputs and
 *    associations.
 */
export async function test_api_sales_create_seller_success(
  connection: api.IConnection,
) {
  // 1. Create admin user account
  const adminEmail = typia.random<string & tags.Format<"email">>();
  const adminPassword = RandomGenerator.alphaNumeric(12);
  const adminNickname = RandomGenerator.name();
  const adminFullName = RandomGenerator.name(2);
  const adminStatus = "active";

  const adminUser: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: {
        email: adminEmail,
        password_hash: adminPassword,
        nickname: adminNickname,
        full_name: adminFullName,
        status: adminStatus,
      } satisfies IShoppingMallAdminUser.ICreate,
    });
  typia.assert(adminUser);

  // 2. Login as admin user
  const loggedInAdmin: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.login(connection, {
      body: {
        email: adminEmail,
        password_hash: adminPassword,
      } satisfies IShoppingMallAdminUser.ILogin,
    });
  typia.assert(loggedInAdmin);

  // 3. Create sales channel using admin authentication
  const channelCode = RandomGenerator.alphaNumeric(8);
  const channelName = RandomGenerator.name(2);
  const channelStatus = "active";

  const channel: IShoppingMallChannel =
    await api.functional.shoppingMall.adminUser.channels.create(connection, {
      body: {
        code: channelCode,
        name: channelName,
        status: channelStatus,
      } satisfies IShoppingMallChannel.ICreate,
    });
  typia.assert(channel);

  // 4. Create seller user account
  const sellerEmail = typia.random<string & tags.Format<"email">>();
  const sellerPassword = RandomGenerator.alphaNumeric(12);
  const sellerNickname = RandomGenerator.name();
  const sellerFullName = RandomGenerator.name(2);
  const sellerBusinessNumber = RandomGenerator.alphaNumeric(10);

  const sellerUser: IShoppingMallSellerUser.IAuthorized =
    await api.functional.auth.sellerUser.join(connection, {
      body: {
        email: sellerEmail,
        password: sellerPassword,
        nickname: sellerNickname,
        full_name: sellerFullName,
        business_registration_number: sellerBusinessNumber,
        phone_number: null,
      } satisfies IShoppingMallSellerUser.ICreate,
    });
  typia.assert(sellerUser);

  // 5. Login as seller user
  const loggedInSeller: IShoppingMallSellerUser.IAuthorized =
    await api.functional.auth.sellerUser.login(connection, {
      body: {
        email: sellerEmail,
        password: sellerPassword,
      } satisfies IShoppingMallSellerUser.ILogin,
    });
  typia.assert(loggedInSeller);

  // 6. Create sales product referencing channel and seller user
  const saleCode = RandomGenerator.alphaNumeric(12);
  const saleStatus = "active";
  const saleName = RandomGenerator.name(3);
  const salePrice = Math.floor(Math.random() * 100000) + 1000; // 1000~101000

  const saleProduct: IShoppingMallSale =
    await api.functional.shoppingMall.sellerUser.sales.create(connection, {
      body: {
        shopping_mall_channel_id: channel.id,
        shopping_mall_seller_user_id: sellerUser.id,
        code: saleCode,
        status: saleStatus,
        name: saleName,
        price: salePrice,
        description: null,
      } satisfies IShoppingMallSale.ICreate,
    });
  typia.assert(saleProduct);

  // 7. Validate the returned sale product data
  TestValidator.equals(
    "sale product channel id matches",
    saleProduct.shopping_mall_channel_id,
    channel.id,
  );
  TestValidator.equals(
    "sale product seller user id matches",
    saleProduct.shopping_mall_seller_user_id,
    sellerUser.id,
  );
  TestValidator.equals("sale product code matches", saleProduct.code, saleCode);
  TestValidator.equals(
    "sale product status matches",
    saleProduct.status,
    saleStatus,
  );
  TestValidator.equals("sale product name matches", saleProduct.name, saleName);
  TestValidator.equals(
    "sale product price matches",
    saleProduct.price,
    salePrice,
  );
}
