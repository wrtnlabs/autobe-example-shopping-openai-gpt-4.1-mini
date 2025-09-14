import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IPage } from "@ORGANIZATION/PROJECT-api/lib/structures/IPage";
import type { IPageIShoppingMallSaleSnapshot } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageIShoppingMallSaleSnapshot";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallChannel } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallChannel";
import type { IShoppingMallSale } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSale";
import type { IShoppingMallSaleSnapshot } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSaleSnapshot";
import type { IShoppingMallSellerUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSellerUser";

/**
 * Test admin user retrieving sale snapshot detail successfully.
 *
 * This test verifies the entire realistic workflow of admin user
 * authentication, sales channel and product creation by seller user, snapshot
 * listing, and detailed snapshot retrieval.
 *
 * Steps:
 *
 * 1. Admin user join and login flow
 * 2. Sales channel creation
 * 3. Seller user join
 * 4. Seller user creating a sales product
 * 5. Admin user listing sales snapshots with pagination
 * 6. Admin user retrieving snapshot detail by snapshotId
 * 7. Validation that snapshot detail matches summary data exactly
 */
export async function test_api_sales_snapshots_detail_as_admin_success(
  connection: api.IConnection,
) {
  // 1. Admin user joins
  const adminEmail = typia.random<string & tags.Format<"email">>();
  const adminPasswordHash = RandomGenerator.alphabets(32);
  const adminUser = await api.functional.auth.adminUser.join(connection, {
    body: {
      email: adminEmail,
      password_hash: adminPasswordHash,
      nickname: RandomGenerator.name(),
      full_name: RandomGenerator.name(2),
      status: "active",
    } satisfies IShoppingMallAdminUser.ICreate,
  });
  typia.assert(adminUser);

  // 2. Admin user logins
  const adminLogin = await api.functional.auth.adminUser.login(connection, {
    body: {
      email: adminEmail,
      password_hash: adminPasswordHash,
    } satisfies IShoppingMallAdminUser.ILogin,
  });
  typia.assert(adminLogin);

  // 3. Create sales channel
  const channel = await api.functional.shoppingMall.adminUser.channels.create(
    connection,
    {
      body: {
        code: RandomGenerator.alphabets(4),
        name: RandomGenerator.name(2),
        description: RandomGenerator.paragraph(),
        status: "active",
      } satisfies IShoppingMallChannel.ICreate,
    },
  );
  typia.assert(channel);

  // 4. Seller user joins
  const sellerEmail = typia.random<string & tags.Format<"email">>();
  const sellerUserPassword = RandomGenerator.alphabets(16);
  const sellerUser = await api.functional.auth.sellerUser.join(connection, {
    body: {
      email: sellerEmail,
      password: sellerUserPassword,
      nickname: RandomGenerator.name(),
      full_name: RandomGenerator.name(2),
      phone_number: RandomGenerator.mobile(),
      business_registration_number: RandomGenerator.alphaNumeric(10),
    } satisfies IShoppingMallSellerUser.ICreate,
  });
  typia.assert(sellerUser);

  // 5. Seller user creates sales product
  const sale = await api.functional.shoppingMall.sellerUser.sales.create(
    connection,
    {
      body: {
        shopping_mall_channel_id: channel.id,
        shopping_mall_section_id: null,
        shopping_mall_seller_user_id: sellerUser.id,
        code: RandomGenerator.alphaNumeric(8),
        status: "active",
        name: RandomGenerator.name(2),
        description: RandomGenerator.paragraph(),
        price: typia.random<number & tags.Type<"uint32"> & tags.Minimum<1>>(),
      } satisfies IShoppingMallSale.ICreate,
    },
  );
  typia.assert(sale);

  // 6. Admin user lists snapshots
  const snapshotPage =
    await api.functional.shoppingMall.adminUser.sales.snapshots.index(
      connection,
      {
        saleId: sale.id,
        body: {
          page: 1,
          limit: 10,
        } satisfies IShoppingMallSaleSnapshot.IRequest,
      },
    );
  typia.assert(snapshotPage);

  // 7. Extract snapshotId (take first summary snapshot if any)
  TestValidator.predicate(
    "snapshot list has at least one snapshot",
    snapshotPage.data.length > 0,
  );
  const snapshotSummary = snapshotPage.data[0];
  typia.assert(snapshotSummary);

  // 8. Admin user retrieves sale snapshot detail
  const snapshotDetail =
    await api.functional.shoppingMall.adminUser.sales.snapshots.at(connection, {
      saleId: sale.id,
      snapshotId: snapshotSummary.id,
    });
  typia.assert(snapshotDetail);

  // 9. Validate snapshot detail matches snapshot summary
  TestValidator.equals(
    "snapshot id matches",
    snapshotDetail.id,
    snapshotSummary.id,
  );
  TestValidator.equals(
    "snapshot sale id matches",
    snapshotDetail.shopping_mall_sale_id,
    snapshotSummary.shopping_mall_sale_id,
  );
  TestValidator.equals(
    "snapshot code matches",
    snapshotDetail.code,
    snapshotSummary.code,
  );
  TestValidator.equals(
    "snapshot status matches",
    snapshotDetail.status,
    snapshotSummary.status,
  );
  TestValidator.equals(
    "snapshot name matches",
    snapshotDetail.name,
    snapshotSummary.name,
  );
  TestValidator.equals(
    "snapshot description matches",
    snapshotDetail.description,
    snapshotSummary.description,
  );
  TestValidator.equals(
    "snapshot price matches",
    snapshotDetail.price,
    snapshotSummary.price,
  );
  TestValidator.equals(
    "snapshot created_at matches",
    snapshotDetail.created_at,
    snapshotSummary.created_at,
  );
}
