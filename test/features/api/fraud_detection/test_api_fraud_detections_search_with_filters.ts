import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IPage } from "@ORGANIZATION/PROJECT-api/lib/structures/IPage";
import type { IPageIShoppingMallFraudDetection } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageIShoppingMallFraudDetection";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallFraudDetection } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallFraudDetection";

/**
 * This E2E test validates the search functionality of fraud detection
 * records by an admin user filtering by user ID and detection type.
 *
 * It starts by creating a new admin user account using the join API,
 * establishing the authentication context for further operations.
 *
 * Then it values appropriate filters (user ID and detection type), paging
 * parameters, and calls the fraudDetections index API with a PATCH
 * request.
 *
 * The response should be a paginated list of fraud detection summary
 * records, where each record must match the user ID and detection type
 * filter criteria.
 *
 * The test asserts the structure, pagination consistency, and filtering
 * accuracy of the response data.
 */
export async function test_api_fraud_detections_search_with_filters(
  connection: api.IConnection,
) {
  // 1. Create admin user and authenticate
  const adminCreateBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password_hash: RandomGenerator.alphaNumeric(16),
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(),
    status: "active",
  } satisfies IShoppingMallAdminUser.ICreate;

  const adminUser: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: adminCreateBody,
    });
  typia.assert(adminUser);

  // 2. Prepare filters for searching fraud detections
  const userIdFilter: string = typia.random<string & tags.Format<"uuid">>();
  const detectionTypeFilter: string = "payment";

  // 3. Construct request body for searching fraud detections
  const requestBody = {
    page: 0,
    limit: 10,
    user_id: userIdFilter,
    detection_type: detectionTypeFilter,
    order_id: null,
    resolution_status: null,
    detected_start: null,
    detected_end: null,
  } satisfies IShoppingMallFraudDetection.IRequest;

  // 4. Call the patch search API
  const response: IPageIShoppingMallFraudDetection.ISummary =
    await api.functional.shoppingMall.adminUser.fraudDetections.index(
      connection,
      { body: requestBody },
    );

  typia.assert(response);

  // 5. Validate the pagination fields
  TestValidator.predicate(
    "pagination current page is non-negative",
    response.pagination.current >= 0,
  );
  TestValidator.predicate(
    "pagination limit is positive",
    response.pagination.limit > 0,
  );
  TestValidator.predicate(
    "pagination pages is zero or positive",
    response.pagination.pages >= 0,
  );
  TestValidator.predicate(
    "pagination records count is non-negative",
    response.pagination.records >= 0,
  );

  // 6. Validate each data entry matches the filters
  for (const detection of response.data) {
    typia.assert(detection); // each detection valid
    TestValidator.equals(
      "user id filter matches",
      detection.user_id,
      userIdFilter,
    );
    TestValidator.equals(
      "detection type filter matches",
      detection.detection_type,
      detectionTypeFilter,
    );
  }
}
