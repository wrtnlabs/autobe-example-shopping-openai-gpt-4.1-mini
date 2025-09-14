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
 * Test scenario for creating a sale unit under a sale product with
 * validation.
 *
 * This scenario covers:
 *
 * 1. Creating an admin user and authenticating.
 * 2. Creating a product category as admin.
 * 3. Creating a sales channel as admin.
 * 4. Creating a seller user and authenticating.
 * 5. Creating a sale product under the seller user with links to category and
 *    channel.
 * 6. Creating a sale unit under the sale product.
 * 7. Validations including type assertions and business logic checks.
 *
 * It tests creation endpoints, authorization flows, and ensures data
 * integrity.
 */
export async function test_api_sale_create_sale_unit_validation(
  connection: api.IConnection,
) {
  // 1. Admin User Join and Login
  const adminEmail = typia.random<string & tags.Format<"email">>();
  const adminPassword = RandomGenerator.alphaNumeric(12);
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

  await api.functional.auth.adminUser.login(connection, {
    body: {
      email: adminEmail,
      password_hash: adminPassword,
    } satisfies IShoppingMallAdminUser.ILogin,
  });

  // 2. Create Product Category as Admin
  const categoryCode = RandomGenerator.alphaNumeric(6).toUpperCase();
  const categoryName = RandomGenerator.name(2);
  const category: IShoppingMallCategory =
    await api.functional.shoppingMall.adminUser.categories.create(connection, {
      body: {
        code: categoryCode,
        name: categoryName,
        status: "active",
        description: RandomGenerator.paragraph({ sentences: 5 }),
      } satisfies IShoppingMallCategory.ICreate,
    });
  typia.assert(category);

  // 3. Create Sales Channel as Admin
  const channelCode = RandomGenerator.alphaNumeric(5).toLowerCase();
  const channelName = RandomGenerator.name(2);
  const channel: IShoppingMallChannel =
    await api.functional.shoppingMall.adminUser.channels.create(connection, {
      body: {
        code: channelCode,
        name: channelName,
        status: "active",
        description: RandomGenerator.paragraph({ sentences: 3 }),
      } satisfies IShoppingMallChannel.ICreate,
    });
  typia.assert(channel);

  // 4. Seller User Join and Login
  const sellerEmail = typia.random<string & tags.Format<"email">>();
  const sellerPassword = RandomGenerator.alphaNumeric(12);
  const sellerUser: IShoppingMallSellerUser.IAuthorized =
    await api.functional.auth.sellerUser.join(connection, {
      body: {
        email: sellerEmail,
        password: sellerPassword,
        nickname: RandomGenerator.name(),
        full_name: RandomGenerator.name(),
        phone_number: null,
        business_registration_number:
          RandomGenerator.alphaNumeric(10).toUpperCase(),
      } satisfies IShoppingMallSellerUser.ICreate,
    });
  typia.assert(sellerUser);

  await api.functional.auth.sellerUser.login(connection, {
    body: {
      email: sellerEmail,
      password: sellerPassword,
    } satisfies IShoppingMallSellerUser.ILogin,
  });

  // 5. Create Sale Product as Seller User
  const saleCode = RandomGenerator.alphaNumeric(7).toUpperCase();
  const saleName = RandomGenerator.name(3);
  const saleDescription = RandomGenerator.content({
    paragraphs: 1,
    sentenceMin: 8,
    sentenceMax: 12,
  });
  const salePrice = RandomGenerator.alphaNumeric(4).length * 1000 + 10000;

  const saleProduct: IShoppingMallSale =
    await api.functional.shoppingMall.sellerUser.sales.create(connection, {
      body: {
        shopping_mall_channel_id: channel.id,
        shopping_mall_section_id: null,
        shopping_mall_seller_user_id: sellerUser.id,
        code: saleCode,
        status: "active",
        name: saleName,
        description: saleDescription,
        price: salePrice,
      } satisfies IShoppingMallSale.ICreate,
    });
  typia.assert(saleProduct);

  // 6. Create Sale Unit under the Sale Product
  const saleUnitCode = RandomGenerator.alphaNumeric(5).toUpperCase();
  const saleUnitName = RandomGenerator.name(2);
  const saleUnitDescription = RandomGenerator.paragraph({ sentences: 4 });

  const saleUnit: IShoppingMallSaleUnit =
    await api.functional.shoppingMall.sellerUser.sales.saleUnits.create(
      connection,
      {
        saleId: saleProduct.id,
        body: {
          shopping_mall_sale_id: saleProduct.id,
          code: saleUnitCode,
          name: saleUnitName,
          description: saleUnitDescription,
        } satisfies IShoppingMallSaleUnit.ICreate,
      },
    );
  typia.assert(saleUnit);

  // Validations
  TestValidator.equals(
    "sale unit's product id matches sale product id",
    saleUnit.shopping_mall_sale_id,
    saleProduct.id,
  );
  TestValidator.notEquals(
    "sale unit id must differ from sale product id",
    saleUnit.id,
    saleProduct.id,
  );
  TestValidator.predicate(
    "sale unit code is non-empty",
    saleUnit.code.length > 0,
  );
  TestValidator.predicate(
    "sale unit name is non-empty",
    saleUnit.name.length > 0,
  );
}
