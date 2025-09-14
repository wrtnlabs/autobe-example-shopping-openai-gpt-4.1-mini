import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallChannel } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallChannel";
import type { IShoppingMallMemberUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallMemberUser";
import type { IShoppingMallOrder } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallOrder";
import type { IShoppingMallPayment } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallPayment";
import type { IShoppingMallSale } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSale";
import type { IShoppingMallSection } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSection";
import type { IShoppingMallSellerUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSellerUser";

export async function test_api_payment_update_order_payment_authorized(
  connection: api.IConnection,
) {
  // 1. Create admin user and authenticate
  const adminEmail: string = typia.random<string & tags.Format<"email">>();
  const adminPassword: string = RandomGenerator.alphaNumeric(12);
  const adminUser: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: {
        email: adminEmail,
        password_hash: adminPassword,
        nickname: RandomGenerator.name(),
        full_name: RandomGenerator.name(2),
        status: "active",
      } satisfies IShoppingMallAdminUser.ICreate,
    });
  typia.assert(adminUser);

  // 2. Create member user
  const memberEmail: string = typia.random<string & tags.Format<"email">>();
  const memberPasswordHash: string = RandomGenerator.alphaNumeric(12);
  const memberUser: IShoppingMallMemberUser.IAuthorized =
    await api.functional.auth.memberUser.join(connection, {
      body: {
        email: memberEmail,
        password_hash: memberPasswordHash,
        nickname: RandomGenerator.name(),
        full_name: RandomGenerator.name(2),
        status: "active",
      } satisfies IShoppingMallMemberUser.ICreate,
    });
  typia.assert(memberUser);

  // 3. Create seller user
  const sellerEmail: string = typia.random<string & tags.Format<"email">>();
  const sellerPassword: string = RandomGenerator.alphaNumeric(12);
  const sellerUser: IShoppingMallSellerUser.IAuthorized =
    await api.functional.auth.sellerUser.join(connection, {
      body: {
        email: sellerEmail,
        password: sellerPassword,
        nickname: RandomGenerator.name(),
        full_name: RandomGenerator.name(2),
        business_registration_number: RandomGenerator.alphaNumeric(10),
      } satisfies IShoppingMallSellerUser.ICreate,
    });
  typia.assert(sellerUser);

  // 4. Create sales channel
  await api.functional.auth.adminUser.login(connection, {
    body: {
      email: adminEmail,
      password_hash: adminPassword,
    } satisfies IShoppingMallAdminUser.ILogin,
  });
  const channelCode = `chan_${RandomGenerator.alphaNumeric(6)}`;
  const channel = await api.functional.shoppingMall.adminUser.channels.create(
    connection,
    {
      body: {
        code: channelCode,
        name: RandomGenerator.name(2),
        status: "active",
        description: null,
      } satisfies IShoppingMallChannel.ICreate,
    },
  );
  typia.assert(channel);

  // 5. Create section
  const sectionCode = `sect_${RandomGenerator.alphaNumeric(6)}`;
  const section = await api.functional.shoppingMall.adminUser.sections.create(
    connection,
    {
      body: {
        code: sectionCode,
        name: RandomGenerator.name(2),
        status: "active",
        description: null,
      } satisfies IShoppingMallSection.ICreate,
    },
  );
  typia.assert(section);

  // 6. Authenticate as seller user
  await api.functional.auth.sellerUser.login(connection, {
    body: {
      email: sellerEmail,
      password: sellerPassword,
    } satisfies IShoppingMallSellerUser.ILogin,
  });

  // 7. Create sales product
  const saleCode = `sale_${RandomGenerator.alphaNumeric(8)}`;
  const salesProduct =
    await api.functional.shoppingMall.sellerUser.sales.create(connection, {
      body: {
        shopping_mall_channel_id: channel.id,
        shopping_mall_section_id: section.id,
        shopping_mall_seller_user_id: sellerUser.id,
        code: saleCode,
        status: "active",
        name: RandomGenerator.name(3),
        description: null,
        price: typia.random<number & tags.Type<"uint32"> & tags.Minimum<1>>(),
      } satisfies IShoppingMallSale.ICreate,
    });
  typia.assert(salesProduct);

  // 8. Authenticate as admin user
  await api.functional.auth.adminUser.login(connection, {
    body: {
      email: adminEmail,
      password_hash: adminPassword,
    } satisfies IShoppingMallAdminUser.ILogin,
  });

  // 9. Create order
  const orderCode = `order_${RandomGenerator.alphaNumeric(8)}`;
  const orderStatus = "pending";
  const paymentStatus = "pending";
  const totalPrice = salesProduct.price;
  const order = await api.functional.shoppingMall.adminUser.orders.createOrder(
    connection,
    {
      body: {
        shopping_mall_memberuser_id: memberUser.id,
        shopping_mall_channel_id: channel.id,
        shopping_mall_section_id: section.id,
        order_code: orderCode,
        order_status: orderStatus,
        payment_status: paymentStatus,
        total_price: totalPrice,
      } satisfies IShoppingMallOrder.ICreate,
    },
  );
  typia.assert(order);

  // 10. Create initial payment application
  const initialPaymentMethod = "credit_card";
  const initialPaymentStatus = "pending";
  const paymentAmount = totalPrice;
  const paymentApplication =
    await api.functional.shoppingMall.adminUser.orders.payments.create(
      connection,
      {
        orderId: order.id,
        body: {
          shopping_mall_order_id: order.id,
          payment_method: initialPaymentMethod,
          payment_status: initialPaymentStatus,
          payment_amount: paymentAmount,
          transaction_id: null,
        } satisfies IShoppingMallPayment.ICreate,
      },
    );
  typia.assert(paymentApplication);

  // 11. Update payment application successfully
  const updatedPaymentMethod = "bank_transfer";
  const updatedPaymentStatus = "confirmed";
  const updatedPayment =
    await api.functional.shoppingMall.adminUser.orders.payments.update(
      connection,
      {
        orderId: order.id,
        paymentId: paymentApplication.id,
        body: {
          payment_method: updatedPaymentMethod,
          payment_status: updatedPaymentStatus,
        } satisfies IShoppingMallPayment.IUpdate,
      },
    );
  typia.assert(updatedPayment);

  TestValidator.equals(
    "payment method updated",
    updatedPayment.payment_method,
    updatedPaymentMethod,
  );
  TestValidator.equals(
    "payment status updated",
    updatedPayment.payment_status,
    updatedPaymentStatus,
  );
}
