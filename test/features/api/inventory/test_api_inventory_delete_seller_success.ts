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
import type { IShoppingMallSaleOption } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSaleOption";
import type { IShoppingMallSaleOptionGroup } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSaleOptionGroup";
import type { IShoppingMallSaleUnit } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSaleUnit";
import type { IShoppingMallSaleUnitOption } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSaleUnitOption";
import type { IShoppingMallSellerUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSellerUser";

/**
 * Validate the deletion of an inventory record by seller user.
 *
 * This test performs the entire prerequisite chain:
 *
 * 1. Admin user creation and login
 * 2. Creation of sales channel and product category by admin
 * 3. Seller user creation and authentication
 * 4. Creation of product sale by seller user
 * 5. Creation of sale unit under product sale
 * 6. Creation of sale option group by seller user
 * 7. Creation of sale option under the option group
 * 8. Creation of sale unit option with stock and additional price
 * 9. Creation of inventory record associated with sale unit option
 * 10. Seller user deletes the created inventory record successfully
 * 11. Another seller user attempts to delete the same inventory record and
 *     fails
 *
 * This test validates proper authorization and business logic for the
 * delete operation, ensuring only the owner seller user can delete their
 * inventory records.
 */
export async function test_api_inventory_delete_seller_success(
  connection: api.IConnection,
) {
  // 1. Admin user creation and login
  const adminEmail = typia.random<string & tags.Format<"email">>();
  const adminPassword = "admin1234";
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

  // 2. Admin creates sales channel
  const channelCode = RandomGenerator.alphaNumeric(8);
  const channelName = RandomGenerator.name();
  const channel: IShoppingMallChannel =
    await api.functional.shoppingMall.adminUser.channels.create(connection, {
      body: {
        code: channelCode,
        name: channelName,
        status: "active",
      } satisfies IShoppingMallChannel.ICreate,
    });
  typia.assert(channel);

  // 3. Admin creates product category
  const categoryCode = RandomGenerator.alphaNumeric(6);
  const categoryName = RandomGenerator.name();
  const category: IShoppingMallCategory =
    await api.functional.shoppingMall.adminUser.categories.create(connection, {
      body: {
        code: categoryCode,
        name: categoryName,
        status: "active",
      } satisfies IShoppingMallCategory.ICreate,
    });
  typia.assert(category);

  // 4. Seller user creation and login
  const sellerEmail = typia.random<string & tags.Format<"email">>();
  const sellerPassword = "seller1234";
  const sellerUser: IShoppingMallSellerUser.IAuthorized =
    await api.functional.auth.sellerUser.join(connection, {
      body: {
        email: sellerEmail,
        password: sellerPassword,
        nickname: RandomGenerator.name(),
        full_name: RandomGenerator.name(),
        business_registration_number: RandomGenerator.alphaNumeric(10),
      } satisfies IShoppingMallSellerUser.ICreate,
    });
  typia.assert(sellerUser);

  await api.functional.auth.sellerUser.login(connection, {
    body: {
      email: sellerEmail,
      password: sellerPassword,
    } satisfies IShoppingMallSellerUser.ILogin,
  });

  // 5. Seller creates product sale
  const saleCode = RandomGenerator.alphaNumeric(8);
  const saleName = RandomGenerator.name();
  const sale: IShoppingMallSale =
    await api.functional.shoppingMall.sellerUser.sales.create(connection, {
      body: {
        shopping_mall_channel_id: channel.id,
        shopping_mall_section_id: null,
        shopping_mall_seller_user_id: sellerUser.id,
        code: saleCode,
        status: "active",
        name: saleName,
        description: null,
        price: 10000,
      } satisfies IShoppingMallSale.ICreate,
    });
  typia.assert(sale);

  // 6. Seller creates sale unit for the sale
  const saleUnitCode = RandomGenerator.alphaNumeric(6);
  const saleUnitName = RandomGenerator.name();
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

  // 7. Seller creates sale option group
  const optionGroupCode = RandomGenerator.alphaNumeric(6);
  const optionGroupName = RandomGenerator.name();
  const saleOptionGroup: IShoppingMallSaleOptionGroup =
    await api.functional.shoppingMall.sellerUser.saleOptionGroups.create(
      connection,
      {
        body: {
          code: optionGroupCode,
          name: optionGroupName,
        } satisfies IShoppingMallSaleOptionGroup.ICreate,
      },
    );
  typia.assert(saleOptionGroup);

  // 8. Seller creates sale option under the group
  const optionCode = RandomGenerator.alphaNumeric(6);
  const optionName = RandomGenerator.name();
  const saleOption: IShoppingMallSaleOption =
    await api.functional.shoppingMall.sellerUser.saleOptions.create(
      connection,
      {
        body: {
          shopping_mall_sale_option_group_id: saleOptionGroup.id,
          code: optionCode,
          name: optionName,
          type: "selection",
        } satisfies IShoppingMallSaleOption.ICreate,
      },
    );
  typia.assert(saleOption);

  // 9. Seller creates sale unit option
  const additionalPrice = 1000;
  const stockQuantity = typia.random<
    number & tags.Type<"int32"> & tags.Minimum<0>
  >();
  const saleUnitOption: IShoppingMallSaleUnitOption =
    await api.functional.shoppingMall.sellerUser.sales.saleUnits.saleUnitOptions.create(
      connection,
      {
        saleId: sale.id,
        saleUnitId: saleUnit.id,
        body: {
          shopping_mall_sale_unit_id: saleUnit.id,
          shopping_mall_sale_option_id: saleOption.id,
          additional_price: additionalPrice,
          stock_quantity: stockQuantity,
        } satisfies IShoppingMallSaleUnitOption.ICreate,
      },
    );
  typia.assert(saleUnitOption);

  // 10. Seller creates inventory record for the sale product + option combination
  const optionCombinationCode = `${saleOption.code}`;
  const inventory: IShoppingMallInventory =
    await api.functional.shoppingMall.sellerUser.inventory.create(connection, {
      body: {
        shopping_mall_sale_id: sale.id,
        option_combination_code: optionCombinationCode,
        stock_quantity: stockQuantity,
      } satisfies IShoppingMallInventory.ICreate,
    });
  typia.assert(inventory);

  // 11. Seller deletes the inventory record successfully
  await api.functional.shoppingMall.sellerUser.inventory.erase(connection, {
    inventoryId: inventory.id,
  });

  // 12. Create another seller user to test unauthorized deletion
  const anotherSellerEmail = typia.random<string & tags.Format<"email">>();
  const anotherSellerPassword = "seller5678";
  const anotherSellerUser: IShoppingMallSellerUser.IAuthorized =
    await api.functional.auth.sellerUser.join(connection, {
      body: {
        email: anotherSellerEmail,
        password: anotherSellerPassword,
        nickname: RandomGenerator.name(),
        full_name: RandomGenerator.name(),
        business_registration_number: RandomGenerator.alphaNumeric(10),
      } satisfies IShoppingMallSellerUser.ICreate,
    });
  typia.assert(anotherSellerUser);

  await api.functional.auth.sellerUser.login(connection, {
    body: {
      email: anotherSellerEmail,
      password: anotherSellerPassword,
    } satisfies IShoppingMallSellerUser.ILogin,
  });

  // 13. Another seller tries to delete the same inventory record and fails
  await TestValidator.error(
    "another seller cannot delete inventory",
    async () => {
      await api.functional.shoppingMall.sellerUser.inventory.erase(connection, {
        inventoryId: inventory.id,
      });
    },
  );

  // 14. Switch back to original seller user to maintain consistent state
  await api.functional.auth.sellerUser.login(connection, {
    body: {
      email: sellerEmail,
      password: sellerPassword,
    } satisfies IShoppingMallSellerUser.ILogin,
  });
}
