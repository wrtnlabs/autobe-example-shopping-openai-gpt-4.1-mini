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
 * Test successful retrieval of paginated sale snapshots for an existing
 * sale product by admin user.
 *
 * Steps:
 *
 * 1. Authenticate as admin user using /auth/adminUser/join to create admin
 *    user.
 * 2. Create required dependencies in order: admin user, sales channel, seller
 *    user, sales product (with saleId).
 * 3. Request paginated list of sale snapshots for the product saleId.
 * 4. Validate pagination info and snapshot data structure in response.
 *
 * Include negative scenario where unauthorized access (no token) returns
 * 401 error.
 */
export async function test_api_sales_snapshots_index_as_admin_success(
  connection: api.IConnection,
) {
  // Step 1: Create and authenticate admin user
  const adminUserEmail: string = typia.random<string & tags.Format<"email">>();
  const adminUserPassword = RandomGenerator.alphaNumeric(16);
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

  // Step 2: Create sales channel
  const channelCode = RandomGenerator.alphabets(8);
  const channelName = RandomGenerator.name();
  const channel: IShoppingMallChannel =
    await api.functional.shoppingMall.adminUser.channels.create(connection, {
      body: {
        code: channelCode,
        name: channelName,
        description: "Sales channel for testing",
        status: "active",
      } satisfies IShoppingMallChannel.ICreate,
    });
  typia.assert(channel);

  // Step 3: Create and authenticate seller user
  const sellerUserEmail: string = typia.random<string & tags.Format<"email">>();
  const sellerUserPassword = RandomGenerator.alphaNumeric(16);
  const sellerUser: IShoppingMallSellerUser.IAuthorized =
    await api.functional.auth.sellerUser.join(connection, {
      body: {
        email: sellerUserEmail,
        password: sellerUserPassword,
        nickname: RandomGenerator.name(),
        full_name: RandomGenerator.name(),
        business_registration_number: RandomGenerator.alphaNumeric(12),
      } satisfies IShoppingMallSellerUser.ICreate,
    });
  typia.assert(sellerUser);

  // Step 4: Create sale product
  const saleCode = RandomGenerator.alphaNumeric(10);
  const saleProduct: IShoppingMallSale =
    await api.functional.shoppingMall.sellerUser.sales.create(connection, {
      body: {
        shopping_mall_channel_id: channel.id,
        shopping_mall_section_id: null,
        shopping_mall_seller_user_id: sellerUser.id,
        code: saleCode,
        status: "active",
        name: RandomGenerator.name(),
        description: "Sale product for snapshots test",
        price: typia.random<
          number & tags.Type<"uint32"> & tags.Minimum<1> & tags.Maximum<100000>
        >(),
      } satisfies IShoppingMallSale.ICreate,
    });
  typia.assert(saleProduct);

  // Step 5: Retrieve sale snapshots with pagination
  const pageNumber = 1;
  const pageLimit = 10;
  const snapshotRequestBody = {
    page: pageNumber,
    limit: pageLimit,
    filter: {
      saleId: saleProduct.id,
    },
  } satisfies IShoppingMallSaleSnapshot.IRequest;
  const snapshotsResponse: IPageIShoppingMallSaleSnapshot.ISummary =
    await api.functional.shoppingMall.adminUser.sales.snapshots.index(
      connection,
      {
        saleId: saleProduct.id,
        body: snapshotRequestBody,
      },
    );
  typia.assert(snapshotsResponse);

  // Step 6: Validate response contents
  TestValidator.predicate(
    "pagination current page equals request",
    snapshotsResponse.pagination.current === pageNumber,
  );
  TestValidator.predicate(
    "pagination limit equals request",
    snapshotsResponse.pagination.limit === pageLimit,
  );
  TestValidator.predicate(
    "pagination total pages positive",
    snapshotsResponse.pagination.pages >= 0,
  );
  TestValidator.predicate(
    "pagination total records non-negative",
    snapshotsResponse.pagination.records >= 0,
  );
  for (const snapshot of snapshotsResponse.data) {
    typia.assert(snapshot);
    TestValidator.predicate(
      "snapshot saleId equals requested saleId",
      snapshot.shopping_mall_sale_id === saleProduct.id,
    );
    TestValidator.predicate(
      "snapshot status is non-empty string",
      typeof snapshot.status === "string" && snapshot.status.length > 0,
    );
  }

  // Step 7: Unauthorized access should fail
  const unauthorizedConnection: api.IConnection = {
    ...connection,
    headers: {},
  };
  await TestValidator.error("unauthorized access returns 401", async () => {
    await api.functional.shoppingMall.adminUser.sales.snapshots.index(
      unauthorizedConnection,
      {
        saleId: saleProduct.id,
        body: snapshotRequestBody,
      },
    );
  });
}
