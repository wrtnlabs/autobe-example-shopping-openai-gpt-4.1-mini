import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallCategory } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCategory";
import type { IShoppingMallSale } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSale";
import type { IShoppingMallSaleUnit } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSaleUnit";
import type { IShoppingMallSaleUnitOption } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSaleUnitOption";
import type { IShoppingMallSellerUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSellerUser";

/**
 * Test suite for sale unit option creation by admin user.
 *
 * This test covers the following steps:
 *
 * 1. Create an admin user and authenticate.
 * 2. Create a product category using the admin user.
 * 3. Create a seller user and authenticate.
 * 4. Create a sale product by the seller user.
 * 5. Create a sale unit under the sale product.
 * 6. Create a sale unit option under the sale unit by admin user.
 * 7. Verify correct properties are returned and match the inputs.
 * 8. Test unauthorized scenarios with missing/invalid admin auth for sale unit
 *    option creation.
 * 9. Test failure scenarios with invalid references or missing fields leading
 *    to errors.
 *
 * Each step includes typia.assert calls to validate types and TestValidator
 * assertions to validate business logic and access control behaviors.
 */
export async function test_api_sales_sale_unit_option_create_admin_success_unauthorized_validation(
  connection: api.IConnection,
) {
  // 1. Create admin user with join and receive authorization
  const adminCreateBody = {
    email: RandomGenerator.alphaNumeric(10) + "@example.com",
    password_hash: RandomGenerator.alphaNumeric(16),
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(),
    status: "active",
  } satisfies IShoppingMallAdminUser.ICreate;
  const adminUser: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: adminCreateBody,
    });
  typia.assert(adminUser);

  // 2. Create product category with admin user authentication
  const categoryCreateBody = {
    code: RandomGenerator.alphaNumeric(6),
    name: RandomGenerator.name(),
    status: "active",
    description: RandomGenerator.paragraph({ sentences: 3 }),
  } satisfies IShoppingMallCategory.ICreate;
  const category: IShoppingMallCategory =
    await api.functional.shoppingMall.adminUser.categories.create(connection, {
      body: categoryCreateBody,
    });
  typia.assert(category);

  // Switch to seller user for seller operations
  // 3. Seller user creation and auth
  const sellerCreateBody = {
    email: RandomGenerator.alphaNumeric(10) + "@example.com",
    password: RandomGenerator.alphaNumeric(16),
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(),
    business_registration_number: RandomGenerator.alphaNumeric(12),
  } satisfies IShoppingMallSellerUser.ICreate;
  const sellerUser: IShoppingMallSellerUser.IAuthorized =
    await api.functional.auth.sellerUser.join(connection, {
      body: sellerCreateBody,
    });
  typia.assert(sellerUser);

  // 4. Seller creates a sale product
  const saleCreateBody = {
    shopping_mall_channel_id: typia.random<string & tags.Format<"uuid">>(),
    shopping_mall_section_id: null,
    shopping_mall_seller_user_id: sellerUser.id,
    code: RandomGenerator.alphaNumeric(8),
    status: "active",
    name: RandomGenerator.name(),
    description: RandomGenerator.paragraph({ sentences: 10 }),
    price: (Math.floor(typia.random<number>()) % 10000) + 100,
  } satisfies IShoppingMallSale.ICreate;
  const saleProduct: IShoppingMallSale =
    await api.functional.shoppingMall.sellerUser.sales.create(connection, {
      body: saleCreateBody,
    });
  typia.assert(saleProduct);

  // 5. Seller creates a sale unit under this sale
  const saleUnitCreateBody = {
    shopping_mall_sale_id: saleProduct.id,
    code: RandomGenerator.alphaNumeric(4).toLowerCase(),
    name: RandomGenerator.name(),
    description: RandomGenerator.paragraph({ sentences: 4 }),
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

  // Switch back to admin user to create sale unit option
  await api.functional.auth.adminUser.login(connection, {
    body: {
      email: adminCreateBody.email,
      password_hash: adminCreateBody.password_hash,
    } satisfies IShoppingMallAdminUser.ILogin,
  });

  // 6. Admin creates a sale unit option under sale unit
  const optionCreateBody = {
    shopping_mall_sale_unit_id: saleUnit.id,
    shopping_mall_sale_option_id: typia.random<string & tags.Format<"uuid">>(),
    additional_price: (Math.floor(typia.random<number>()) % 1000) + 10,
    stock_quantity: 100,
  } satisfies IShoppingMallSaleUnitOption.ICreate;
  const createdOption: IShoppingMallSaleUnitOption =
    await api.functional.shoppingMall.adminUser.sales.saleUnits.saleUnitOptions.create(
      connection,
      {
        saleId: saleProduct.id,
        saleUnitId: saleUnit.id,
        body: optionCreateBody,
      },
    );
  typia.assert(createdOption);

  TestValidator.equals(
    "additional_price matches input",
    createdOption.additional_price,
    optionCreateBody.additional_price,
  );
  TestValidator.equals(
    "stock_quantity matches input",
    createdOption.stock_quantity,
    optionCreateBody.stock_quantity,
  );

  // 7. Test unauthorized access: no admin auth
  const unauthConn: api.IConnection = { ...connection, headers: {} };

  await TestValidator.error(
    "unauthorized sale unit option creation should fail",
    async () => {
      await api.functional.shoppingMall.adminUser.sales.saleUnits.saleUnitOptions.create(
        unauthConn,
        {
          saleId: saleProduct.id,
          saleUnitId: saleUnit.id,
          body: optionCreateBody,
        },
      );
    },
  );

  // 8. Test unauthorized access: adminUser logged out (simulate by logging in seller only)
  await api.functional.auth.sellerUser.login(connection, {
    body: {
      email: sellerCreateBody.email,
      password: sellerCreateBody.password,
    } satisfies IShoppingMallSellerUser.ILogin,
  });
  await TestValidator.error(
    "non-admin user cannot create sale unit option",
    async () => {
      await api.functional.shoppingMall.adminUser.sales.saleUnits.saleUnitOptions.create(
        connection,
        {
          saleId: saleProduct.id,
          saleUnitId: saleUnit.id,
          body: optionCreateBody,
        },
      );
    },
  );

  // 9. Test error: invalid saleUnitId (random UUID not existing)
  await api.functional.auth.adminUser.login(connection, {
    body: {
      email: adminCreateBody.email,
      password_hash: adminCreateBody.password_hash,
    } satisfies IShoppingMallAdminUser.ILogin,
  });

  await TestValidator.error(
    "creation fails with invalid saleUnitId",
    async () => {
      await api.functional.shoppingMall.adminUser.sales.saleUnits.saleUnitOptions.create(
        connection,
        {
          saleId: saleProduct.id,
          saleUnitId: typia.random<string & tags.Format<"uuid">>(),
          body: optionCreateBody,
        },
      );
    },
  );

  // 10. Test error: missing required fields - this is not possible in TS strictly, so skip
}
