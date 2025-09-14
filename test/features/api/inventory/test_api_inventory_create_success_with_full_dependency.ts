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
 * This test verifies the creation of a new inventory record by a fully
 * authenticated admin user in a shopping mall system. The inventory
 * creation requires pre-existing entities: an admin user session, a sales
 * channel, a product category, a registered seller user, an existing
 * product sale linked to channel/category, sale units, and sale unit
 * options. The test proceeds step-by-step:
 *
 * 1. Admin user joining and login to obtain admin authentication token.
 * 2. Creating a sales channel as admin.
 * 3. Creating a product category as admin.
 * 4. Seller user joining and login to obtain seller authentication token.
 * 5. Seller user creates a new sale product linked to channel and category.
 * 6. Seller user creates one or more sale units under the sale product.
 * 7. Seller user creates sale unit options for the created sale units.
 * 8. Admin user creates an inventory record using the created sale product ID
 *    and a valid option combination code, with a positive stock quantity.
 *
 * The test validates proper creation and linkage of all entities,
 * role-based session switching, and final inventory stock entry
 * correctness.
 */
export async function test_api_inventory_create_success_with_full_dependency(
  connection: api.IConnection,
) {
  // 1. Admin user join
  const adminUserEmail = typia.random<string & tags.Format<"email">>();
  const adminUserPassword = "password123";
  const adminUserCreateBody = {
    email: adminUserEmail,
    password_hash: adminUserPassword,
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(),
    status: "active",
  } satisfies IShoppingMallAdminUser.ICreate;

  const adminUser: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: adminUserCreateBody,
    });
  typia.assert(adminUser);

  // 2. Admin user login
  const adminUserLoginBody = {
    email: adminUserEmail,
    password_hash: adminUserPassword,
  } satisfies IShoppingMallAdminUser.ILogin;
  const adminUserLogin: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.login(connection, {
      body: adminUserLoginBody,
    });
  typia.assert(adminUserLogin);

  // 3. Create sales channel as admin
  const channelCreateBody = {
    code: RandomGenerator.alphaNumeric(8),
    name: RandomGenerator.name(),
    description: RandomGenerator.paragraph(),
    status: "active",
  } satisfies IShoppingMallChannel.ICreate;
  const channel: IShoppingMallChannel =
    await api.functional.shoppingMall.adminUser.channels.create(connection, {
      body: channelCreateBody,
    });
  typia.assert(channel);

  // 4. Create product category as admin
  const categoryCreateBody = {
    code: RandomGenerator.alphaNumeric(8),
    name: RandomGenerator.name(),
    status: "active",
    description: RandomGenerator.paragraph(),
  } satisfies IShoppingMallCategory.ICreate;
  const category: IShoppingMallCategory =
    await api.functional.shoppingMall.adminUser.categories.create(connection, {
      body: categoryCreateBody,
    });
  typia.assert(category);

  // 5. Seller user join
  const sellerUserEmail = typia.random<string & tags.Format<"email">>();
  const sellerUserPassword = "password123";
  const sellerUserCreateBody = {
    email: sellerUserEmail,
    password: sellerUserPassword,
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(),
    phone_number: RandomGenerator.mobile(),
    business_registration_number: RandomGenerator.alphaNumeric(10),
  } satisfies IShoppingMallSellerUser.ICreate;
  const sellerUser: IShoppingMallSellerUser.IAuthorized =
    await api.functional.auth.sellerUser.join(connection, {
      body: sellerUserCreateBody,
    });
  typia.assert(sellerUser);

  // 6. Seller user login
  const sellerUserLoginBody = {
    email: sellerUserEmail,
    password: sellerUserPassword,
  } satisfies IShoppingMallSellerUser.ILogin;
  const sellerUserLogin: IShoppingMallSellerUser.IAuthorized =
    await api.functional.auth.sellerUser.login(connection, {
      body: sellerUserLoginBody,
    });
  typia.assert(sellerUserLogin);

  // 7. Seller creates a sale product
  const saleCreateBody = {
    shopping_mall_channel_id: channel.id,
    shopping_mall_section_id: null,
    shopping_mall_seller_user_id: sellerUser.id,
    code: RandomGenerator.alphaNumeric(10),
    status: "active",
    name: RandomGenerator.name(),
    description: RandomGenerator.paragraph(),
    price: typia.random<
      number & tags.Type<"uint32"> & tags.Minimum<1> & tags.Maximum<10000>
    >(),
  } satisfies IShoppingMallSale.ICreate;
  const sale: IShoppingMallSale =
    await api.functional.shoppingMall.sellerUser.sales.create(connection, {
      body: saleCreateBody,
    });
  typia.assert(sale);

  // 8. Seller creates sale unit
  const saleUnitCreateBody = {
    shopping_mall_sale_id: sale.id,
    code: RandomGenerator.alphaNumeric(6),
    name: RandomGenerator.name(),
    description: RandomGenerator.paragraph(),
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

  // 9. Seller creates sale unit option
  const saleUnitOptionCreateBody = {
    shopping_mall_sale_unit_id: saleUnit.id,
    shopping_mall_sale_option_id: typia.random<string & tags.Format<"uuid">>(),
    additional_price: 100,
    stock_quantity: 50,
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

  // 10. Admin user creates inventory record
  // Switch back to admin role by re-login to get admin token
  await api.functional.auth.adminUser.login(connection, {
    body: adminUserLoginBody,
  });

  const optionCombinationCode = `OPT-${saleUnitOption.id}`;
  const inventoryCreateBody = {
    shopping_mall_sale_id: sale.id,
    option_combination_code: optionCombinationCode,
    stock_quantity: 100,
  } satisfies IShoppingMallInventory.ICreate;

  const inventory: IShoppingMallInventory =
    await api.functional.shoppingMall.adminUser.inventory.create(connection, {
      body: inventoryCreateBody,
    });
  typia.assert(inventory);
  TestValidator.equals(
    "inventory's sale_id should match sale's id",
    inventory.shopping_mall_sale_id,
    sale.id,
  );
  TestValidator.equals(
    "inventory's option combination code should match",
    inventory.option_combination_code,
    optionCombinationCode,
  );
  TestValidator.predicate(
    "inventory's stock quantity is positive",
    inventory.stock_quantity > 0,
  );
}
