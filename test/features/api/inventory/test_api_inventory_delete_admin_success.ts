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

export async function test_api_inventory_delete_admin_success(
  connection: api.IConnection,
) {
  // 1. Admin user join and login
  const adminEmail = typia.random<string & tags.Format<"email">>();
  const adminPassword = "P@ssword123!";
  const adminJoinBody = {
    email: adminEmail,
    password_hash: adminPassword,
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(),
    status: "active",
  } satisfies IShoppingMallAdminUser.ICreate;
  const adminUser: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: adminJoinBody,
    });
  typia.assert(adminUser);

  const adminLoginBody = {
    email: adminEmail,
    password_hash: adminPassword,
  } satisfies IShoppingMallAdminUser.ILogin;
  const adminLoggedIn: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.login(connection, {
      body: adminLoginBody,
    });
  typia.assert(adminLoggedIn);

  // 2. Admin creates product category
  const categoryBody = {
    code: RandomGenerator.alphaNumeric(10),
    name: RandomGenerator.name(),
    status: "active",
    description: null,
  } satisfies IShoppingMallCategory.ICreate;
  const category: IShoppingMallCategory =
    await api.functional.shoppingMall.adminUser.categories.create(connection, {
      body: categoryBody,
    });
  typia.assert(category);

  // 3. Admin creates sales channel
  const channelBody = {
    code: RandomGenerator.alphaNumeric(6),
    name: RandomGenerator.name(),
    status: "active",
    description: null,
  } satisfies IShoppingMallChannel.ICreate;
  const channel: IShoppingMallChannel =
    await api.functional.shoppingMall.adminUser.channels.create(connection, {
      body: channelBody,
    });
  typia.assert(channel);

  // 4. Seller user join and login
  const sellerEmail = typia.random<string & tags.Format<"email">>();
  const sellerPassword = "P@ssword123!";
  const sellerJoinBody = {
    email: sellerEmail,
    password: sellerPassword,
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(),
    phone_number: null,
    business_registration_number: RandomGenerator.alphaNumeric(10),
  } satisfies IShoppingMallSellerUser.ICreate;
  const sellerUser: IShoppingMallSellerUser.IAuthorized =
    await api.functional.auth.sellerUser.join(connection, {
      body: sellerJoinBody,
    });
  typia.assert(sellerUser);

  const sellerLoginBody = {
    email: sellerEmail,
    password: sellerPassword,
  } satisfies IShoppingMallSellerUser.ILogin;
  const sellerLoggedIn: IShoppingMallSellerUser.IAuthorized =
    await api.functional.auth.sellerUser.login(connection, {
      body: sellerLoginBody,
    });
  typia.assert(sellerLoggedIn);

  // 5. Seller creates product sale
  const saleBody = {
    shopping_mall_channel_id: channel.id,
    shopping_mall_section_id: null,
    shopping_mall_seller_user_id: sellerUser.id,
    code: RandomGenerator.alphaNumeric(10),
    status: "active",
    name: RandomGenerator.name(),
    description: null,
    price: 10000,
  } satisfies IShoppingMallSale.ICreate;
  const sale: IShoppingMallSale =
    await api.functional.shoppingMall.sellerUser.sales.create(connection, {
      body: saleBody,
    });
  typia.assert(sale);

  // 6. Seller creates sale option group
  const optionGroupBody = {
    code: RandomGenerator.alphaNumeric(10),
    name: RandomGenerator.name(),
  } satisfies IShoppingMallSaleOptionGroup.ICreate;
  const optionGroup: IShoppingMallSaleOptionGroup =
    await api.functional.shoppingMall.sellerUser.saleOptionGroups.create(
      connection,
      {
        body: optionGroupBody,
      },
    );
  typia.assert(optionGroup);

  // 7. Seller creates sale option
  const optionBody = {
    shopping_mall_sale_option_group_id: optionGroup.id,
    code: RandomGenerator.alphaNumeric(6),
    name: RandomGenerator.name(),
    type: "selection",
  } satisfies IShoppingMallSaleOption.ICreate;
  const option: IShoppingMallSaleOption =
    await api.functional.shoppingMall.sellerUser.saleOptions.create(
      connection,
      {
        body: optionBody,
      },
    );
  typia.assert(option);

  // 8. Seller creates sale unit
  const saleUnitBody = {
    shopping_mall_sale_id: sale.id,
    code: RandomGenerator.alphaNumeric(6),
    name: RandomGenerator.name(),
    description: null,
  } satisfies IShoppingMallSaleUnit.ICreate;
  const saleUnit: IShoppingMallSaleUnit =
    await api.functional.shoppingMall.sellerUser.sales.saleUnits.create(
      connection,
      {
        saleId: sale.id,
        body: saleUnitBody,
      },
    );
  typia.assert(saleUnit);

  // 9. Seller creates sale unit option
  const saleUnitOptionBody = {
    shopping_mall_sale_unit_id: saleUnit.id,
    shopping_mall_sale_option_id: option.id,
    additional_price: 500,
    stock_quantity: 100,
  } satisfies IShoppingMallSaleUnitOption.ICreate;
  const saleUnitOption: IShoppingMallSaleUnitOption =
    await api.functional.shoppingMall.sellerUser.sales.saleUnits.saleUnitOptions.create(
      connection,
      {
        saleId: sale.id,
        saleUnitId: saleUnit.id,
        body: saleUnitOptionBody,
      },
    );
  typia.assert(saleUnitOption);

  // 10. Admin creates inventory with option combination code
  // Compose option combination code using saleUnitOption id (simulate as string representation since no precise format defined)
  const optionCombinationCode = saleUnitOption.id;
  const inventoryBody = {
    shopping_mall_sale_id: sale.id,
    option_combination_code: optionCombinationCode,
    stock_quantity: 100,
  } satisfies IShoppingMallInventory.ICreate;
  const inventory: IShoppingMallInventory =
    await api.functional.shoppingMall.adminUser.inventory.create(connection, {
      body: inventoryBody,
    });
  typia.assert(inventory);

  // 11. Admin deletes the inventory
  await api.functional.shoppingMall.adminUser.inventory.erase(connection, {
    inventoryId: inventory.id,
  });
}
