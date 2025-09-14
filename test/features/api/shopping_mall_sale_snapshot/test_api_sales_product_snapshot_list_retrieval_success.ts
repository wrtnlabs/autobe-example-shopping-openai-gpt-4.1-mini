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

export async function test_api_sales_product_snapshot_list_retrieval_success(
  connection: api.IConnection,
) {
  // 1. Create admin user (to allow channel and section creation)
  const adminUserEmail = typia.random<string & tags.Format<"email">>();
  const adminUserPassword = "AdminPass123!";
  const adminUser: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: {
        email: adminUserEmail,
        password_hash: adminUserPassword,
        nickname: RandomGenerator.name(),
        full_name: RandomGenerator.name(),
        status: "active",
      } satisfies IShoppingMallAdminUser.ICreate,
    });
  typia.assert(adminUser);

  // 2. Admin user login for proper authorization context
  await api.functional.auth.adminUser.login(connection, {
    body: {
      email: adminUserEmail,
      password_hash: adminUserPassword,
    } satisfies IShoppingMallAdminUser.ILogin,
  });

  // 3. Create a shopping mall sales channel using admin authorization
  const channelCode = RandomGenerator.alphaNumeric(8);
  const channel: IShoppingMallChannel =
    await api.functional.shoppingMall.adminUser.channels.create(connection, {
      body: {
        code: channelCode,
        name: RandomGenerator.name(),
        status: "active",
      } satisfies IShoppingMallChannel.ICreate,
    });
  typia.assert(channel);

  // 4. Create a shopping mall spatial section using admin authorization
  const sectionCode = RandomGenerator.alphaNumeric(8);
  const section: IShoppingMallSection =
    await api.functional.shoppingMall.adminUser.sections.create(connection, {
      body: {
        code: sectionCode,
        name: RandomGenerator.name(),
        status: "active",
      } satisfies IShoppingMallSection.ICreate,
    });
  typia.assert(section);

  // 5. Create seller user
  const sellerUserEmail = typia.random<string & tags.Format<"email">>();
  const sellerUserPassword = "SellerPass123!";
  const sellerUser: IShoppingMallSellerUser.IAuthorized =
    await api.functional.auth.sellerUser.join(connection, {
      body: {
        email: sellerUserEmail,
        password: sellerUserPassword,
        nickname: RandomGenerator.name(),
        full_name: RandomGenerator.name(),
        phone_number: RandomGenerator.mobile(),
        business_registration_number: "BRN123456789",
      } satisfies IShoppingMallSellerUser.ICreate,
    });
  typia.assert(sellerUser);

  // 6. Seller user login
  await api.functional.auth.sellerUser.login(connection, {
    body: {
      email: sellerUserEmail,
      password: sellerUserPassword,
    } satisfies IShoppingMallSellerUser.ILogin,
  });

  // 7. Create a sale product with the seller user
  const saleProductCode = RandomGenerator.alphaNumeric(10);
  const saleProduct: IShoppingMallSale =
    await api.functional.shoppingMall.sellerUser.sales.create(connection, {
      body: {
        shopping_mall_channel_id: channel.id,
        shopping_mall_section_id: section.id,
        shopping_mall_seller_user_id: sellerUser.id,
        code: saleProductCode,
        status: "active",
        name: RandomGenerator.name(),
        description: RandomGenerator.paragraph({ sentences: 3 }),
        price: 10000,
      } satisfies IShoppingMallSale.ICreate,
    });
  typia.assert(saleProduct);

  // 8. Retrieve snapshots list for the sale product with filters and pagination
  const requestBody: IShoppingMallSaleSnapshot.IRequest = {
    page: 1,
    limit: 10,
    filter: {
      searchText: saleProduct.name.substring(0, 3),
      saleId: saleProduct.id,
      statuses: ["active", "paused"],
    },
  };

  const snapshotsPage: IPageIShoppingMallSaleSnapshot.ISummary =
    await api.functional.shoppingMall.sellerUser.sales.snapshots.index(
      connection,
      {
        saleId: saleProduct.id,
        body: requestBody,
      },
    );
  typia.assert(snapshotsPage);

  // 9. Validate pagination metadata
  TestValidator.predicate(
    "valid current page",
    snapshotsPage.pagination.current === 1,
  );
  TestValidator.predicate("valid limit", snapshotsPage.pagination.limit === 10);
  TestValidator.predicate(
    "valid total records",
    snapshotsPage.pagination.records >= 0,
  );
  TestValidator.predicate(
    "valid total pages",
    snapshotsPage.pagination.pages >= 0,
  );

  // 10. Validate snapshot summaries properties
  for (const snapshot of snapshotsPage.data) {
    TestValidator.equals(
      "snapshot sale id",
      snapshot.shopping_mall_sale_id,
      saleProduct.id,
    );
    TestValidator.predicate(
      "snapshot has id",
      typeof snapshot.id === "string" && snapshot.id.length > 0,
    );
    TestValidator.predicate(
      "snapshot has name",
      typeof snapshot.name === "string" && snapshot.name.length > 0,
    );
    TestValidator.predicate(
      "snapshot has status",
      typeof snapshot.status === "string" && snapshot.status.length > 0,
    );
    TestValidator.predicate(
      "snapshot has created timestamp",
      typeof snapshot.created_at === "string" && snapshot.created_at.length > 0,
    );
  }
}
