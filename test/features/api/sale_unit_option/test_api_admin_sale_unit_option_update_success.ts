import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallChannel } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallChannel";
import type { IShoppingMallSale } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSale";
import type { IShoppingMallSaleUnit } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSaleUnit";
import type { IShoppingMallSaleUnitOption } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSaleUnitOption";
import type { IShoppingMallSellerUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSellerUser";

export async function test_api_admin_sale_unit_option_update_success(
  connection: api.IConnection,
) {
  // 1. Admin user join and authenticate
  const adminUserEmail = typia.random<string & tags.Format<"email">>();
  const adminUserPasswordHash = RandomGenerator.alphaNumeric(16);
  const adminUser: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: {
        email: adminUserEmail,
        password_hash: adminUserPasswordHash,
        nickname: RandomGenerator.name(),
        full_name: RandomGenerator.name(),
        status: "active",
      } satisfies IShoppingMallAdminUser.ICreate,
    });
  typia.assert(adminUser);

  // 2. Create admin channel
  const channelCode = RandomGenerator.alphaNumeric(8);
  const channelName = RandomGenerator.name();
  const channel: IShoppingMallChannel =
    await api.functional.shoppingMall.adminUser.channels.create(connection, {
      body: {
        code: channelCode,
        name: channelName,
        description: RandomGenerator.paragraph({ sentences: 3 }),
        status: "active",
      } satisfies IShoppingMallChannel.ICreate,
    });
  typia.assert(channel);

  // 3. Seller user join and authenticate
  const sellerUserEmail = typia.random<string & tags.Format<"email">>();
  const sellerUserPassword = RandomGenerator.alphaNumeric(16);
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

  // 4. Seller user creates a sale product linked to admin channel and seller
  const saleProductCode = RandomGenerator.alphaNumeric(8);
  const saleProductName = RandomGenerator.name();
  const saleProduct: IShoppingMallSale =
    await api.functional.shoppingMall.sellerUser.sales.create(connection, {
      body: {
        shopping_mall_channel_id: channel.id,
        shopping_mall_section_id: null,
        shopping_mall_seller_user_id: sellerUser.id,
        code: saleProductCode,
        status: "active",
        name: saleProductName,
        description: RandomGenerator.paragraph({ sentences: 3 }),
        price: 10000,
      } satisfies IShoppingMallSale.ICreate,
    });
  typia.assert(saleProduct);

  // 5. Admin user switches authentication context (simulate re-login)
  await api.functional.auth.adminUser.login(connection, {
    body: {
      email: adminUser.email,
      password_hash: adminUserPasswordHash,
    } satisfies IShoppingMallAdminUser.ILogin,
  });

  // 6. Create sale unit under the sale product
  const saleUnitCode = RandomGenerator.alphaNumeric(8);
  const saleUnitName = RandomGenerator.name();
  const saleUnit: IShoppingMallSaleUnit =
    await api.functional.shoppingMall.adminUser.sales.saleUnits.create(
      connection,
      {
        saleId: saleProduct.id,
        body: {
          shopping_mall_sale_id: saleProduct.id,
          code: saleUnitCode,
          name: saleUnitName,
          description: RandomGenerator.paragraph({ sentences: 3 }),
        } satisfies IShoppingMallSaleUnit.ICreate,
      },
    );
  typia.assert(saleUnit);

  // 7. Create sale unit option under the sale unit
  const saleUnitOption: IShoppingMallSaleUnitOption =
    await api.functional.shoppingMall.adminUser.sales.saleUnits.saleUnitOptions.create(
      connection,
      {
        saleId: saleProduct.id,
        saleUnitId: saleUnit.id,
        body: {
          shopping_mall_sale_unit_id: saleUnit.id,
          shopping_mall_sale_option_id: typia.random<
            string & tags.Format<"uuid">
          >(),
          additional_price: 1000,
          stock_quantity: 10,
        } satisfies IShoppingMallSaleUnitOption.ICreate,
      },
    );
  typia.assert(saleUnitOption);

  // 8. Update the sale unit option with new data
  const updatedAdditionalPrice = saleUnitOption.additional_price + 500;
  const updatedStockQuantity = saleUnitOption.stock_quantity + 20;
  const updatedOption: IShoppingMallSaleUnitOption =
    await api.functional.shoppingMall.adminUser.sales.saleUnits.saleUnitOptions.update(
      connection,
      {
        saleId: saleProduct.id,
        saleUnitId: saleUnit.id,
        saleUnitOptionId: saleUnitOption.id,
        body: {
          additional_price: updatedAdditionalPrice,
          stock_quantity: updatedStockQuantity,
        } satisfies IShoppingMallSaleUnitOption.IUpdate,
      },
    );
  typia.assert(updatedOption);

  // 9. Validate that updated option matches expected values
  TestValidator.equals(
    "additional price should be updated",
    updatedOption.additional_price,
    updatedAdditionalPrice,
  );
  TestValidator.equals(
    "stock quantity should be updated",
    updatedOption.stock_quantity,
    updatedStockQuantity,
  );
}
