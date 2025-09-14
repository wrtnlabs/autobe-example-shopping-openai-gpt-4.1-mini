import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallCategory } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCategory";
import type { IShoppingMallSale } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSale";
import type { IShoppingMallSaleUnit } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSaleUnit";
import type { IShoppingMallSaleUnitOption } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSaleUnitOption";
import type { IShoppingMallSellerUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSellerUser";

export async function test_api_sales_sale_unit_option_update_admin_success_unauthorized_not_found_validation(
  connection: api.IConnection,
) {
  // Step 1: AdminUser join and login to obtain authentication
  const adminEmail = typia.random<string & tags.Format<"email">>();
  const adminPasswordHash = "admin_password_123";
  const adminUser: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: {
        email: adminEmail,
        password_hash: adminPasswordHash,
        nickname: RandomGenerator.name(),
        full_name: RandomGenerator.name(2),
        status: "active",
      } satisfies IShoppingMallAdminUser.ICreate,
    });
  typia.assert(adminUser);

  await api.functional.auth.adminUser.login(connection, {
    body: {
      email: adminEmail,
      password_hash: adminPasswordHash,
    } satisfies IShoppingMallAdminUser.ILogin,
  });

  // Step 2: Create a category
  const category: IShoppingMallCategory =
    await api.functional.shoppingMall.adminUser.categories.create(connection, {
      body: {
        code: RandomGenerator.alphaNumeric(6),
        name: RandomGenerator.name(2),
        status: "active",
        description: RandomGenerator.paragraph({ sentences: 2 }),
      } satisfies IShoppingMallCategory.ICreate,
    });
  typia.assert(category);

  // Step 3: SellerUser join and login
  const sellerEmail = typia.random<string & tags.Format<"email">>();
  const sellerPassword = "seller_password_123";
  const sellerUser: IShoppingMallSellerUser.IAuthorized =
    await api.functional.auth.sellerUser.join(connection, {
      body: {
        email: sellerEmail,
        password: sellerPassword,
        nickname: RandomGenerator.name(),
        full_name: RandomGenerator.name(2),
        business_registration_number: RandomGenerator.alphaNumeric(12),
      } satisfies IShoppingMallSellerUser.ICreate,
    });
  typia.assert(sellerUser);

  await api.functional.auth.sellerUser.login(connection, {
    body: {
      email: sellerEmail,
      password: sellerPassword,
    } satisfies IShoppingMallSellerUser.ILogin,
  });

  // Step 4: Create sales product
  const saleProduct: IShoppingMallSale =
    await api.functional.shoppingMall.sellerUser.sales.create(connection, {
      body: {
        shopping_mall_channel_id: typia.random<string & tags.Format<"uuid">>(),
        shopping_mall_section_id: null,
        shopping_mall_seller_user_id: sellerUser.id,
        code: RandomGenerator.alphaNumeric(8),
        status: "active",
        name: RandomGenerator.name(3),
        description: RandomGenerator.paragraph({ sentences: 4 }),
        price: 10000,
      } satisfies IShoppingMallSale.ICreate,
    });
  typia.assert(saleProduct);

  // Step 5: Create sale unit
  const saleUnit: IShoppingMallSaleUnit =
    await api.functional.shoppingMall.sellerUser.sales.saleUnits.create(
      connection,
      {
        saleId: saleProduct.id,
        body: {
          shopping_mall_sale_id: saleProduct.id,
          code: RandomGenerator.alphaNumeric(6),
          name: RandomGenerator.name(2),
          description: RandomGenerator.paragraph({ sentences: 3 }),
        } satisfies IShoppingMallSaleUnit.ICreate,
      },
    );
  typia.assert(saleUnit);

  // Step 6: Create sale unit option
  const saleUnitOption: IShoppingMallSaleUnitOption =
    await api.functional.shoppingMall.adminUser.sales.saleUnits.saleUnitOptions.create(
      connection,
      {
        saleId: saleProduct.id,
        saleUnitId: saleUnit.id,
        body: {
          shopping_mall_sale_unit_id: saleUnit.id,
          shopping_mall_sale_option_id: typia.random<
            string & tags.Format<"uuid">
          >(),
          additional_price: 3000,
          stock_quantity: 50,
        } satisfies IShoppingMallSaleUnitOption.ICreate,
      },
    );
  typia.assert(saleUnitOption);

  // Step 7: Successful update with admin user
  const updateBody1 = {
    additional_price: 4000,
    stock_quantity: 40,
  } satisfies IShoppingMallSaleUnitOption.IUpdate;

  const updatedOption1: IShoppingMallSaleUnitOption =
    await api.functional.shoppingMall.adminUser.sales.saleUnits.saleUnitOptions.update(
      connection,
      {
        saleId: saleProduct.id,
        saleUnitId: saleUnit.id,
        saleUnitOptionId: saleUnitOption.id,
        body: updateBody1,
      },
    );
  typia.assert(updatedOption1);

  TestValidator.equals(
    "additional price updated",
    updatedOption1.additional_price,
    updateBody1.additional_price,
  );

  TestValidator.equals(
    "stock quantity updated",
    updatedOption1.stock_quantity,
    updateBody1.stock_quantity,
  );

  // Step 8: Test unauthorized access (use unauthenticated connection)
  const unauthenticatedConnection: api.IConnection = {
    ...connection,
    headers: {},
  };

  await TestValidator.error("unauthorized update should fail", async () => {
    await api.functional.shoppingMall.adminUser.sales.saleUnits.saleUnitOptions.update(
      unauthenticatedConnection,
      {
        saleId: saleProduct.id,
        saleUnitId: saleUnit.id,
        saleUnitOptionId: saleUnitOption.id,
        body: {
          additional_price: 5000,
        } satisfies IShoppingMallSaleUnitOption.IUpdate,
      },
    );
  });

  // Step 9: Test not found errors for invalid ids
  const invalidUuid1 = typia.random<string & tags.Format<"uuid">>();
  const invalidUuid2 = typia.random<string & tags.Format<"uuid">>();
  const invalidUuid3 = typia.random<string & tags.Format<"uuid">>();

  // SaleId invalid
  await TestValidator.error(
    "update with invalid saleId should fail",
    async () => {
      await api.functional.shoppingMall.adminUser.sales.saleUnits.saleUnitOptions.update(
        connection,
        {
          saleId: invalidUuid1,
          saleUnitId: saleUnit.id,
          saleUnitOptionId: saleUnitOption.id,
          body: {
            additional_price: 6000,
          } satisfies IShoppingMallSaleUnitOption.IUpdate,
        },
      );
    },
  );

  // saleUnitId invalid
  await TestValidator.error(
    "update with invalid saleUnitId should fail",
    async () => {
      await api.functional.shoppingMall.adminUser.sales.saleUnits.saleUnitOptions.update(
        connection,
        {
          saleId: saleProduct.id,
          saleUnitId: invalidUuid2,
          saleUnitOptionId: saleUnitOption.id,
          body: {
            stock_quantity: 45,
          } satisfies IShoppingMallSaleUnitOption.IUpdate,
        },
      );
    },
  );

  // saleUnitOptionId invalid
  await TestValidator.error(
    "update with invalid saleUnitOptionId should fail",
    async () => {
      await api.functional.shoppingMall.adminUser.sales.saleUnits.saleUnitOptions.update(
        connection,
        {
          saleId: saleProduct.id,
          saleUnitId: saleUnit.id,
          saleUnitOptionId: invalidUuid3,
          body: {
            additional_price: 7000,
            stock_quantity: 35,
          } satisfies IShoppingMallSaleUnitOption.IUpdate,
        },
      );
    },
  );
}
