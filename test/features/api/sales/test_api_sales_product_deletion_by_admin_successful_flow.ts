import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallChannel } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallChannel";
import type { IShoppingMallSale } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSale";
import type { IShoppingMallSection } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSection";
import type { IShoppingMallSellerUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSellerUser";

/**
 * Validates the successful deletion of a sale product by an administrator
 * user.
 *
 * This test performs the following steps:
 *
 * 1. Create and authenticate an admin user.
 * 2. Admin user creates a sales channel.
 * 3. Admin user creates a sales section.
 * 4. Create and authenticate a seller user.
 * 5. Seller user creates a sale product under the created channel and section.
 * 6. Admin user logs in again to switch context.
 * 7. Admin user deletes the created sale product by saleId.
 *
 * All API calls are awaited and checked for correct typing with
 * typia.assert. Random realistic data matching DTO constraints are
 * generated for each create call. Nullable fields are passed explicitly
 * with null where applicable. Role context switching is handled by separate
 * join/login calls for admin and seller. The delete operation is verified
 * by successful completion and void return.
 *
 * This test ensures authorization, business logic, and data integrity for
 * sale product deletion.
 */
export async function test_api_sales_product_deletion_by_admin_successful_flow(
  connection: api.IConnection,
) {
  // 1. Admin user signs up
  const adminEmail: string = typia.random<string & tags.Format<"email">>();
  const adminPassword = "StrongPass123";
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

  // 2. Admin user login
  const adminLogin: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.login(connection, {
      body: {
        email: adminEmail,
        password_hash: adminPassword,
      } satisfies IShoppingMallAdminUser.ILogin,
    });
  typia.assert(adminLogin);

  // 3. Admin creates sales channel
  const channelCode = RandomGenerator.alphaNumeric(8);
  const channelName = RandomGenerator.name(2);
  const channel: IShoppingMallChannel =
    await api.functional.shoppingMall.adminUser.channels.create(connection, {
      body: {
        code: channelCode,
        name: channelName,
        description: null,
        status: "active",
      } satisfies IShoppingMallChannel.ICreate,
    });
  typia.assert(channel);

  // 4. Admin creates sales section
  const sectionCode = RandomGenerator.alphaNumeric(5);
  const sectionName = RandomGenerator.name(1);
  const section: IShoppingMallSection =
    await api.functional.shoppingMall.adminUser.sections.create(connection, {
      body: {
        code: sectionCode,
        name: sectionName,
        description: null,
        status: "active",
      } satisfies IShoppingMallSection.ICreate,
    });
  typia.assert(section);

  // 5. Seller user signs up
  const sellerEmail: string = typia.random<string & tags.Format<"email">>();
  const sellerPassword = "SellerPass456";
  const sellerBusinessRegNum = RandomGenerator.alphaNumeric(10);
  const sellerUser: IShoppingMallSellerUser.IAuthorized =
    await api.functional.auth.sellerUser.join(connection, {
      body: {
        email: sellerEmail,
        password: sellerPassword,
        nickname: RandomGenerator.name(),
        full_name: RandomGenerator.name(),
        phone_number: null,
        business_registration_number: sellerBusinessRegNum,
      } satisfies IShoppingMallSellerUser.ICreate,
    });
  typia.assert(sellerUser);

  // 6. Seller user login
  const sellerLogin: IShoppingMallSellerUser.IAuthorized =
    await api.functional.auth.sellerUser.login(connection, {
      body: {
        email: sellerEmail,
        password: sellerPassword,
      } satisfies IShoppingMallSellerUser.ILogin,
    });
  typia.assert(sellerLogin);

  // 7. Seller creates sale product
  const saleCode = RandomGenerator.alphaNumeric(8);
  const saleStatus = "active";
  const saleName = RandomGenerator.name(2);
  const salePrice = 10000;
  const sale: IShoppingMallSale =
    await api.functional.shoppingMall.sellerUser.sales.create(connection, {
      body: {
        shopping_mall_channel_id: channel.id,
        shopping_mall_section_id: section.id,
        shopping_mall_seller_user_id: sellerUser.id,
        code: saleCode,
        status: saleStatus,
        name: saleName,
        description: null,
        price: salePrice,
      } satisfies IShoppingMallSale.ICreate,
    });
  typia.assert(sale);

  // 8. Admin user login again to switch context
  const adminLogin2: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.login(connection, {
      body: {
        email: adminEmail,
        password_hash: adminPassword,
      } satisfies IShoppingMallAdminUser.ILogin,
    });
  typia.assert(adminLogin2);

  // 9. Admin deletes the sale product
  await api.functional.shoppingMall.adminUser.sales.erase(connection, {
    saleId: sale.id,
  });

  // 10. Deletion successful; no return value to assert.
}
