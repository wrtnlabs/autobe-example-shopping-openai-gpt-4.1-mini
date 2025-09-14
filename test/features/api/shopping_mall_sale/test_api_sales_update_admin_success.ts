import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallChannel } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallChannel";
import type { IShoppingMallSale } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSale";
import type { IShoppingMallSellerUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSellerUser";

/**
 * This E2E test verifies successful update of a product sale by an admin user.
 * The test involves multiple preparatory steps: creation and login of an admin
 * user, creation of a sales channel, creation and login of a seller user, and
 * creation of an initial product sale by seller. Then, the admin user updates
 * the product sale by modifying fields such as status, price, and optionally
 * section id. The test asserts that the API returns the updated sale object
 * with the changes reflected as expected. Authentication contexts are handled
 * correctly by switching between admin and seller users. The test strictly
 * follows the API contract and DTO types exactly, including usage of
 * IShoppingMallSale.IUpdate type for update payload and using typia.assert for
 * response validation. It avoids any non-existent properties and uses realistic
 * random data for updatable fields such as status, price, and section id (which
 * can be explicitly null). The sequence ensures proper role authentication and
 * ownership context for product creation and update.
 */
export async function test_api_sales_update_admin_success(
  connection: api.IConnection,
) {
  // 1. Admin user join
  const adminEmail = typia.random<string & tags.Format<"email">>();
  const adminPassword = RandomGenerator.alphaNumeric(12);
  const adminUser = await api.functional.auth.adminUser.join(connection, {
    body: {
      email: adminEmail,
      password_hash: adminPassword,
      nickname: RandomGenerator.name(),
      full_name: RandomGenerator.name(2),
      status: "active",
    } satisfies IShoppingMallAdminUser.ICreate,
  });
  typia.assert(adminUser);

  // 2. Admin user login
  await api.functional.auth.adminUser.login(connection, {
    body: {
      email: adminEmail,
      password_hash: adminPassword,
    } satisfies IShoppingMallAdminUser.ILogin,
  });

  // 3. Create a sales channel by admin user
  const channelCreateBody = {
    code: RandomGenerator.alphaNumeric(6).toLowerCase(),
    name: RandomGenerator.name(),
    description: RandomGenerator.paragraph({ sentences: 4 }),
    status: "active",
  } satisfies IShoppingMallChannel.ICreate;
  const channel = await api.functional.shoppingMall.adminUser.channels.create(
    connection,
    {
      body: channelCreateBody,
    },
  );
  typia.assert(channel);

  // 4. Seller user join
  const sellerEmail = typia.random<string & tags.Format<"email">>();
  const sellerPassword = RandomGenerator.alphaNumeric(12);
  const sellerUser = await api.functional.auth.sellerUser.join(connection, {
    body: {
      email: sellerEmail,
      password: sellerPassword,
      nickname: RandomGenerator.name(),
      full_name: RandomGenerator.name(2),
      phone_number: null,
      business_registration_number: RandomGenerator.alphaNumeric(10),
    } satisfies IShoppingMallSellerUser.ICreate,
  });
  typia.assert(sellerUser);

  // 5. Seller user login
  await api.functional.auth.sellerUser.login(connection, {
    body: {
      email: sellerEmail,
      password: sellerPassword,
    } satisfies IShoppingMallSellerUser.ILogin,
  });

  // 6. Seller creates an initial sale product
  const saleCreateBody = {
    shopping_mall_channel_id: channel.id,
    shopping_mall_section_id: null,
    shopping_mall_seller_user_id: sellerUser.id,
    code: RandomGenerator.alphaNumeric(8).toUpperCase(),
    status: "active",
    name: RandomGenerator.name(),
    description: RandomGenerator.content({ paragraphs: 2 }),
    price: typia.random<number & tags.Minimum<100> & tags.Maximum<10000>>(),
  } satisfies IShoppingMallSale.ICreate;

  const sale = await api.functional.shoppingMall.sellerUser.sales.create(
    connection,
    {
      body: saleCreateBody,
    },
  );
  typia.assert(sale);

  // 7. Switch to admin user login to prepare for update
  await api.functional.auth.adminUser.login(connection, {
    body: {
      email: adminEmail,
      password_hash: adminPassword,
    } satisfies IShoppingMallAdminUser.ILogin,
  });

  // 8. Prepare update body with changes
  const updatedStatus = RandomGenerator.pick([
    "active",
    "paused",
    "discontinued",
  ] as const);
  const updatedPrice = typia.random<
    number & tags.Minimum<100> & tags.Maximum<20000>
  >();
  const updatedSectionId = RandomGenerator.pick([
    null,
    typia.random<string & tags.Format<"uuid">>(),
  ]);

  const saleUpdateBody = {
    status: updatedStatus,
    price: updatedPrice,
    shopping_mall_section_id: updatedSectionId,
  } satisfies IShoppingMallSale.IUpdate;

  // 9. Admin updates the sale product
  const updatedSale = await api.functional.shoppingMall.adminUser.sales.update(
    connection,
    {
      saleId: sale.id,
      body: saleUpdateBody,
    },
  );
  typia.assert(updatedSale);

  // 10. Verify update results
  TestValidator.equals("sale ID should not change", updatedSale.id, sale.id);
  TestValidator.equals(
    "sale status should be updated",
    updatedSale.status,
    updatedStatus,
  );
  TestValidator.equals(
    "sale price should be updated",
    updatedSale.price,
    updatedPrice,
  );
  TestValidator.equals(
    "sale section id should be updated",
    updatedSale.shopping_mall_section_id ?? null,
    updatedSectionId ?? null,
  );
}
