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
import type { IShoppingMallSellerUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSellerUser";

export async function test_api_sale_sale_unit_detail_authorization_and_data_integrity(
  connection: api.IConnection,
) {
  // 1. Admin user joins and authenticates
  const adminEmail = typia.random<string & tags.Format<"email">>();
  const adminPassword = "securePassword123!";
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

  // 2. Admin user creates product category
  const categoryCode = `cat-${RandomGenerator.alphaNumeric(6)}`;
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

  // 3. Admin user creates sales channel
  const channelCode = `ch-${RandomGenerator.alphaNumeric(5)}`;
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

  // 4. Seller user joins and authenticates
  const sellerEmail = typia.random<string & tags.Format<"email">>();
  const sellerPassword = "sellerPass123!";
  const sellerUser: IShoppingMallSellerUser.IAuthorized =
    await api.functional.auth.sellerUser.join(connection, {
      body: {
        email: sellerEmail,
        password: sellerPassword,
        nickname: RandomGenerator.name(),
        full_name: RandomGenerator.name(),
        phone_number: null,
        business_registration_number: `BRN${RandomGenerator.alphaNumeric(9)}`,
      } satisfies IShoppingMallSellerUser.ICreate,
    });
  typia.assert(sellerUser);

  // 5. Seller creates a sale product
  const saleProductCode = `sp-${RandomGenerator.alphaNumeric(6)}`;
  const saleProductName = RandomGenerator.name();
  const saleProduct: IShoppingMallSale =
    await api.functional.shoppingMall.sellerUser.sales.create(connection, {
      body: {
        shopping_mall_channel_id: channel.id,
        shopping_mall_seller_user_id: sellerUser.id,
        shopping_mall_section_id: category.id,
        code: saleProductCode,
        status: "active",
        name: saleProductName,
        description: null,
        price: typia.random<
          number &
            tags.Type<"uint32"> &
            tags.Minimum<1> &
            tags.Maximum<10000000>
        >(),
      } satisfies IShoppingMallSale.ICreate,
    });
  typia.assert(saleProduct);

  // 6. Seller creates a sale unit under the sale product
  const saleUnitCode = `su-${RandomGenerator.alphaNumeric(5)}`;
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

  // 7. Seller gets the detail of the sale unit
  const fetchedSaleUnit: IShoppingMallSaleUnit =
    await api.functional.shoppingMall.sellerUser.sales.saleUnits.at(
      connection,
      {
        saleId: saleProduct.id,
        saleUnitId: saleUnit.id,
      },
    );
  typia.assert(fetchedSaleUnit);

  // Validate that fetched sale unit matches the created one
  TestValidator.equals("sale unit id matches", fetchedSaleUnit.id, saleUnit.id);
  TestValidator.equals(
    "sale unit sale id matches",
    fetchedSaleUnit.shopping_mall_sale_id,
    saleProduct.id,
  );
  TestValidator.equals(
    "sale unit code matches",
    fetchedSaleUnit.code,
    saleUnitCode,
  );
  TestValidator.equals(
    "sale unit name matches",
    fetchedSaleUnit.name,
    saleUnitName,
  );
  TestValidator.equals(
    "sale unit description matches",
    fetchedSaleUnit.description,
    null,
  );
}
