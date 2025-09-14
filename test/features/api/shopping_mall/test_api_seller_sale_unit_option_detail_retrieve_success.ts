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
 * Test scenario for successful retrieval of the sale unit option detail by
 * a seller user.
 *
 * This E2E test covers the entire workflow:
 *
 * 1. Create an admin user and authenticate to set the context for creating a
 *    product category and sales channel.
 * 2. Create a product category as admin.
 * 3. Create a sales channel as admin.
 * 4. Create a seller user and authenticate.
 * 5. Create a sale product associated with the created channel, category and
 *    seller.
 * 6. Create a sale unit for the sale product.
 * 7. Create a sale unit option for the sale unit with specified additional
 *    price and stock quantity.
 * 8. Retrieve the detail of the created sale unit option.
 * 9. Validate that the retrieved sale unit option matches exactly the created
 *    option including price and stock quantity.
 *
 * This test ensures that authentication flows, resource creation, and
 * retrieval through seller user role are working correctly.
 */
export async function test_api_seller_sale_unit_option_detail_retrieve_success(
  connection: api.IConnection,
) {
  // 1. Admin user join
  const adminUserEmail: string = typia.random<string & tags.Format<"email">>();
  const adminUserPassword = adminUserEmail.split("@")[0] + "1234"; // simple password
  const adminUser: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: {
        email: adminUserEmail,
        password_hash: adminUserPassword,
        nickname: RandomGenerator.name(1),
        full_name: RandomGenerator.name(2),
        status: "active",
      } satisfies IShoppingMallAdminUser.ICreate,
    });
  typia.assert(adminUser);

  // 2. Admin creates a product category
  const category: IShoppingMallCategory =
    await api.functional.shoppingMall.adminUser.categories.create(connection, {
      body: {
        code: RandomGenerator.alphaNumeric(5).toLowerCase(),
        name: RandomGenerator.name(1),
        status: "active",
        description: RandomGenerator.paragraph({ sentences: 3 }),
      } satisfies IShoppingMallCategory.ICreate,
    });
  typia.assert(category);

  // 3. Admin creates a sales channel
  const channelCode = RandomGenerator.alphaNumeric(5).toLowerCase();
  const channel: IShoppingMallChannel =
    await api.functional.shoppingMall.adminUser.channels.create(connection, {
      body: {
        code: channelCode,
        name: RandomGenerator.name(1),
        status: "active",
        description: RandomGenerator.paragraph({ sentences: 2 }),
      } satisfies IShoppingMallChannel.ICreate,
    });
  typia.assert(channel);

  // 4. Seller user join
  const sellerUserEmail: string = typia.random<string & tags.Format<"email">>();
  const sellerUserPassword = sellerUserEmail.split("@")[0] + "1234";
  const sellerUser: IShoppingMallSellerUser.IAuthorized =
    await api.functional.auth.sellerUser.join(connection, {
      body: {
        email: sellerUserEmail,
        password: sellerUserPassword,
        nickname: RandomGenerator.name(1),
        full_name: RandomGenerator.name(2),
        phone_number: null,
        business_registration_number:
          RandomGenerator.alphaNumeric(10).toUpperCase(),
      } satisfies IShoppingMallSellerUser.ICreate,
    });
  typia.assert(sellerUser);

  // 5. Seller user creates a sale product
  const sale: IShoppingMallSale =
    await api.functional.shoppingMall.sellerUser.sales.create(connection, {
      body: {
        shopping_mall_channel_id: channel.id,
        shopping_mall_section_id: null,
        shopping_mall_seller_user_id: sellerUser.id,
        code: RandomGenerator.alphaNumeric(10).toUpperCase(),
        status: "active",
        name: RandomGenerator.name(2),
        description: RandomGenerator.content({ paragraphs: 2 }),
        price: Number((Math.random() * 1000 + 100).toFixed(2)),
      } satisfies IShoppingMallSale.ICreate,
    });
  typia.assert(sale);

  // 6. Seller user creates a sale unit for the sale product
  const saleUnit: IShoppingMallSaleUnit =
    await api.functional.shoppingMall.sellerUser.sales.saleUnits.create(
      connection,
      {
        saleId: sale.id,
        body: {
          shopping_mall_sale_id: sale.id,
          code: RandomGenerator.alphaNumeric(8).toUpperCase(),
          name: RandomGenerator.name(1),
          description: RandomGenerator.paragraph({ sentences: 2 }),
        } satisfies IShoppingMallSaleUnit.ICreate,
      },
    );
  typia.assert(saleUnit);

  // 7. Seller user creates a sale unit option for the sale unit
  const additionalPrice = Number((Math.random() * 200).toFixed(2));
  const stockQuantity = RandomGenerator.sample([10, 20, 30, 40, 50], 1)[0];

  const saleUnitOption: IShoppingMallSaleUnitOption =
    await api.functional.shoppingMall.sellerUser.sales.saleUnits.saleUnitOptions.create(
      connection,
      {
        saleId: sale.id,
        saleUnitId: saleUnit.id,
        body: {
          shopping_mall_sale_unit_id: saleUnit.id,
          shopping_mall_sale_option_id: typia.random<
            string & tags.Format<"uuid">
          >(),
          additional_price: additionalPrice,
          stock_quantity: stockQuantity,
        } satisfies IShoppingMallSaleUnitOption.ICreate,
      },
    );
  typia.assert(saleUnitOption);

  // 8. Seller user retrieves the detail of the created sale unit option
  const retrieved: IShoppingMallSaleUnitOption =
    await api.functional.shoppingMall.sellerUser.sales.saleUnits.saleUnitOptions.at(
      connection,
      {
        saleId: sale.id,
        saleUnitId: saleUnit.id,
        saleUnitOptionId: saleUnitOption.id,
      },
    );
  typia.assert(retrieved);

  // 9. Validate the retrieved detail matches the created values
  TestValidator.equals(
    "Sale unit option ID should match",
    retrieved.id,
    saleUnitOption.id,
  );
  TestValidator.equals(
    "Sale unit option's sale unit ID should match",
    retrieved.shopping_mall_sale_unit_id,
    saleUnitOption.shopping_mall_sale_unit_id,
  );
  TestValidator.equals(
    "Sale unit option's sale option ID should match",
    retrieved.shopping_mall_sale_option_id,
    saleUnitOption.shopping_mall_sale_option_id,
  );
  TestValidator.equals(
    "Sale unit option additional price should match",
    retrieved.additional_price,
    saleUnitOption.additional_price,
  );
  TestValidator.equals(
    "Sale unit option stock quantity should match",
    retrieved.stock_quantity,
    saleUnitOption.stock_quantity,
  );
}
