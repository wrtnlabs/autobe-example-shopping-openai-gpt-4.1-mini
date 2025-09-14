import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IPage } from "@ORGANIZATION/PROJECT-api/lib/structures/IPage";
import type { IPageIShoppingMallSaleUnitOption } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageIShoppingMallSaleUnitOption";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallCategory } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCategory";
import type { IShoppingMallChannel } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallChannel";
import type { IShoppingMallSale } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSale";
import type { IShoppingMallSaleUnit } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSaleUnit";
import type { IShoppingMallSaleUnitOption } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSaleUnitOption";
import type { IShoppingMallSellerUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSellerUser";

export async function test_api_seller_sale_unit_option_list_filter_success(
  connection: api.IConnection,
) {
  // 1. Admin user joins the system
  // 2. Admin user logs in
  // 3. Admin user creates a product category
  // 4. Admin user creates a sales channel
  // 5. Seller user joins the system
  // 6. Seller user logs in
  // 7. Seller creates a sale product with the created channel and seller user ID
  // 8. Seller creates a sale unit under the created sale product
  // 9. Seller retrieves sale unit options list with filter pagination

  // Step 1: Admin user registration
  const adminEmail: string = typia.random<string & tags.Format<"email">>();
  const adminPassword = "securePassword123!";
  const adminCreateBody = {
    email: adminEmail,
    password_hash: adminPassword,
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(),
    status: "active",
  } satisfies IShoppingMallAdminUser.ICreate;
  const adminUser: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: adminCreateBody,
    });
  typia.assert(adminUser);

  // Step 2: Admin user login
  const adminLoginBody = {
    email: adminEmail,
    password_hash: adminPassword,
  } satisfies IShoppingMallAdminUser.ILogin;
  const adminAuth: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.login(connection, {
      body: adminLoginBody,
    });
  typia.assert(adminAuth);

  // Step 3: Admin user creates product category
  const categoryCreateBody = {
    code: RandomGenerator.alphabets(5).toUpperCase(),
    name: RandomGenerator.name(),
    status: "active",
    description: RandomGenerator.paragraph({ sentences: 5 }),
  } satisfies IShoppingMallCategory.ICreate;
  const category: IShoppingMallCategory =
    await api.functional.shoppingMall.adminUser.categories.create(connection, {
      body: categoryCreateBody,
    });
  typia.assert(category);

  // Step 4: Admin user creates sales channel
  const channelCreateBody = {
    code: RandomGenerator.alphabets(5).toLowerCase(),
    name: RandomGenerator.name(),
    status: "active",
    description: RandomGenerator.paragraph({ sentences: 3 }),
  } satisfies IShoppingMallChannel.ICreate;
  const channel: IShoppingMallChannel =
    await api.functional.shoppingMall.adminUser.channels.create(connection, {
      body: channelCreateBody,
    });
  typia.assert(channel);

  // Step 5: Seller user registration
  const sellerEmail: string = typia.random<string & tags.Format<"email">>();
  const sellerPassword = "sellerPass456!";
  const sellerCreateBody = {
    email: sellerEmail,
    password: sellerPassword,
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(),
    phone_number: RandomGenerator.mobile(),
    business_registration_number:
      RandomGenerator.alphaNumeric(10).toUpperCase(),
  } satisfies IShoppingMallSellerUser.ICreate;
  const sellerUser: IShoppingMallSellerUser.IAuthorized =
    await api.functional.auth.sellerUser.join(connection, {
      body: sellerCreateBody,
    });
  typia.assert(sellerUser);

  // Step 6: Seller user login
  const sellerLoginBody = {
    email: sellerEmail,
    password: sellerPassword,
  } satisfies IShoppingMallSellerUser.ILogin;
  const sellerAuth: IShoppingMallSellerUser.IAuthorized =
    await api.functional.auth.sellerUser.login(connection, {
      body: sellerLoginBody,
    });
  typia.assert(sellerAuth);

  // Step 7: Seller creates sale product
  const saleCreateBody = {
    shopping_mall_channel_id: channel.id,
    shopping_mall_section_id: null,
    shopping_mall_seller_user_id: sellerUser.id,
    code: RandomGenerator.alphaNumeric(6).toUpperCase(),
    status: "active",
    name: RandomGenerator.name(3),
    description: RandomGenerator.paragraph({ sentences: 6 }),
    price: 10000,
  } satisfies IShoppingMallSale.ICreate;
  const saleProduct: IShoppingMallSale =
    await api.functional.shoppingMall.sellerUser.sales.create(connection, {
      body: saleCreateBody,
    });
  typia.assert(saleProduct);

  // Step 8: Seller creates a sale unit under the sale product
  const saleUnitCreateBody = {
    shopping_mall_sale_id: saleProduct.id,
    code: RandomGenerator.alphaNumeric(4).toUpperCase(),
    name: RandomGenerator.name(2),
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

  // Step 9: Seller retrieves sale unit options list with filter and pagination
  const saleUnitOptionsRequest = {
    saleUnitId: saleUnit.id,
    saleOptionId: null,
    page: 1,
    limit: 10,
    sort: undefined,
    filter: undefined,
  } satisfies IShoppingMallSaleUnitOption.IRequest;
  const saleUnitOptions: IPageIShoppingMallSaleUnitOption.ISummary =
    await api.functional.shoppingMall.sellerUser.sales.saleUnits.saleUnitOptions.index(
      connection,
      {
        saleId: saleProduct.id,
        saleUnitId: saleUnit.id,
        body: saleUnitOptionsRequest,
      },
    );
  typia.assert(saleUnitOptions);

  // Validate pagination info
  TestValidator.predicate(
    "pagination current page is 1",
    saleUnitOptions.pagination.current === 1,
  );
  TestValidator.predicate(
    "pagination limit is 10",
    saleUnitOptions.pagination.limit === 10,
  );

  // Validate all sale unit options belong to the sale unit
  for (const option of saleUnitOptions.data) {
    TestValidator.equals(
      `sale_unit_option's sale unit matches the requested saleUnit id: ${option.id}`,
      option.shopping_mall_sale_unit_id,
      saleUnit.id,
    );
  }
}
