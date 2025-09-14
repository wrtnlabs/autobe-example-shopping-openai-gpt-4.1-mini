import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IShoppingMallAttachments } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAttachments";

export async function test_api_attachment_retrieve_success_and_failure_cases(
  connection: api.IConnection,
) {
  // 1. Attempt to retrieve attachment with a valid UUID
  const validId: string & tags.Format<"uuid"> = typia.random<
    string & tags.Format<"uuid">
  >();
  const response = await api.functional.shoppingMall.attachments.at(
    connection,
    { id: validId },
  );
  typia.assert(response);

  // Validate all required properties are present and conform to types
  TestValidator.predicate(
    "response.id is valid UUID",
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      response.id,
    ),
  );
  TestValidator.predicate(
    "response.file_name is non-empty string",
    typeof response.file_name === "string" && response.file_name.length > 0,
  );
  TestValidator.predicate(
    "response.file_url is valid URI",
    typeof response.file_url === "string" &&
      /^https?:\/\//.test(response.file_url),
  );
  TestValidator.predicate(
    "response.media_type is non-empty string",
    typeof response.media_type === "string" && response.media_type.length > 0,
  );
  TestValidator.predicate(
    "response.file_size is positive integer",
    typeof response.file_size === "number" &&
      Number.isInteger(response.file_size) &&
      response.file_size >= 0,
  );

  // Nullable properties: upload_ip and deleted_at can be string or null or undefined
  TestValidator.predicate(
    "response.upload_ip is string or null or undefined",
    response.upload_ip === null ||
      response.upload_ip === undefined ||
      typeof response.upload_ip === "string",
  );
  TestValidator.predicate(
    "response.deleted_at is string or null or undefined",
    response.deleted_at === null ||
      response.deleted_at === undefined ||
      (typeof response.deleted_at === "string" &&
        /^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(?:\.\d+)?Z$/.test(
          response.deleted_at,
        )),
  );

  // Validate timestamp properties created_at and updated_at
  TestValidator.predicate(
    "response.created_at is valid ISO date-time string",
    typeof response.created_at === "string" &&
      /^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(?:\.\d+)?Z$/.test(
        response.created_at,
      ),
  );
  TestValidator.predicate(
    "response.updated_at is valid ISO date-time string",
    typeof response.updated_at === "string" &&
      /^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(?:\.\d+)?Z$/.test(
        response.updated_at,
      ),
  );

  // 2. Attempt to retrieve attachment with a non-existent UUID and expect error
  const nonExistentId: string & tags.Format<"uuid"> =
    "00000000-0000-4000-8000-000000000000" satisfies string as string &
      tags.Format<"uuid">;
  await TestValidator.error(
    "fetch with non-existing ID should throw",
    async () => {
      await api.functional.shoppingMall.attachments.at(connection, {
        id: nonExistentId,
      });
    },
  );
}
