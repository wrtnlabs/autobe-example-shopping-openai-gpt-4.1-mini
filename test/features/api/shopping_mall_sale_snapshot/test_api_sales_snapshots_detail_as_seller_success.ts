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

export async function test_api_sales_snapshots_detail_as_seller_success(
  connection: api.IConnection,
) {
  // 1. Create seller user and authenticate via join
  const sellerCreateBody = {
    email: `${RandomGenerator.name(1).toLowerCase()}@example.com`,
    password: "P@ssword123!",
    nickname: RandomGenerator.name(2),
    full_name: RandomGenerator.name(2),
    phone_number: RandomGenerator.mobile(),
    business_registration_number: `BRN${RandomGenerator.alphaNumeric(9).toUpperCase()}`,
  } satisfies IShoppingMallSellerUser.ICreate;
  const sellerAuthorized = await api.functional.auth.sellerUser.join(
    connection,
    {
      body: sellerCreateBody,
    },
  );
  typia.assert(sellerAuthorized);

  // 2. Create admin user and authenticate via join
  const adminCreateBody = {
    email: `${RandomGenerator.name(1).toLowerCase()}@admin.com`,
    password_hash: "EncryptedPassword123!",
    nickname: RandomGenerator.name(2),
    full_name: RandomGenerator.name(2),
    status: "active",
  } satisfies IShoppingMallAdminUser.ICreate;
  const adminAuthorized = await api.functional.auth.adminUser.join(connection, {
    body: adminCreateBody,
  });
  typia.assert(adminAuthorized);

  // 3. Login admin user for channel creation
  await api.functional.auth.adminUser.login(connection, {
    body: {
      email: adminCreateBody.email,
      password_hash: adminCreateBody.password_hash,
    } satisfies IShoppingMallAdminUser.ILogin,
  });

  // 4. Create sales channel by admin
  const channelCreateBody = {
    code: RandomGenerator.alphaNumeric(8).toLowerCase(),
    name: RandomGenerator.name(2),
    description: RandomGenerator.paragraph({ sentences: 5 }),
    status: "active",
  } satisfies IShoppingMallChannel.ICreate;
  const channel = await api.functional.shoppingMall.adminUser.channels.create(
    connection,
    {
      body: channelCreateBody,
    },
  );
  typia.assert(channel);

  // 5. Login seller user for sale creation
  await api.functional.auth.sellerUser.login(connection, {
    body: {
      email: sellerCreateBody.email,
      password: sellerCreateBody.password,
    } satisfies IShoppingMallSellerUser.ILogin,
  });

  // 6. Create sale product by seller
  const saleCreateBody = {
    shopping_mall_channel_id: channel.id,
    shopping_mall_seller_user_id: sellerAuthorized.id,
    code: RandomGenerator.alphaNumeric(10).toUpperCase(),
    status: "active",
    name: RandomGenerator.name(2),
    description: RandomGenerator.paragraph({ sentences: 3 }),
    price: typia.random<number & tags.Type<"int32"> & tags.Minimum<1>>(),
  } satisfies IShoppingMallSale.ICreate;
  const sale = await api.functional.shoppingMall.sellerUser.sales.create(
    connection,
    {
      body: saleCreateBody,
    },
  );
  typia.assert(sale);

  // 7. Login admin user to list snapshots
  await api.functional.auth.adminUser.login(connection, {
    body: {
      email: adminCreateBody.email,
      password_hash: adminCreateBody.password_hash,
    } satisfies IShoppingMallAdminUser.ILogin,
  });

  // list snapshots for the sale
  const snapshotsResponse =
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
  typia.assert(snapshotsResponse);

  TestValidator.predicate(
    "at least one snapshot exists",
    snapshotsResponse.data.length > 0,
  );

  const snapshotId = snapshotsResponse.data[0].id;

  // 8. Login seller user to fetch snapshot detail
  await api.functional.auth.sellerUser.login(connection, {
    body: {
      email: sellerCreateBody.email,
      password: sellerCreateBody.password,
    } satisfies IShoppingMallSellerUser.ILogin,
  });

  const snapshotDetail =
    await api.functional.shoppingMall.sellerUser.sales.snapshots.at(
      connection,
      {
        saleId: sale.id,
        snapshotId: snapshotId,
      },
    );
  typia.assert(snapshotDetail);

  TestValidator.equals(
    "snapshot sale id matches",
    snapshotDetail.shopping_mall_sale_id,
    sale.id,
  );
  TestValidator.predicate("snapshot id exists", snapshotDetail.id.length > 0);
  TestValidator.predicate("snapshot price positive", snapshotDetail.price > 0);
  TestValidator.predicate(
    "snapshot created_at is string",
    typeof snapshotDetail.created_at === "string",
  );
}
