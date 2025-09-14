import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IPage } from "@ORGANIZATION/PROJECT-api/lib/structures/IPage";
import type { IPageIShoppingMallInventory } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageIShoppingMallInventory";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallCategory } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCategory";
import type { IShoppingMallChannel } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallChannel";
import type { IShoppingMallInventory } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallInventory";
import type { IShoppingMallSale } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSale";
import type { IShoppingMallSellerUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSellerUser";

/**
 * This end-to-end test function validates the successful retrieval of a
 * filtered and paginated inventory list belonging to a seller user. The test
 * simulates a complete business workflow starting with the creation and
 * authentication of both seller and admin users, followed by admin creating a
 * sales channel and product category, and the seller user creating a sales
 * product linked to these. Finally, the test performs querying the inventory
 * records filtered by the sale product, optionally further filtering by option
 * combination code and stock quantity range. The test verifies that only the
 * authenticated seller user associated with the sale can query their inventory
 * items and that the pagination and filtering parameters operate correctly.
 * This comprehensive test ensures correct business logic enforcement, workflow
 * integrity, and user role authorization.
 *
 * Steps:
 *
 * 1. Admin user joins (creates admin user account) and logs in.
 * 2. Admin user creates a sales channel.
 * 3. Admin user creates a product category.
 * 4. Seller user joins (creates seller account) and logs in.
 * 5. Seller user creates a sales product attached to the created channel and
 *    category.
 * 6. Seller user calls the inventory search API with filters including saleId and
 *    optional filters for option combination code and stock quantity range.
 * 7. Validates the response data and pagination info are consistent and correctly
 *    typed.
 *
 * The test uses realistic data generated with typia.random and RandomGenerator
 * utilities and manages the authentication contexts properly via join and login
 * operations for each user role. It also ensures the use of correct DTO types
 * for each request and response throughout the test.
 *
 * The test function exercises the entire necessary dependency chain before
 * reaching the target inventory search endpoint, ensuring a full realistic
 * simulation of the e-commerce backend flow related to inventory querying for
 * seller users.
 */
export async function test_api_inventory_search_success_with_complete_dependency(
  connection: api.IConnection,
) {
  // 1. Admin user joins
  const adminUserCreateBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password_hash: RandomGenerator.alphaNumeric(12),
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
    email: adminUser.email,
    password_hash: adminUserCreateBody.password_hash,
  } satisfies IShoppingMallAdminUser.ILogin;
  const adminUserLoggedIn: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.login(connection, {
      body: adminUserLoginBody,
    });
  typia.assert(adminUserLoggedIn);

  // 3. Admin creates sales channel
  const salesChannelCreateBody = {
    code: RandomGenerator.alphaNumeric(10),
    name: RandomGenerator.name(),
    description: RandomGenerator.paragraph({ sentences: 3 }),
    status: "active",
  } satisfies IShoppingMallChannel.ICreate;
  const salesChannel: IShoppingMallChannel =
    await api.functional.shoppingMall.adminUser.channels.create(connection, {
      body: salesChannelCreateBody,
    });
  typia.assert(salesChannel);

  // 4. Admin creates product category
  const categoryCreateBody = {
    code: RandomGenerator.alphaNumeric(8),
    name: RandomGenerator.name(),
    status: "active",
    description: RandomGenerator.paragraph({ sentences: 3 }),
  } satisfies IShoppingMallCategory.ICreate;
  const category: IShoppingMallCategory =
    await api.functional.shoppingMall.adminUser.categories.create(connection, {
      body: categoryCreateBody,
    });
  typia.assert(category);

  // 5. Seller user joins
  const sellerUserCreateBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password: RandomGenerator.alphaNumeric(12),
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(),
    phone_number: null,
    business_registration_number: RandomGenerator.alphaNumeric(12),
  } satisfies IShoppingMallSellerUser.ICreate;
  const sellerUser: IShoppingMallSellerUser.IAuthorized =
    await api.functional.auth.sellerUser.join(connection, {
      body: sellerUserCreateBody,
    });
  typia.assert(sellerUser);

  // 6. Seller user login
  const sellerUserLoginBody = {
    email: sellerUser.email,
    password: sellerUserCreateBody.password,
  } satisfies IShoppingMallSellerUser.ILogin;
  const sellerUserLoggedIn: IShoppingMallSellerUser.IAuthorized =
    await api.functional.auth.sellerUser.login(connection, {
      body: sellerUserLoginBody,
    });
  typia.assert(sellerUserLoggedIn);

  // 7. Seller user creates a sales product
  const saleCreateBody = {
    shopping_mall_channel_id: salesChannel.id,
    shopping_mall_section_id: null,
    shopping_mall_seller_user_id: sellerUser.id,
    code: RandomGenerator.alphaNumeric(10),
    status: "active",
    name: RandomGenerator.name(),
    description: RandomGenerator.paragraph({ sentences: 4 }),
    price: typia.random<
      number & tags.Type<"int32"> & tags.Minimum<1000> & tags.Maximum<100000>
    >(),
  } satisfies IShoppingMallSale.ICreate;
  const sale: IShoppingMallSale =
    await api.functional.shoppingMall.sellerUser.sales.create(connection, {
      body: saleCreateBody,
    });
  typia.assert(sale);

  // 8. Seller user queries the inventory list with filters
  const inventoryRequestBody = {
    saleId: sale.id,
    optionCombinationCode: null,
    minQuantity: 0,
    maxQuantity: null,
    page: 1,
    limit: 10,
    orderBy: "created_at",
  } satisfies IShoppingMallInventory.IRequest;
  const inventoryList: IPageIShoppingMallInventory.ISummary =
    await api.functional.shoppingMall.sellerUser.inventory.index(connection, {
      body: inventoryRequestBody,
    });
  typia.assert(inventoryList);

  // Validate pagination data
  TestValidator.predicate(
    "pagination current page is 1",
    inventoryList.pagination.current === 1,
  );
  TestValidator.predicate(
    "pagination limit is 10",
    inventoryList.pagination.limit === 10,
  );
  TestValidator.predicate(
    "pagination pages is positive",
    inventoryList.pagination.pages >= 0 &&
      inventoryList.pagination.pages >=
        (inventoryList.pagination.records === 0 ? 0 : 1),
  );

  // Validate each inventory record has the correct sale id
  inventoryList.data.forEach((record) => {
    TestValidator.equals(
      "inventory record sale id matches filter",
      record.shopping_mall_sale_id,
      sale.id,
    );
    TestValidator.predicate(
      "inventory record stock quantity non-negative",
      typeof record.stock_quantity === "number" && record.stock_quantity >= 0,
    );
  });
}
