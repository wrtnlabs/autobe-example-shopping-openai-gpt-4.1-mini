import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallSale } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSale";
import type { IShoppingMallSaleUnit } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSaleUnit";
import type { IShoppingMallSellerUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSellerUser";

/**
 * Validate the update process of a sale unit by an authenticated seller
 * user.
 *
 * This scenario covers the entire workflow:
 *
 * 1. Seller user creation and authentication
 * 2. Admin user creation and authentication (for unit creation)
 * 3. Sale product creation by seller user
 * 4. Sale unit creation by admin user under the created sale product
 * 5. Sale unit update by the authenticated seller user
 * 6. Validation of updated sale unit data
 *
 * Each step respects the business domain and data integrity rules. The test
 * ensures role-based authentication switching is correctly handled. All
 * random data is generated respecting DTO constraints and business rules.
 *
 * The update operation is verified by asserting the response matches the
 * update request and contains consistent identifiers.
 */
export async function test_api_sales_sale_unit_update_seller_success(
  connection: api.IConnection,
) {
  // 1. Create seller user and authenticate
  const sellerCreateBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password: RandomGenerator.alphaNumeric(12),
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(2),
    phone_number: RandomGenerator.mobile(),
    business_registration_number: `BRN${RandomGenerator.alphaNumeric(9).toUpperCase()}`,
  } satisfies IShoppingMallSellerUser.ICreate;
  const seller: IShoppingMallSellerUser.IAuthorized =
    await api.functional.auth.sellerUser.join(connection, {
      body: sellerCreateBody,
    });
  typia.assert(seller);

  // 2. Create admin user and authenticate
  const adminCreateBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password_hash: RandomGenerator.alphaNumeric(20),
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(2),
    status: "active",
  } satisfies IShoppingMallAdminUser.ICreate;
  const admin: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: adminCreateBody,
    });
  typia.assert(admin);

  // 3. Authenticate as seller user
  await api.functional.auth.sellerUser.login(connection, {
    body: {
      email: sellerCreateBody.email,
      password: sellerCreateBody.password,
    } satisfies IShoppingMallSellerUser.ILogin,
  });

  // 4. Create sale product by seller
  const saleCreateBody = {
    shopping_mall_channel_id: typia.random<string & tags.Format<"uuid">>(),
    shopping_mall_section_id: null,
    shopping_mall_seller_user_id: seller.id,
    code: RandomGenerator.alphaNumeric(6).toUpperCase(),
    status: "active",
    name: RandomGenerator.paragraph({ sentences: 3, wordMin: 5, wordMax: 10 }),
    description: RandomGenerator.content({
      paragraphs: 2,
      sentenceMin: 8,
      sentenceMax: 12,
      wordMin: 4,
      wordMax: 7,
    }),
    price: 10000,
  } satisfies IShoppingMallSale.ICreate;
  const sale: IShoppingMallSale =
    await api.functional.shoppingMall.sellerUser.sales.create(connection, {
      body: saleCreateBody,
    });
  typia.assert(sale);

  // 5. Authenticate as admin user for sale unit creation
  await api.functional.auth.adminUser.login(connection, {
    body: {
      email: adminCreateBody.email,
      password_hash: adminCreateBody.password_hash,
    } satisfies IShoppingMallAdminUser.ILogin,
  });

  // 6. Create sale unit by admin user
  const saleUnitCreateBody = {
    shopping_mall_sale_id: sale.id,
    code: RandomGenerator.alphaNumeric(4).toUpperCase(),
    name: RandomGenerator.name(2),
    description: RandomGenerator.paragraph({ sentences: 5 }),
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

  // 7. Re-authenticate as seller user for updating sale unit
  await api.functional.auth.sellerUser.login(connection, {
    body: {
      email: sellerCreateBody.email,
      password: sellerCreateBody.password,
    } satisfies IShoppingMallSellerUser.ILogin,
  });

  // 8. Update sale unit with new data
  const saleUnitUpdateBody = {
    shopping_mall_sale_id: sale.id,
    code: RandomGenerator.alphaNumeric(4).toUpperCase(),
    name: RandomGenerator.name(3),
    description: RandomGenerator.paragraph({ sentences: 7 }),
  } satisfies IShoppingMallSaleUnit.IUpdate;
  const updatedSaleUnit: IShoppingMallSaleUnit =
    await api.functional.shoppingMall.sellerUser.sales.saleUnits.update(
      connection,
      {
        saleId: sale.id,
        saleUnitId: saleUnit.id,
        body: saleUnitUpdateBody,
      },
    );
  typia.assert(updatedSaleUnit);

  // 9. Assert updated values match the update request and IDs are consistent
  TestValidator.equals("sale unit ids", updatedSaleUnit.id, saleUnit.id);
  TestValidator.equals(
    "sale unit product ids",
    updatedSaleUnit.shopping_mall_sale_id,
    sale.id,
  );
  TestValidator.equals(
    "update sale unit code",
    updatedSaleUnit.code,
    saleUnitUpdateBody.code,
  );
  TestValidator.equals(
    "update sale unit name",
    updatedSaleUnit.name,
    saleUnitUpdateBody.name,
  );
  TestValidator.equals(
    "update sale unit description",
    updatedSaleUnit.description,
    saleUnitUpdateBody.description,
  );
}
