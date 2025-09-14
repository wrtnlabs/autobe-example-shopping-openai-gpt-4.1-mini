import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallChannel } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallChannel";
import type { IShoppingMallDelivery } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallDelivery";
import type { IShoppingMallMemberUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallMemberUser";
import type { IShoppingMallOrder } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallOrder";
import type { IShoppingMallSale } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSale";
import type { IShoppingMallSection } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSection";
import type { IShoppingMallSellerUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSellerUser";

/**
 * Test the successful creation of a delivery record for an order by a seller
 * user.
 *
 * The scenario covers the complete business workflow:
 *
 * 1. Seller user registration and authentication.
 * 2. Admin user registration, authentication, creation of sales channel.
 * 3. Admin creation of product section.
 * 4. Seller user creates sale product associated to channel and section.
 * 5. Member user registration and authentication.
 * 6. Member user places an order linked to member user, channel, and section.
 * 7. Seller user switches authentication and creates a delivery record for the
 *    order.
 * 8. All created entities and responses are validated for correctness.
 *
 * This ensures complete role-based permissions, entity relationships, and
 * status tracking.
 */
export async function test_api_order_delivery_create_success_sellerrole(
  connection: api.IConnection,
) {
  // 1. Seller user registration and authentication
  const sellerEmail = typia.random<string & tags.Format<"email">>();
  const sellerPassword = "1234";
  const sellerUser: IShoppingMallSellerUser.IAuthorized =
    await api.functional.auth.sellerUser.join(connection, {
      body: {
        email: sellerEmail,
        password: sellerPassword,
        nickname: RandomGenerator.name(),
        full_name: RandomGenerator.name(),
        phone_number: RandomGenerator.mobile(),
        business_registration_number: RandomGenerator.alphaNumeric(12),
      } satisfies IShoppingMallSellerUser.ICreate,
    });
  typia.assert(sellerUser);

  // 2. Admin user registration and authentication
  const adminEmail: string = typia.random<string & tags.Format<"email">>();
  const adminPassword = "1234";
  const adminUser: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: {
        email: adminEmail,
        password_hash: adminPassword,
        nickname: RandomGenerator.name(),
        full_name: RandomGenerator.name(),
        status: "active",
      } satisfies IShoppingMallAdminUser.ICreate,
    });
  typia.assert(adminUser);

  // 3. Admin creates a sales channel
  const channelCode = RandomGenerator.alphaNumeric(8);
  const channel: IShoppingMallChannel =
    await api.functional.shoppingMall.adminUser.channels.create(connection, {
      body: {
        code: channelCode,
        name: RandomGenerator.name(),
        description: null,
        status: "active",
      } satisfies IShoppingMallChannel.ICreate,
    });
  typia.assert(channel);

  // 4. Admin creates a product section
  const sectionCode = RandomGenerator.alphaNumeric(8);
  const section: IShoppingMallSection =
    await api.functional.shoppingMall.adminUser.sections.create(connection, {
      body: {
        code: sectionCode,
        name: RandomGenerator.name(),
        description: null,
        status: "active",
      } satisfies IShoppingMallSection.ICreate,
    });
  typia.assert(section);

  // 5. Seller user creates a sale product
  await api.functional.auth.sellerUser.login(connection, {
    body: {
      email: sellerEmail,
      password: sellerPassword,
    } satisfies IShoppingMallSellerUser.ILogin,
  });

  const saleProduct: IShoppingMallSale =
    await api.functional.shoppingMall.sellerUser.sales.create(connection, {
      body: {
        shopping_mall_channel_id: channel.id,
        shopping_mall_section_id: section.id,
        shopping_mall_seller_user_id: sellerUser.id,
        code: RandomGenerator.alphaNumeric(12),
        status: "active",
        name: RandomGenerator.name(),
        description: null,
        price: typia.random<number & tags.Type<"uint32"> & tags.Minimum<1>>(),
      } satisfies IShoppingMallSale.ICreate,
    });
  typia.assert(saleProduct);

  // 6. Member user registration and authentication
  const memberEmail = typia.random<string & tags.Format<"email">>();
  const memberPassword = "1234";
  const memberUser: IShoppingMallMemberUser.IAuthorized =
    await api.functional.auth.memberUser.join(connection, {
      body: {
        email: memberEmail,
        password_hash: memberPassword,
        nickname: RandomGenerator.name(),
        full_name: RandomGenerator.name(),
        phone_number: RandomGenerator.mobile(),
        status: "active",
      } satisfies IShoppingMallMemberUser.ICreate,
    });
  typia.assert(memberUser);

  await api.functional.auth.memberUser.login(connection, {
    body: {
      email: memberEmail,
      password: memberPassword,
    } satisfies IShoppingMallMemberUser.ILogin,
  });

  // 7. Member user places an order
  const orderCode = RandomGenerator.alphaNumeric(16);
  const order: IShoppingMallOrder =
    await api.functional.shoppingMall.memberUser.orders.createOrder(
      connection,
      {
        body: {
          shopping_mall_memberuser_id: memberUser.id,
          shopping_mall_channel_id: channel.id,
          shopping_mall_section_id: section.id,
          order_code: orderCode,
          order_status: "pending",
          payment_status: "pending",
          total_price: saleProduct.price,
        } satisfies IShoppingMallOrder.ICreate,
      },
    );
  typia.assert(order);

  // 8. Seller user switch authentication and create delivery record
  await api.functional.auth.sellerUser.login(connection, {
    body: {
      email: sellerEmail,
      password: sellerPassword,
    } satisfies IShoppingMallSellerUser.ILogin,
  });

  const now = new Date();
  const isoNow = now.toISOString();

  const deliveryInput: IShoppingMallDelivery.ICreate = {
    shopping_mall_order_id: order.id,
    delivery_status: "preparing",
    delivery_stage: "preparation",
    expected_delivery_date: null,
    start_time: isoNow,
    end_time: null,
  };

  const delivery: IShoppingMallDelivery =
    await api.functional.shoppingMall.sellerUser.orders.deliveries.create(
      connection,
      {
        orderId: order.id,
        body: deliveryInput,
      },
    );
  typia.assert(delivery);

  // Validate properties returned
  TestValidator.equals(
    "delivery order id matches",
    delivery.shopping_mall_order_id,
    order.id,
  );
  TestValidator.equals(
    "delivery status is preparing",
    delivery.delivery_status,
    deliveryInput.delivery_status,
  );
  TestValidator.equals(
    "delivery stage is preparation",
    delivery.delivery_stage,
    deliveryInput.delivery_stage,
  );

  TestValidator.predicate(
    "delivery created_at is valid ISO date",
    typeof delivery.created_at === "string" &&
      delivery.created_at.length > 0 &&
      !Number.isNaN(Date.parse(delivery.created_at)),
  );
  TestValidator.predicate(
    "delivery updated_at is valid ISO date",
    typeof delivery.updated_at === "string" &&
      delivery.updated_at.length > 0 &&
      !Number.isNaN(Date.parse(delivery.updated_at)),
  );
}
