import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallCategory } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCategory";
import type { IShoppingMallChannel } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallChannel";
import type { IShoppingMallInventory } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallInventory";
import type { IShoppingMallSale } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSale";
import type { IShoppingMallSaleUnit } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSaleUnit";
import type { IShoppingMallSaleUnitOption } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSaleUnitOption";
import type { IShoppingMallSellerUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSellerUser";

/**
 * End-to-end test validating the inventory detail retrieval API for a
 * seller user.
 *
 * The test performs the following steps:
 *
 * 1. Create and authenticate a new seller user.
 * 2. Create and authenticate a new admin user.
 * 3. Using the admin, create a sales channel.
 * 4. Using the admin, create a product category.
 * 5. Switch to the seller user authentication.
 * 6. Create a product sale in the created channel and category.
 * 7. Create sale units for the product.
 * 8. Create sale unit options for the sale units.
 * 9. Create inventory records linked to the product's option combinations.
 * 10. Fetch the inventory record by inventory ID and verify that returned data
 *     matches what was created.
 *
 * This comprehensive test ensures the inventory retrieval API works
 * end-to-end with real data and correct role-based access.
 */
export async function test_api_inventory_detail_seller_success_with_dependency(
  connection: api.IConnection,
) {
  // 1. Seller user join and authenticate
  const sellerUserCreateBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password: "Secret1234!",
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(2),
    phone_number: RandomGenerator.mobile(),
    business_registration_number: `BRN${RandomGenerator.alphaNumeric(7)}`,
  } satisfies IShoppingMallSellerUser.ICreate;
  const sellerUser: IShoppingMallSellerUser.IAuthorized =
    await api.functional.auth.sellerUser.join(connection, {
      body: sellerUserCreateBody,
    });
  typia.assert(sellerUser);

  // 2. Admin user join and authenticate
  const adminUserCreateBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password_hash: RandomGenerator.alphaNumeric(10),
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(2),
    status: "active",
  } satisfies IShoppingMallAdminUser.ICreate;
  const adminUser: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: adminUserCreateBody,
    });
  typia.assert(adminUser);

  // 3. Switch to admin user login
  const adminUserLoginBody: IShoppingMallAdminUser.ILogin = {
    email: adminUser.email,
    password_hash: adminUserCreateBody.password_hash,
  };
  await api.functional.auth.adminUser.login(connection, {
    body: adminUserLoginBody,
  });

  // 4. Create sales channel
  const channelCreateBody = {
    code: `channel_${RandomGenerator.alphaNumeric(6)}`,
    name: RandomGenerator.name(2),
    status: "active",
  } satisfies IShoppingMallChannel.ICreate;
  const channel: IShoppingMallChannel =
    await api.functional.shoppingMall.adminUser.channels.create(connection, {
      body: channelCreateBody,
    });
  typia.assert(channel);

  // 5. Create product category
  const categoryCreateBody = {
    code: `cat_${RandomGenerator.alphaNumeric(6)}`,
    name: RandomGenerator.name(2),
    status: "active",
  } satisfies IShoppingMallCategory.ICreate;
  const category: IShoppingMallCategory =
    await api.functional.shoppingMall.adminUser.categories.create(connection, {
      body: categoryCreateBody,
    });
  typia.assert(category);

  // 6. Switch back to seller user login
  const sellerUserLoginBody: IShoppingMallSellerUser.ILogin = {
    email: sellerUser.email,
    password: "Secret1234!",
  };
  await api.functional.auth.sellerUser.login(connection, {
    body: sellerUserLoginBody,
  });

  // 7. Create product sale
  const saleCreateBody = {
    shopping_mall_channel_id: channel.id,
    shopping_mall_section_id: null,
    shopping_mall_seller_user_id: sellerUser.id,
    code: `sale_${RandomGenerator.alphaNumeric(6)}`,
    status: "active",
    name: RandomGenerator.name(3),
    description: RandomGenerator.content({ paragraphs: 1 }),
    price: Math.round(Math.random() * 100000) / 100,
  } satisfies IShoppingMallSale.ICreate;
  const sale: IShoppingMallSale =
    await api.functional.shoppingMall.sellerUser.sales.create(connection, {
      body: saleCreateBody,
    });
  typia.assert(sale);

  // 8. Create sale units
  const saleUnitCreateBody = {
    shopping_mall_sale_id: sale.id,
    code: `unit_${RandomGenerator.alphaNumeric(6)}`,
    name: RandomGenerator.name(2),
    description: RandomGenerator.paragraph({ sentences: 5 }),
  } satisfies IShoppingMallSaleUnit.ICreate;
  const saleUnit: IShoppingMallSaleUnit =
    await api.functional.shoppingMall.sellerUser.sales.saleUnits.create(
      connection,
      {
        saleId: sale.id,
        body: saleUnitCreateBody,
      },
    );
  typia.assert(saleUnit);

  // 9. Create sale unit options
  // For `shopping_mall_sale_option_id`, as no dependency data is available,
  // use a generated UUID format random string satisfying the format requirement.
  const saleUnitOptionCreateBody = {
    shopping_mall_sale_unit_id: saleUnit.id,
    shopping_mall_sale_option_id: typia.random<string & tags.Format<"uuid">>(),
    additional_price: Math.round(Math.random() * 10000) / 100,
    stock_quantity: Math.floor(Math.random() * 1000),
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

  // 10. Create inventory record
  const optionCombinationCode = saleUnitOption.id;
  const inventoryCreateBody = {
    shopping_mall_sale_id: sale.id,
    option_combination_code: optionCombinationCode,
    stock_quantity: saleUnitOption.stock_quantity,
  } satisfies IShoppingMallInventory.ICreate;
  const inventory: IShoppingMallInventory =
    await api.functional.shoppingMall.sellerUser.inventory.create(connection, {
      body: inventoryCreateBody,
    });
  typia.assert(inventory);

  // 11. Retrieve inventory by ID
  const inventoryRetrieved: IShoppingMallInventory =
    await api.functional.shoppingMall.sellerUser.inventory.at(connection, {
      inventoryId: inventory.id,
    });
  typia.assert(inventoryRetrieved);

  // Validation
  TestValidator.equals(
    "Validates inventory ID",
    inventoryRetrieved.id,
    inventory.id,
  );
  TestValidator.equals(
    "Validates sale ID",
    inventoryRetrieved.shopping_mall_sale_id,
    sale.id,
  );
  TestValidator.equals(
    "Validates option combination code",
    inventoryRetrieved.option_combination_code,
    optionCombinationCode,
  );
  TestValidator.equals(
    "Validates stock quantity",
    inventoryRetrieved.stock_quantity,
    saleUnitOption.stock_quantity,
  );
}
