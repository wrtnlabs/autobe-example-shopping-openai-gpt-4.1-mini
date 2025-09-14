import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";

export async function test_api_sale_option_group_delete_admin_permission_denied(
  connection: api.IConnection,
) {
  // Generate a random UUID for saleOptionGroupId to simulate deletion
  const invalidSaleOptionGroupId: string & tags.Format<"uuid"> = typia.random<
    string & tags.Format<"uuid">
  >();

  // Attempt to delete the sale option group without proper authorization.
  // Expect the API call to throw an error due to permission denial.
  await TestValidator.error(
    "delete sale option group without admin permission should be denied",
    async () => {
      await api.functional.shoppingMall.adminUser.saleOptionGroups.erase(
        connection,
        {
          saleOptionGroupId: invalidSaleOptionGroupId,
        },
      );
    },
  );
}
