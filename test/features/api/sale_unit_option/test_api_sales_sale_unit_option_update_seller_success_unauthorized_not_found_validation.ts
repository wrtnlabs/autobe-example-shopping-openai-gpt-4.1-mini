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
 * This E2E test validates the update operation for a sale unit option resource
 * in a shopping mall system by an authenticated seller user.
 *
 * The complete test scenario includes the following steps:
 *
 * 1. Admin user creation and authentication for category setup.
 * 2. Product category creation by the admin user.
 * 3. Seller user creation and authentication.
 * 4. Creation of a sale product by the authenticated seller.
 * 5. Creation of a sale unit under the sale product.
 * 6. Creation of a sale unit option under the sale unit.
 * 7. Successful update of the sale unit option's additional price and stock
 *    quantity.
 * 8. Verification that the update is correctly persisted.
 * 9. Testing unauthorized update attempt and ensuring failure.
 * 10. Testing update errors due to invalid IDs or mismatched identifiers.
 *
 * Each step involves type safety checks using typia.assert and validation
 * assertions via TestValidator utility functions.
 *
 * This test ensures correctness of nested resource updates, multi-actor role
 * handling, and proper error handling for invalid operations.
 */
export async function test_api_sales_sale_unit_option_update_seller_success_unauthorized_not_found_validation(
  connection: api.IConnection,
) {
  // 1. Admin user creation and login
  const adminUserEmail = typia.random<string & tags.Format<"email">>();
  const adminUserPassword = RandomGenerator.alphaNumeric(8);
  const adminUserJoinRequest = {
    email: adminUserEmail,
    password_hash: adminUserPassword,
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(2),
    status: "active",
  } satisfies IShoppingMallAdminUser.ICreate;
  const adminUser: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: adminUserJoinRequest,
    });
  typia.assert(adminUser);

  await api.functional.auth.adminUser.login(connection, {
    body: {
      email: adminUserEmail,
      password_hash: adminUserPassword,
    } satisfies IShoppingMallAdminUser.ILogin,
  });

  // 2. Create product category by admin
  const categoryCreateRequest = {
    code: RandomGenerator.alphaNumeric(5).toUpperCase(),
    name: RandomGenerator.name(2),
    status: "active",
    description: RandomGenerator.paragraph({ sentences: 5 }),
  } satisfies IShoppingMallCategory.ICreate;
  const category: IShoppingMallCategory =
    await api.functional.shoppingMall.adminUser.categories.create(connection, {
      body: categoryCreateRequest,
    });
  typia.assert(category);

  // 3. Seller user creation and authentication
  const sellerEmail = typia.random<string & tags.Format<"email">>();
  const sellerPassword = RandomGenerator.alphaNumeric(8);
  const sellerUserJoinRequest = {
    email: sellerEmail,
    password: sellerPassword,
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(2),
    business_registration_number:
      RandomGenerator.alphaNumeric(10).toUpperCase(),
  } satisfies IShoppingMallSellerUser.ICreate;
  const sellerUser: IShoppingMallSellerUser.IAuthorized =
    await api.functional.auth.sellerUser.join(connection, {
      body: sellerUserJoinRequest,
    });
  typia.assert(sellerUser);

  await api.functional.auth.sellerUser.login(connection, {
    body: {
      email: sellerEmail,
      password: sellerPassword,
    } satisfies IShoppingMallSellerUser.ILogin,
  });

  // 4. Seller creates a sale product
  const saleCreateRequest = {
    shopping_mall_channel_id: typia.random<string & tags.Format<"uuid">>(),
    shopping_mall_section_id: null,
    shopping_mall_seller_user_id: sellerUser.id,
    code: RandomGenerator.alphaNumeric(8).toUpperCase(),
    status: "active",
    name: RandomGenerator.name(3),
    description: RandomGenerator.paragraph({ sentences: 10 }),
    price: 10000,
  } satisfies IShoppingMallSale.ICreate;
  const sale: IShoppingMallSale =
    await api.functional.shoppingMall.sellerUser.sales.create(connection, {
      body: saleCreateRequest,
    });
  typia.assert(sale);

  // 5. Create a sale unit for the sale product
  const saleUnitCreateRequest = {
    shopping_mall_sale_id: sale.id,
    code: RandomGenerator.alphaNumeric(6).toUpperCase(),
    name: RandomGenerator.name(2),
    description: RandomGenerator.paragraph({ sentences: 4 }),
  } satisfies IShoppingMallSaleUnit.ICreate;
  const saleUnit: IShoppingMallSaleUnit =
    await api.functional.shoppingMall.sellerUser.sales.saleUnits.create(
      connection,
      { saleId: sale.id, body: saleUnitCreateRequest },
    );
  typia.assert(saleUnit);

  // 6. Create a sale unit option for the sale unit
  const saleUnitOptionCreateRequest = {
    shopping_mall_sale_unit_id: saleUnit.id,
    shopping_mall_sale_option_id: typia.random<string & tags.Format<"uuid">>(),
    additional_price: 1000,
    stock_quantity: 99,
  } satisfies IShoppingMallSaleUnitOption.ICreate;
  const saleUnitOption: IShoppingMallSaleUnitOption =
    await api.functional.shoppingMall.sellerUser.sales.saleUnits.saleUnitOptions.create(
      connection,
      {
        saleId: sale.id,
        saleUnitId: saleUnit.id,
        body: saleUnitOptionCreateRequest,
      },
    );
  typia.assert(saleUnitOption);

  // 7. Successful update of sale unit option's additional price and stock quantity
  const saleUnitOptionUpdateRequest = {
    additional_price: 1500,
    stock_quantity: 88,
  } satisfies IShoppingMallSaleUnitOption.IUpdate;
  const updatedSaleUnitOption: IShoppingMallSaleUnitOption =
    await api.functional.shoppingMall.sellerUser.sales.saleUnits.saleUnitOptions.update(
      connection,
      {
        saleId: sale.id,
        saleUnitId: saleUnit.id,
        saleUnitOptionId: saleUnitOption.id,
        body: saleUnitOptionUpdateRequest,
      },
    );
  typia.assert(updatedSaleUnitOption);
  TestValidator.equals(
    "Updated additional price",
    updatedSaleUnitOption.additional_price,
    saleUnitOptionUpdateRequest.additional_price,
  );
  TestValidator.equals(
    "Updated stock quantity",
    updatedSaleUnitOption.stock_quantity,
    saleUnitOptionUpdateRequest.stock_quantity,
  );

  // 8. Verify unauthorized update attempt fails
  const unauthConnection: api.IConnection = { ...connection, headers: {} };

  await TestValidator.error(
    "Unauthorized update should have failed",
    async () => {
      await api.functional.shoppingMall.sellerUser.sales.saleUnits.saleUnitOptions.update(
        unauthConnection,
        {
          saleId: sale.id,
          saleUnitId: saleUnit.id,
          saleUnitOptionId: saleUnitOption.id,
          body: { additional_price: 123, stock_quantity: 10 },
        },
      );
    },
  );

  // 9. Verify error on invalid saleUnitOptionId
  await TestValidator.error(
    "Update with invalid saleUnitOptionId should fail",
    async () => {
      await api.functional.shoppingMall.sellerUser.sales.saleUnits.saleUnitOptions.update(
        connection,
        {
          saleId: sale.id,
          saleUnitId: saleUnit.id,
          saleUnitOptionId: typia.random<string & tags.Format<"uuid">>(),
          body: { additional_price: 123, stock_quantity: 10 },
        },
      );
    },
  );

  // 10. Verify error on mismatched saleId
  await TestValidator.error(
    "Update with mismatched saleId should fail",
    async () => {
      await api.functional.shoppingMall.sellerUser.sales.saleUnits.saleUnitOptions.update(
        connection,
        {
          saleId: typia.random<string & tags.Format<"uuid">>(),
          saleUnitId: saleUnit.id,
          saleUnitOptionId: saleUnitOption.id,
          body: { additional_price: 123, stock_quantity: 10 },
        },
      );
    },
  );

  // 11. Verify error on mismatched saleUnitId
  await TestValidator.error(
    "Update with mismatched saleUnitId should fail",
    async () => {
      await api.functional.shoppingMall.sellerUser.sales.saleUnits.saleUnitOptions.update(
        connection,
        {
          saleId: sale.id,
          saleUnitId: typia.random<string & tags.Format<"uuid">>(),
          saleUnitOptionId: saleUnitOption.id,
          body: { additional_price: 123, stock_quantity: 10 },
        },
      );
    },
  );
}
