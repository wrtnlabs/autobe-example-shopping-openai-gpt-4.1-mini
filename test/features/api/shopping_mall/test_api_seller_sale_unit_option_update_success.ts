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
import type { IShoppingMallSaleUnitOption } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSaleUnitOption";
import type { IShoppingMallSellerUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSellerUser";

/**
 * This test validates the successful update of a sale unit option by a seller
 * user.
 *
 * The scenario includes:
 *
 * - Creating an admin user and authenticating to set up product category and
 *   sales channel.
 * - Creating and authenticating a seller user for product management.
 * - Creating a sale product, a sale unit, and a sale unit option.
 * - Updating the sale unit option's additional price and stock quantity.
 * - Verifying the update is properly reflected.
 */
export async function test_api_seller_sale_unit_option_update_success(
  connection: api.IConnection,
) {
  // 1. Admin user joins
  const adminUserEmail: string = typia.random<string & tags.Format<"email">>();
  const adminUserPassword: string = "StrongPass123!"; // fixed secure password
  const adminUser: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: {
        email: adminUserEmail,
        password_hash: adminUserPassword,
        nickname: RandomGenerator.name(),
        full_name: RandomGenerator.name(2),
        status: "active",
      } satisfies IShoppingMallAdminUser.ICreate,
    });
  typia.assert(adminUser);

  // 2. Admin user logs in to set authentication context
  await api.functional.auth.adminUser.login(connection, {
    body: {
      email: adminUserEmail,
      password_hash: adminUserPassword,
    } satisfies IShoppingMallAdminUser.ILogin,
  });

  // 3. Create product category
  const categoryCode = RandomGenerator.alphaNumeric(8);
  const categoryName = RandomGenerator.name(2);
  const category: IShoppingMallCategory =
    await api.functional.shoppingMall.adminUser.categories.create(connection, {
      body: {
        code: categoryCode,
        name: categoryName,
        status: "active",
      } satisfies IShoppingMallCategory.ICreate,
    });
  typia.assert(category);

  // 4. Create sales channel
  const channelCode = RandomGenerator.alphaNumeric(6);
  const channelName = RandomGenerator.name(2);
  const channel: IShoppingMallChannel =
    await api.functional.shoppingMall.adminUser.channels.create(connection, {
      body: {
        code: channelCode,
        name: channelName,
        status: "active",
      } satisfies IShoppingMallChannel.ICreate,
    });
  typia.assert(channel);

  // 5. Seller user joins
  const sellerUserEmail: string = typia.random<string & tags.Format<"email">>();
  const sellerUserPassword: string = "SellerPass123!"; // fixed secure password
  const sellerUser: IShoppingMallSellerUser.IAuthorized =
    await api.functional.auth.sellerUser.join(connection, {
      body: {
        email: sellerUserEmail,
        password: sellerUserPassword,
        nickname: RandomGenerator.name(),
        full_name: RandomGenerator.name(2),
        phone_number: null,
        business_registration_number: `BRN${RandomGenerator.alphaNumeric(9)}`,
      } satisfies IShoppingMallSellerUser.ICreate,
    });
  typia.assert(sellerUser);

  // 6. Seller user logs in
  await api.functional.auth.sellerUser.login(connection, {
    body: {
      email: sellerUserEmail,
      password: sellerUserPassword,
    } satisfies IShoppingMallSellerUser.ILogin,
  });

  // 7. Create sale product
  const saleProductCode = RandomGenerator.alphaNumeric(10);
  const saleProductName = RandomGenerator.name(3);
  const sale: IShoppingMallSale =
    await api.functional.shoppingMall.sellerUser.sales.create(connection, {
      body: {
        shopping_mall_channel_id: channel.id,
        shopping_mall_section_id: null,
        shopping_mall_seller_user_id: sellerUser.id,
        code: saleProductCode,
        status: "active",
        name: saleProductName,
        description: null,
        price: RandomGenerator.alphaNumeric(4).length + 1000,
      } satisfies IShoppingMallSale.ICreate,
    });
  typia.assert(sale);

  // 8. Create sale unit
  const saleUnitCode = RandomGenerator.alphaNumeric(8);
  const saleUnitName = RandomGenerator.name(2);
  const saleUnit: IShoppingMallSaleUnit =
    await api.functional.shoppingMall.sellerUser.sales.saleUnits.create(
      connection,
      {
        saleId: sale.id,
        body: {
          shopping_mall_sale_id: sale.id,
          code: saleUnitCode,
          name: saleUnitName,
          description: null,
        } satisfies IShoppingMallSaleUnit.ICreate,
      },
    );
  typia.assert(saleUnit);

  // 9. Create sale unit option
  const additionalPriceInitial = 100;
  const stockQuantityInitial = 50;

  const saleUnitOptionCreateBody = {
    shopping_mall_sale_unit_id: saleUnit.id,
    shopping_mall_sale_option_id: typia.random<string & tags.Format<"uuid">>(),
    additional_price: additionalPriceInitial,
    stock_quantity: stockQuantityInitial,
  } satisfies IShoppingMallSaleUnitOption.ICreate;
  const saleUnitOption: IShoppingMallSaleUnitOption =
    await api.functional.shoppingMall.sellerUser.sales.saleUnits.saleUnitOptions.create(
      connection,
      {
        saleId: sale.id,
        saleUnitId: saleUnit.id,
        body: saleUnitOptionCreateBody,
      },
    );
  typia.assert(saleUnitOption);

  // 10. Update sale unit option
  const updatedAdditionalPrice = additionalPriceInitial + 50;
  const updatedStockQuantity = stockQuantityInitial + 25;

  const updateBody = {
    additional_price: updatedAdditionalPrice,
    stock_quantity: updatedStockQuantity,
  } satisfies IShoppingMallSaleUnitOption.IUpdate;

  const updatedSaleUnitOption: IShoppingMallSaleUnitOption =
    await api.functional.shoppingMall.sellerUser.sales.saleUnits.saleUnitOptions.update(
      connection,
      {
        saleId: sale.id,
        saleUnitId: saleUnit.id,
        saleUnitOptionId: saleUnitOption.id,
        body: updateBody,
      },
    );
  typia.assert(updatedSaleUnitOption);

  // 11. Validate updated values
  TestValidator.equals(
    "additional_price updated correctly",
    updatedSaleUnitOption.additional_price,
    updatedAdditionalPrice,
  );
  TestValidator.equals(
    "stock_quantity updated correctly",
    updatedSaleUnitOption.stock_quantity,
    updatedStockQuantity,
  );
}
