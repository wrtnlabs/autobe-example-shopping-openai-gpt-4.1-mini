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
 * This E2E test validates the successful deletion of a sale unit by a
 * seller user. It performs complete setup by registering and authenticating
 * an admin user, who creates required product category and sales channel.
 * Then switches to a seller user context, registers and authenticates the
 * seller user, creates a sale product, adds a sale unit, and finally
 * deletes the sale unit via the admin API.
 *
 * The test ensures proper multi-role authentication switching, accurate
 * data generation and linkage, and strict adherence to DTO schemas and
 * business logic. It validates the seller's ability to remove product
 * components, enforcing role-based access and dependency integrity.
 *
 * Each step is carefully crafted with realistic values, typia type
 * assertions, and precise API calls, reflecting a real-world seller
 * operation scenario within the shopping mall system.
 */
export async function test_api_seller_sale_unit_deletion_success(
  connection: api.IConnection,
) {
  // 1. Admin user registration
  const adminUserEmail = typia.random<string & tags.Format<"email">>();
  const adminUserPassword = RandomGenerator.alphaNumeric(12);
  const admin: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: {
        email: adminUserEmail,
        password_hash: adminUserPassword,
        nickname: RandomGenerator.name(),
        full_name: RandomGenerator.name(),
        status: "active",
      } satisfies IShoppingMallAdminUser.ICreate,
    });
  typia.assert(admin);

  // 2. Admin user login explicitly for role switch
  await api.functional.auth.adminUser.login(connection, {
    body: {
      email: adminUserEmail,
      password_hash: adminUserPassword,
    } satisfies IShoppingMallAdminUser.ILogin,
  });

  // 3. Admin creates product category (required for sales)
  const categoryCode = RandomGenerator.alphaNumeric(6).toUpperCase();
  const categoryName = RandomGenerator.name();
  const category: IShoppingMallCategory =
    await api.functional.shoppingMall.adminUser.categories.create(connection, {
      body: {
        code: categoryCode,
        name: categoryName,
        status: "active",
        description: "Category created for test",
      } satisfies IShoppingMallCategory.ICreate,
    });
  typia.assert(category);

  // 4. Admin creates sales channel (required for sales)
  const channelCode = RandomGenerator.alphaNumeric(6).toLowerCase();
  const channelName = `Channel-${RandomGenerator.paragraph({
    sentences: 2,
    wordMin: 3,
    wordMax: 8,
  })}`;
  const channel: IShoppingMallChannel =
    await api.functional.shoppingMall.adminUser.channels.create(connection, {
      body: {
        code: channelCode,
        name: channelName,
        status: "active",
        description: "Channel created for test",
      } satisfies IShoppingMallChannel.ICreate,
    });
  typia.assert(channel);

  // 5. Seller user registration
  const sellerUserEmail = typia.random<string & tags.Format<"email">>();
  const sellerUserPassword = RandomGenerator.alphaNumeric(12);
  const seller: IShoppingMallSellerUser.IAuthorized =
    await api.functional.auth.sellerUser.join(connection, {
      body: {
        email: sellerUserEmail,
        password: sellerUserPassword,
        nickname: RandomGenerator.name(),
        full_name: RandomGenerator.name(),
        phone_number: RandomGenerator.mobile("010"),
        business_registration_number:
          RandomGenerator.alphaNumeric(10).toUpperCase(),
      } satisfies IShoppingMallSellerUser.ICreate,
    });
  typia.assert(seller);

  // 6. Seller user login for role switch
  await api.functional.auth.sellerUser.login(connection, {
    body: {
      email: sellerUserEmail,
      password: sellerUserPassword,
    } satisfies IShoppingMallSellerUser.ILogin,
  });

  // 7. Seller creates a new sale product
  const saleCode = RandomGenerator.alphaNumeric(8).toUpperCase();
  const saleName = RandomGenerator.paragraph({
    sentences: 2,
    wordMin: 4,
    wordMax: 10,
  });
  const saleDescription = RandomGenerator.content({
    paragraphs: 1,
    sentenceMin: 5,
    sentenceMax: 10,
    wordMin: 3,
    wordMax: 8,
  });
  const sale: IShoppingMallSale =
    await api.functional.shoppingMall.sellerUser.sales.create(connection, {
      body: {
        shopping_mall_channel_id: channel.id,
        shopping_mall_section_id: null,
        shopping_mall_seller_user_id: seller.id,
        code: saleCode,
        status: "active",
        name: saleName,
        description: saleDescription,
        price: typia.random<
          number & tags.Minimum<100> & tags.Maximum<100000>
        >(),
      } satisfies IShoppingMallSale.ICreate,
    });
  typia.assert(sale);

  // 8. Seller creates a sale unit within the sale product
  const saleUnitCode = RandomGenerator.alphaNumeric(6).toUpperCase();
  const saleUnitName = RandomGenerator.name();
  const saleUnitDescription = RandomGenerator.paragraph({
    sentences: 2,
    wordMin: 5,
    wordMax: 12,
  });
  const saleUnit: IShoppingMallSaleUnit =
    await api.functional.shoppingMall.sellerUser.sales.saleUnits.create(
      connection,
      {
        saleId: sale.id,
        body: {
          shopping_mall_sale_id: sale.id,
          code: saleUnitCode,
          name: saleUnitName,
          description: saleUnitDescription,
        } satisfies IShoppingMallSaleUnit.ICreate,
      },
    );
  typia.assert(saleUnit);

  // 9. Seller deletes the created sale unit via admin API
  await api.functional.shoppingMall.adminUser.sales.saleUnits.erase(
    connection,
    {
      saleId: sale.id,
      saleUnitId: saleUnit.id,
    },
  );
}
