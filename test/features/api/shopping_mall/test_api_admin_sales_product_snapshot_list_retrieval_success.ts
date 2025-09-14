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
import type { IShoppingMallSection } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSection";
import type { IShoppingMallSellerUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSellerUser";

export async function test_api_admin_sales_product_snapshot_list_retrieval_success(
  connection: api.IConnection,
) {
  // 1. Create admin user (join and login to obtain auth token)
  const adminUserBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password_hash: RandomGenerator.alphaNumeric(12),
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(),
    status: "active",
  } satisfies IShoppingMallAdminUser.ICreate;
  const adminUser: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: adminUserBody,
    });
  typia.assert(adminUser);

  await api.functional.auth.adminUser.login(connection, {
    body: {
      email: adminUserBody.email,
      password_hash: adminUserBody.password_hash,
    } satisfies IShoppingMallAdminUser.ILogin,
  });

  // 2. Create sales channel by admin user
  const channelBody = {
    code: RandomGenerator.alphaNumeric(8),
    name: RandomGenerator.name(),
    description: RandomGenerator.paragraph(),
    status: "active",
  } satisfies IShoppingMallChannel.ICreate;
  const channel: IShoppingMallChannel =
    await api.functional.shoppingMall.adminUser.channels.create(connection, {
      body: channelBody,
    });
  typia.assert(channel);

  // 3. Create section by admin user
  const sectionBody = {
    code: RandomGenerator.alphaNumeric(8),
    name: RandomGenerator.name(),
    description: RandomGenerator.paragraph(),
    status: "active",
  } satisfies IShoppingMallSection.ICreate;
  const section: IShoppingMallSection =
    await api.functional.shoppingMall.adminUser.sections.create(connection, {
      body: sectionBody,
    });
  typia.assert(section);

  // 4. Create seller user (join and login for seller context)
  const sellerUserBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password: RandomGenerator.alphaNumeric(12),
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(),
    business_registration_number: RandomGenerator.alphaNumeric(10),
  } satisfies IShoppingMallSellerUser.ICreate;
  const sellerUser: IShoppingMallSellerUser.IAuthorized =
    await api.functional.auth.sellerUser.join(connection, {
      body: sellerUserBody,
    });
  typia.assert(sellerUser);

  await api.functional.auth.sellerUser.login(connection, {
    body: {
      email: sellerUserBody.email,
      password: sellerUserBody.password,
    } satisfies IShoppingMallSellerUser.ILogin,
  });

  // 5. Create a sale product by seller user tied to created channel and section
  const saleBody = {
    shopping_mall_channel_id: channel.id,
    shopping_mall_section_id: section.id,
    shopping_mall_seller_user_id: sellerUser.id,
    code: RandomGenerator.alphaNumeric(10),
    status: "active",
    name: RandomGenerator.name(),
    description: RandomGenerator.paragraph(),
    price: typia.random<number & tags.Type<"int32"> & tags.Minimum<1>>(),
  } satisfies IShoppingMallSale.ICreate;
  const sale: IShoppingMallSale =
    await api.functional.shoppingMall.sellerUser.sales.create(connection, {
      body: saleBody,
    });
  typia.assert(sale);

  // 6. Re-login as admin user to prepare for snapshot retrieval
  await api.functional.auth.adminUser.login(connection, {
    body: {
      email: adminUserBody.email,
      password_hash: adminUserBody.password_hash,
    } satisfies IShoppingMallAdminUser.ILogin,
  });

  // 7. Request paginated snapshots list for the created sale product
  const requestBody = {
    page: 1,
    limit: 10,
    filter: { saleId: sale.id },
  } satisfies IShoppingMallSaleSnapshot.IRequest;
  const snapshotsResponse: IPageIShoppingMallSaleSnapshot.ISummary =
    await api.functional.shoppingMall.adminUser.sales.snapshots.index(
      connection,
      { saleId: sale.id, body: requestBody },
    );
  typia.assert(snapshotsResponse);

  // 8. Validate pagination meta and snapshot summary array
  TestValidator.predicate(
    "pagination current page is 1",
    snapshotsResponse.pagination.current === 1,
  );
  TestValidator.predicate(
    "pagination limit is 10",
    snapshotsResponse.pagination.limit === 10,
  );
  TestValidator.predicate(
    "pagination pages and records are non-negative",
    snapshotsResponse.pagination.pages >= 0 &&
      snapshotsResponse.pagination.records >= 0,
  );
  TestValidator.predicate(
    "pagination total pages correct",
    snapshotsResponse.pagination.pages >=
      Math.ceil(
        snapshotsResponse.pagination.records /
          snapshotsResponse.pagination.limit,
      ),
  );
  TestValidator.predicate(
    "data is array",
    Array.isArray(snapshotsResponse.data),
  );
  for (const snapshot of snapshotsResponse.data) {
    typia.assert(snapshot);
    TestValidator.predicate(
      "snapshot id is UUID",
      typeof snapshot.id === "string" &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
          snapshot.id,
        ),
    );
    TestValidator.predicate(
      "snapshot shopping_mall_sale_id matches sale",
      snapshot.shopping_mall_sale_id === sale.id,
    );
    TestValidator.predicate(
      "snapshot status non-empty",
      typeof snapshot.status === "string" && snapshot.status.length > 0,
    );
    TestValidator.predicate(
      "snapshot price positive",
      typeof snapshot.price === "number" && snapshot.price >= 0,
    );
    TestValidator.predicate(
      "snapshot created_at is ISO date-time",
      typeof snapshot.created_at === "string" &&
        !isNaN(Date.parse(snapshot.created_at)),
    );
  }
}
