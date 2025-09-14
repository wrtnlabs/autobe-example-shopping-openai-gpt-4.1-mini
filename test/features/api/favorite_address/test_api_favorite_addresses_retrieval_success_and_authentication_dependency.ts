import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallFavoriteAddress } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallFavoriteAddress";
import type { IShoppingMallMemberUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallMemberUser";

export async function test_api_favorite_addresses_retrieval_success_and_authentication_dependency(
  connection: api.IConnection,
) {
  // 1. Member user joins
  const memberUser: IShoppingMallMemberUser.IAuthorized =
    await api.functional.auth.memberUser.join(connection, {
      body: {
        email: typia.random<string & tags.Format<"email">>(),
        password_hash: "securepasswordhash",
        nickname: RandomGenerator.name(),
        full_name: RandomGenerator.name(2),
        phone_number: null,
        status: "active",
      } satisfies IShoppingMallMemberUser.ICreate,
    });
  typia.assert(memberUser);

  // 2. Create a new favorite address for the member user
  // For snapshot ID, generate a random UUID string (since actual snapshot creation is outside scope)
  const snapshotId = typia.random<string & tags.Format<"uuid">>();

  const favoriteAddressCreateBody = {
    shopping_mall_memberuser_id: memberUser.id,
    shopping_mall_snapshot_id: snapshotId,
  } satisfies IShoppingMallFavoriteAddress.ICreate;

  const favoriteAddress: IShoppingMallFavoriteAddress =
    await api.functional.shoppingMall.memberUser.favoriteAddresses.create(
      connection,
      {
        body: favoriteAddressCreateBody,
      },
    );
  typia.assert(favoriteAddress);

  // 3. Retrieve the favorite address by ID
  const favoriteAddressRetrieved: IShoppingMallFavoriteAddress =
    await api.functional.shoppingMall.memberUser.favoriteAddresses.at(
      connection,
      {
        favoriteAddressId: favoriteAddress.id,
      },
    );
  typia.assert(favoriteAddressRetrieved);

  // 4. Validate the retrieved favorite address matches the created one
  TestValidator.equals(
    "Favorite address id matches",
    favoriteAddressRetrieved.id,
    favoriteAddress.id,
  );
  TestValidator.equals(
    "Favorite address member user id matches",
    favoriteAddressRetrieved.shopping_mall_memberuser_id,
    favoriteAddressCreateBody.shopping_mall_memberuser_id,
  );
  TestValidator.equals(
    "Favorite address snapshot id matches",
    favoriteAddressRetrieved.shopping_mall_snapshot_id,
    favoriteAddressCreateBody.shopping_mall_snapshot_id,
  );
  TestValidator.predicate(
    "Created at timestamp exists",
    typeof favoriteAddressRetrieved.created_at === "string" &&
      favoriteAddressRetrieved.created_at.length > 0,
  );
  TestValidator.predicate(
    "Updated at timestamp exists",
    typeof favoriteAddressRetrieved.updated_at === "string" &&
      favoriteAddressRetrieved.updated_at.length > 0,
  );
}
