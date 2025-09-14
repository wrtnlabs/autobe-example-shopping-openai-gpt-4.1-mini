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
 * Validate successful deletion of a sale unit option by a seller user.
 *
 * This comprehensive test carries out the full prerequisite entity creation
 * and authorization context switching to ensure that the seller user can
 * create and then delete a sale unit option successfully.
 *
 * Steps:
 *
 * 1. Register a seller user, authenticate as seller user.
 * 2. Register and authenticate an admin user.
 * 3. Admin user creates a shopping mall sales channel.
 * 4. Switch to seller user context.
 * 5. Seller user creates a sale product linked to the channel and seller user.
 * 6. Switch to admin user context.
 * 7. Admin user creates a sale unit under the sale product.
 * 8. Switch to seller user context.
 * 9. Seller user creates a sale unit option under the sale unit.
 * 10. Seller user deletes the created sale unit option.
 *
 * Each API response is validated for correct typings, and business
 * relationships between created entities are verified by equality
 * assertions.
 *
 * Role switching is handled explicitly using the login endpoints to
 * simulate real-world multi-actor test scenarios.
 */
export async function test_api_seller_sale_unit_option_delete_success(
  connection: api.IConnection,
) {
  // 1. Register a new seller user
  const sellerUserCreateBody = {
    email: `seller_${RandomGenerator.alphaNumeric(6)}@example.com`,
    password: "Passw0rd!",
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(2),
    phone_number: RandomGenerator.mobile(),
    business_registration_number: `BRN${RandomGenerator.alphaNumeric(9)}`,
  } satisfies IShoppingMallSellerUser.ICreate;
  const sellerUser: IShoppingMallSellerUser.IAuthorized =
    await api.functional.auth.sellerUser.join(connection, {
      body: sellerUserCreateBody,
    });
  typia.assert(sellerUser);

  // 2. Register and authenticate a new admin user
  const adminUserCreateBody = {
    email: `admin_${RandomGenerator.alphaNumeric(6)}@example.com`,
    password_hash: RandomGenerator.alphaNumeric(32),
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(2),
    status: "active",
  } satisfies IShoppingMallAdminUser.ICreate;
  const adminUser: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: adminUserCreateBody,
    });
  typia.assert(adminUser);

  // 3. Admin user creates a sales channel
  await api.functional.auth.adminUser.login(connection, {
    body: {
      email: adminUserCreateBody.email,
      password_hash: adminUserCreateBody.password_hash,
    } satisfies IShoppingMallAdminUser.ILogin,
  });
  const channelCreateBody = {
    code: `chan_${RandomGenerator.alphaNumeric(6)}`,
    name: `Channel ${RandomGenerator.alphaNumeric(4)}`,
    description: RandomGenerator.paragraph({ sentences: 4 }),
    status: "active",
  } satisfies IShoppingMallChannel.ICreate;
  const channel: IShoppingMallChannel =
    await api.functional.shoppingMall.adminUser.channels.create(connection, {
      body: channelCreateBody,
    });
  typia.assert(channel);

  // 4. Switch auth to seller user
  await api.functional.auth.sellerUser.login(connection, {
    body: {
      email: sellerUserCreateBody.email,
      password: sellerUserCreateBody.password,
    } satisfies IShoppingMallSellerUser.ILogin,
  });

  // 5. Seller user creates a sale product linked to the channel and seller
  const saleCreateBody = {
    shopping_mall_channel_id: channel.id,
    shopping_mall_section_id: null,
    shopping_mall_seller_user_id: sellerUser.id,
    code: `sale_${RandomGenerator.alphaNumeric(6)}`,
    status: "active",
    name: RandomGenerator.name(3),
    description: RandomGenerator.content({ paragraphs: 2 }),
    price: 10000,
  } satisfies IShoppingMallSale.ICreate;
  const sale: IShoppingMallSale =
    await api.functional.shoppingMall.sellerUser.sales.create(connection, {
      body: saleCreateBody,
    });
  typia.assert(sale);

  // 6. Switch auth to admin user
  await api.functional.auth.adminUser.login(connection, {
    body: {
      email: adminUserCreateBody.email,
      password_hash: adminUserCreateBody.password_hash,
    } satisfies IShoppingMallAdminUser.ILogin,
  });

  // 7. Admin user creates a sale unit under the sale product
  const saleUnitCreateBody = {
    shopping_mall_sale_id: sale.id,
    code: `unit_${RandomGenerator.alphaNumeric(6)}`,
    name: RandomGenerator.name(3),
    description: RandomGenerator.paragraph({ sentences: 5 }),
  } satisfies IShoppingMallSaleUnit.ICreate;
  const saleUnit: IShoppingMallSaleUnit =
    await api.functional.shoppingMall.adminUser.sales.saleUnits.create(
      connection,
      {
        saleId: sale.id,
        body: saleUnitCreateBody,
      },
    );
  typia.assert(saleUnit);

  // Verify relational integrity
  TestValidator.equals(
    "sale id matches",
    saleUnit.shopping_mall_sale_id,
    sale.id,
  );

  // 8. Switch auth back to seller user
  await api.functional.auth.sellerUser.login(connection, {
    body: {
      email: sellerUserCreateBody.email,
      password: sellerUserCreateBody.password,
    } satisfies IShoppingMallSellerUser.ILogin,
  });

  // 9. Seller user creates a sale unit option under the sale unit
  const saleUnitOptionCreateBody = {
    shopping_mall_sale_unit_id: saleUnit.id,
    shopping_mall_sale_option_id: typia.random<string & tags.Format<"uuid">>(),
    additional_price: 1000,
    stock_quantity: typia.random<
      number & tags.Type<"int32"> & tags.Minimum<1>
    >(),
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

  // Verify sale unit option is linked correctly
  TestValidator.equals(
    "sale unit id matches",
    saleUnitOption.shopping_mall_sale_unit_id,
    saleUnit.id,
  );

  // 10. Seller user deletes the created sale unit option
  await api.functional.shoppingMall.sellerUser.sales.saleUnits.saleUnitOptions.erase(
    connection,
    {
      saleId: sale.id,
      saleUnitId: saleUnit.id,
      saleUnitOptionId: saleUnitOption.id,
    },
  );
}
