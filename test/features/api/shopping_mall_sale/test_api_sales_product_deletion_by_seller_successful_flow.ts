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
 * Comprehensive E2E test for sales product deletion by seller user.
 *
 * This test covers the full prerequisites of user creation, authentication,
 * sales channel and section setup, product creation, authentication context
 * switching, and finally deletion of the sale product by the seller user
 * ensuring authorized operations.
 *
 * Stepwise Breakdown:
 *
 * 1. Create and authenticate admin user.
 * 2. Create sales channel via admin user.
 * 3. Create section under admin user.
 * 4. Create and authenticate seller user.
 * 5. Seller user creates sale product attached to channel and section.
 * 6. Seller user deletes the created sale product.
 *
 * Each step uses proper DTOs and API calls with typia assertions for
 * validation.
 */
export async function test_api_sales_product_deletion_by_seller_successful_flow(
  connection: api.IConnection,
) {
  // 1. Create admin user and authenticate
  const adminCreateBody = {
    email: RandomGenerator.alphaNumeric(8) + "@admin.example.com",
    password_hash: "hash1234",
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(2),
    status: "active",
  } satisfies IShoppingMallAdminUser.ICreate;

  const adminUser: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: adminCreateBody,
    });
  typia.assert(adminUser);

  // 2. Create sales channel with admin credentials
  await api.functional.auth.adminUser.login(connection, {
    body: {
      email: adminCreateBody.email,
      password_hash: adminCreateBody.password_hash,
    } satisfies IShoppingMallAdminUser.ILogin,
  });

  const channelCreateBody = {
    code: RandomGenerator.alphaNumeric(6),
    name: RandomGenerator.name(),
    description: null,
    status: "active",
  } satisfies IShoppingMallChannel.ICreate;

  const channel: IShoppingMallChannel =
    await api.functional.shoppingMall.adminUser.channels.create(connection, {
      body: channelCreateBody,
    });
  typia.assert(channel);

  // 3. Create section with admin credentials
  const sectionCreateBody = {
    code: RandomGenerator.alphaNumeric(6),
    name: RandomGenerator.name(),
    description: null,
    status: "active",
  } satisfies IShoppingMallSection.ICreate;

  const section: IShoppingMallSection =
    await api.functional.shoppingMall.adminUser.sections.create(connection, {
      body: sectionCreateBody,
    });
  typia.assert(section);

  // 4. Create and authenticate seller user
  const sellerCreateBody = {
    email: RandomGenerator.alphaNumeric(8) + "@seller.example.com",
    password: "P@ssword1",
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(2),
    phone_number: null,
    business_registration_number: RandomGenerator.alphaNumeric(10),
  } satisfies IShoppingMallSellerUser.ICreate;

  const sellerUser: IShoppingMallSellerUser.IAuthorized =
    await api.functional.auth.sellerUser.join(connection, {
      body: sellerCreateBody,
    });
  typia.assert(sellerUser);

  await api.functional.auth.sellerUser.login(connection, {
    body: {
      email: sellerCreateBody.email,
      password: sellerCreateBody.password,
    } satisfies IShoppingMallSellerUser.ILogin,
  });

  // 5. Seller user creates a sale product
  const saleCreateBody = {
    shopping_mall_channel_id: channel.id,
    shopping_mall_section_id: section.id,
    shopping_mall_seller_user_id: sellerUser.id, // Corrected: seller user id
    code: RandomGenerator.alphaNumeric(8),
    status: "active",
    name: RandomGenerator.name(),
    description: RandomGenerator.content({ paragraphs: 1 }),
    price: 20000,
  } satisfies IShoppingMallSale.ICreate;

  const sale: IShoppingMallSale =
    await api.functional.shoppingMall.sellerUser.sales.create(connection, {
      body: saleCreateBody,
    });
  typia.assert(sale);

  // 6. Seller user deletes the created sale product
  await api.functional.shoppingMall.sellerUser.sales.erase(connection, {
    saleId: sale.id,
  });

  // No response expected from delete
}
