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

/**
 * Validate successful deletion of an admin user deleting a sale unit option.
 *
 * This test simulates the full business workflow where an admin user joins and
 * logs in, creates a sales channel, then a seller user joins and logs in to
 * create a sales product. The admin user then creates a sale unit and a sale
 * unit option for that unit, and finally deletes the sale unit option verifying
 * that the operation succeeds.
 *
 * The test validates proper authentication by switching contexts between the
 * admin user and seller user. It also confirms that all created resources are
 * correctly referenced and used, ensuring business consistency.
 */
export async function test_api_admin_sale_unit_option_delete_success(
  connection: api.IConnection,
) {
  // 1. Create admin user and authenticate
  const adminEmail: string = typia.random<string & tags.Format<"email">>();
  const adminPassword = "admin-password";
  const admin: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: {
        email: adminEmail,
        password_hash: adminPassword,
        nickname: RandomGenerator.name(),
        full_name: RandomGenerator.name(),
        status: "active",
      } satisfies IShoppingMallAdminUser.ICreate,
    });
  typia.assert(admin);

  // 2. Authenticate admin user login for context switch
  await api.functional.auth.adminUser.login(connection, {
    body: {
      email: adminEmail,
      password_hash: adminPassword,
    } satisfies IShoppingMallAdminUser.ILogin,
  });

  // 3. Create a sales channel as admin
  const channel: IShoppingMallChannel =
    await api.functional.shoppingMall.adminUser.channels.create(connection, {
      body: {
        code: RandomGenerator.alphaNumeric(10),
        name: RandomGenerator.name(),
        description: null,
        status: "active",
      } satisfies IShoppingMallChannel.ICreate,
    });
  typia.assert(channel);

  // 4. Create a seller user and authenticate
  const sellerEmail: string = typia.random<string & tags.Format<"email">>();
  const sellerPassword = "seller-password";
  const seller: IShoppingMallSellerUser.IAuthorized =
    await api.functional.auth.sellerUser.join(connection, {
      body: {
        email: sellerEmail,
        password: sellerPassword,
        nickname: RandomGenerator.name(),
        full_name: RandomGenerator.name(),
        phone_number: null,
        business_registration_number: RandomGenerator.alphaNumeric(10),
      } satisfies IShoppingMallSellerUser.ICreate,
    });
  typia.assert(seller);

  // 5. Authenticate seller login for product creation context
  await api.functional.auth.sellerUser.login(connection, {
    body: {
      email: sellerEmail,
      password: sellerPassword,
    } satisfies IShoppingMallSellerUser.ILogin,
  });

  // 6. Create a sales product under seller and channel
  const sale: IShoppingMallSale =
    await api.functional.shoppingMall.sellerUser.sales.create(connection, {
      body: {
        shopping_mall_channel_id: channel.id,
        shopping_mall_section_id: null,
        shopping_mall_seller_user_id: seller.id,
        code: RandomGenerator.alphaNumeric(15),
        status: "active",
        name: RandomGenerator.name(),
        description: null,
        price: 10000,
      } satisfies IShoppingMallSale.ICreate,
    });
  typia.assert(sale);

  // 7. Switch back to admin user context
  await api.functional.auth.adminUser.login(connection, {
    body: {
      email: adminEmail,
      password_hash: adminPassword,
    } satisfies IShoppingMallAdminUser.ILogin,
  });

  // 8. Create a sale unit as admin
  const saleUnit: IShoppingMallSaleUnit =
    await api.functional.shoppingMall.adminUser.sales.saleUnits.create(
      connection,
      {
        saleId: sale.id,
        body: {
          shopping_mall_sale_id: sale.id,
          code: RandomGenerator.alphaNumeric(12),
          name: RandomGenerator.name(),
          description: null,
        } satisfies IShoppingMallSaleUnit.ICreate,
      },
    );
  typia.assert(saleUnit);

  // 9. Create a sale unit option for the sale unit
  const saleUnitOption: IShoppingMallSaleUnitOption =
    await api.functional.shoppingMall.adminUser.sales.saleUnits.saleUnitOptions.create(
      connection,
      {
        saleId: sale.id,
        saleUnitId: saleUnit.id,
        body: {
          shopping_mall_sale_unit_id: saleUnit.id,
          shopping_mall_sale_option_id: typia.random<
            string & tags.Format<"uuid">
          >(),
          additional_price: 1500,
          stock_quantity: 100,
        } satisfies IShoppingMallSaleUnitOption.ICreate,
      },
    );
  typia.assert(saleUnitOption);

  // 10. Delete the sale unit option
  await api.functional.shoppingMall.adminUser.sales.saleUnits.saleUnitOptions.erase(
    connection,
    {
      saleId: sale.id,
      saleUnitId: saleUnit.id,
      saleUnitOptionId: saleUnitOption.id,
    },
  );

  // 11. No direct read API to verify deletion exist, so success means no error
  // If needed, further validation can be done by listing the options if available
}
