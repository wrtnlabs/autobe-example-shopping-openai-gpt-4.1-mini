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
 * This test function performs a comprehensive end-to-end validation of
 * inventory detail retrieval within the shopping mall system by an admin user.
 * It involves multi-role authentication and a full dependency chain creation
 * sequence ensuring realistic business interactions.
 *
 * The scenario includes:
 *
 * 1. Admin user creation and authentication
 * 2. Admin creates a channel
 * 3. Admin creates a category
 * 4. Seller user creation and authentication
 * 5. Seller creates a sale product associated with the channel and category
 * 6. Seller creates sale units for the product
 * 7. Seller creates sale unit options for each unit
 * 8. Admin creates inventory for the specific option combination
 * 9. Admin retrieves the inventory detail by ID
 *
 * Each step performs strict typia assertions for response validation and uses
 * TestValidator to verify entity relationships and logical correctness. Role
 * switching is handled via explicit authentication calls ensuring proper
 * authorization contexts for API invocations.
 */
export async function test_api_inventory_detail_success_with_dependency(
  connection: api.IConnection,
) {
  // 1. Admin user creation
  const adminUserEmail = typia.random<string & tags.Format<"email">>();
  const adminUserPassword = RandomGenerator.alphabets(10);

  const adminUser: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: {
        email: adminUserEmail,
        password_hash: adminUserPassword,
        nickname: RandomGenerator.name(),
        full_name: RandomGenerator.name(),
        status: "active",
      } satisfies IShoppingMallAdminUser.ICreate,
    });
  typia.assert(adminUser);

  // 2. Admin creates a sales channel
  const channelCode = RandomGenerator.alphaNumeric(8);
  const channelName = RandomGenerator.name();
  const channelDescription = RandomGenerator.paragraph({ sentences: 3 });

  const channel: IShoppingMallChannel =
    await api.functional.shoppingMall.adminUser.channels.create(connection, {
      body: {
        code: channelCode,
        name: channelName,
        description: channelDescription,
        status: "active",
      } satisfies IShoppingMallChannel.ICreate,
    });
  typia.assert(channel);

  // 3. Admin creates a category
  const categoryCode = RandomGenerator.alphaNumeric(8);
  const categoryName = RandomGenerator.name();
  const categoryDescription = RandomGenerator.paragraph({ sentences: 4 });

  const category: IShoppingMallCategory =
    await api.functional.shoppingMall.adminUser.categories.create(connection, {
      body: {
        code: categoryCode,
        name: categoryName,
        status: "active",
        description: categoryDescription,
      } satisfies IShoppingMallCategory.ICreate,
    });
  typia.assert(category);

  // 4. Seller user creation
  const sellerUserEmail = typia.random<string & tags.Format<"email">>();
  const sellerUserPassword = RandomGenerator.alphabets(10);

  const sellerUser: IShoppingMallSellerUser.IAuthorized =
    await api.functional.auth.sellerUser.join(connection, {
      body: {
        email: sellerUserEmail,
        password: sellerUserPassword,
        nickname: RandomGenerator.name(),
        full_name: RandomGenerator.name(),
        phone_number: null,
        business_registration_number: RandomGenerator.alphaNumeric(12),
      } satisfies IShoppingMallSellerUser.ICreate,
    });
  typia.assert(sellerUser);

  // 5. Seller user login to switch auth context
  await api.functional.auth.sellerUser.login(connection, {
    body: {
      email: sellerUserEmail,
      password: sellerUserPassword,
    } satisfies IShoppingMallSellerUser.ILogin,
  });

  // 6. Seller creates a sale product
  const saleProductCode = RandomGenerator.alphaNumeric(12);
  const saleProductName = RandomGenerator.name();
  const saleProductDescription = RandomGenerator.paragraph({ sentences: 5 });

  const saleProduct: IShoppingMallSale =
    await api.functional.shoppingMall.sellerUser.sales.create(connection, {
      body: {
        shopping_mall_channel_id: channel.id,
        shopping_mall_section_id: null,
        shopping_mall_seller_user_id: sellerUser.id,
        code: saleProductCode,
        status: "active",
        name: saleProductName,
        description: saleProductDescription,
        price: 10000,
      } satisfies IShoppingMallSale.ICreate,
    });
  typia.assert(saleProduct);

  // 7. Create sale units for the product
  const saleUnits: IShoppingMallSaleUnit[] = [];
  for (let i = 0; i < 2; i++) {
    const saleUnitCode = RandomGenerator.alphaNumeric(8);
    const saleUnitName = RandomGenerator.name();

    const saleUnit: IShoppingMallSaleUnit =
      await api.functional.shoppingMall.sellerUser.sales.saleUnits.create(
        connection,
        {
          saleId: saleProduct.id,
          body: {
            shopping_mall_sale_id: saleProduct.id,
            code: saleUnitCode,
            name: saleUnitName,
            description: null,
          } satisfies IShoppingMallSaleUnit.ICreate,
        },
      );
    typia.assert(saleUnit);
    saleUnits.push(saleUnit);
  }

  // 8. Create sale unit options for each unit
  const saleUnitOptions: IShoppingMallSaleUnitOption[] = [];
  for (const saleUnit of saleUnits) {
    const optionCount = RandomGenerator.pick([1, 2] as const);
    for (let j = 0; j < optionCount; j++) {
      // As sale options API is not provided, generate random UUID for sale option ID
      const saleUnitOption: IShoppingMallSaleUnitOption =
        await api.functional.shoppingMall.sellerUser.sales.saleUnits.saleUnitOptions.create(
          connection,
          {
            saleId: saleProduct.id,
            saleUnitId: saleUnit.id,
            body: {
              shopping_mall_sale_unit_id: saleUnit.id,
              shopping_mall_sale_option_id: typia.random<
                string & tags.Format<"uuid">
              >(),
              additional_price: 1000 * (j + 1),
              stock_quantity: 10 * (j + 1),
            } satisfies IShoppingMallSaleUnitOption.ICreate,
          },
        );
      typia.assert(saleUnitOption);
      saleUnitOptions.push(saleUnitOption);
    }
  }

  // 9. Switch back to admin authentication
  await api.functional.auth.adminUser.login(connection, {
    body: {
      email: adminUserEmail,
      password_hash: adminUserPassword,
    } satisfies IShoppingMallAdminUser.ILogin,
  });

  // 10. Create inventory record for combined option code
  const optionCombinationCode = saleUnitOptions.map((opt) => opt.id).join(":");

  const inventoryInputBody = {
    shopping_mall_sale_id: saleProduct.id,
    option_combination_code: optionCombinationCode,
    stock_quantity: 100,
  } satisfies IShoppingMallInventory.ICreate;

  const inventory: IShoppingMallInventory =
    await api.functional.shoppingMall.adminUser.inventory.create(connection, {
      body: inventoryInputBody,
    });
  typia.assert(inventory);

  // 11. Retrieve inventory detail
  const loadedInventory: IShoppingMallInventory =
    await api.functional.shoppingMall.adminUser.inventory.at(connection, {
      inventoryId: inventory.id,
    });
  typia.assert(loadedInventory);

  // 12. Validate retrieved inventory
  TestValidator.equals("inventory ID", loadedInventory.id, inventory.id);
  TestValidator.equals(
    "inventory product ID",
    loadedInventory.shopping_mall_sale_id,
    saleProduct.id,
  );
  TestValidator.equals(
    "inventory option combination code",
    loadedInventory.option_combination_code,
    optionCombinationCode,
  );
  TestValidator.equals(
    "inventory stock quantity",
    loadedInventory.stock_quantity,
    100,
  );
}
