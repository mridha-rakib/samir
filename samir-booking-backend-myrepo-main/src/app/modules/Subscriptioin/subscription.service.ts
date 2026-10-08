import {
  PaymentProvider,
  PaymentStatus,
  Prisma,
  SubscriptionPlan,
  SubscriptionStatus,
} from "@prisma/client";
import prisma from "../../../shared/prisma";
import ApiError from "../../../errors/ApiErrors";
import httpStatus from "http-status";
import {
  ICreateSubscriptionPlan,
  ISubscriptionFilterRequest,
} from "./subscription.interface";
import stripe from "../../../helpars/stripe";
import Stripe from "stripe";
import { IPaginationOptions } from "../../../interfaces/paginations";
import { paginationHelpers } from "../../../helpars/paginationHelper";

// ----------------------------subscription plan--------------------------------

// create subscription plan
const createSubscriptionPlan = async (
  data: ICreateSubscriptionPlan,
  userId?: string,
) => {
  // create stripe product
  const product = await stripe.products.create({ name: data.name });

  // stripe recurring price
  const price = await stripe.prices.create({
    currency: data.price.currency.toLowerCase(),
    unit_amount: Math.round(data.price.amount * 100), // convert dollars to cents
    recurring: {
      interval: data.validity.type === "months" ? "month" : "year",
      interval_count: data.validity.value,
    },
    product: product.id,
  });

  const newPlan = await prisma.subscriptionPlan.create({
    data: {
      name: data.name,
      features: data.features,
      price: { set: data.price },
      validity: { set: data.validity },
      userId,
      stripeProductId: product.id,
      stripePriceId: price.id,
    },
  });

  return newPlan;
};

// get all subscriptions
const getAllSubscriptionsPlan = async (
  searchQuery?: string,
  skip: number = 0,
  limit: number = 10,
): Promise<any[]> => {
  const where: any = {};
  if (searchQuery) {
    where.OR = [
      { name: { $contains: searchQuery } },
      { features: { hasSome: [searchQuery] } },
    ];
  }

  // fetch plans
  let plans = await prisma.subscriptionPlan.findMany({
    where,
    skip,
    take: limit,
  });

  if (plans.length === 0 && !searchQuery) {
    console.log("[SubscriptionService] No plans found in database. Seeding default Property Owner Plan...");
    try {
      const defaultPlan = await createSubscriptionPlan({
        name: "Property Owner Plan",
        price: { amount: 50, currency: "USD" },
        validity: { value: 1, type: "years" },
        features: [
          "Manage multiple properties",
          "Assign security guards",
          "Automated WhatsApp alerts",
          "Direct payment to service providers",
          "24/7 assistant support"
        ]
      });
      plans = [defaultPlan];
    } catch (err: any) {
      console.error("[SubscriptionService] Failed to seed default subscription plan:", err.message || err);
    }
  }

  // Count active purchase subscriptions per plan
  const activeCounts = await prisma.purchase_subscription.groupBy({
    by: ['planId'],
    where: { status: SubscriptionStatus.ACTIVE },
    _count: { _all: true },
  });
  const countMap = Object.fromEntries(
    activeCounts.map((c) => [c.planId, c._count._all])
  );

  // attach user count
  const enrichedPlans = plans.map((plan) => ({
    ...plan,
    activeUserCount: countMap[plan.id] ?? 0,
  }));

  return enrichedPlans;
};

// get specific subscriptionPlan
const getSpecificSubscriptionPlan = async (
  id: string,
): Promise<SubscriptionPlan | null> => {
  return await prisma.subscriptionPlan.findUnique({
    where: { id },
  });
};

// update specific subscriptionPlan
const updateSpecificSubscriptionPlan = async (
  id: string,
  data: Partial<ICreateSubscriptionPlan>,
): Promise<SubscriptionPlan> => {
  return await prisma.subscriptionPlan.update({
    where: { id },
    data,
  });
};

// delete specific subscriptionPlan
const deleteSpecificSubscriptionPlan = async (
  id: string,
): Promise<SubscriptionPlan> => {
  // First, delete any purchase subscriptions that reference this plan
  await prisma.purchase_subscription.deleteMany({
    where: {
      planId: id,
    },
  });

  return await prisma.subscriptionPlan.delete({
    where: { id },
  });
};

// ----------------------------subscription--------------------------------

// get all purchase subscription
const getAllPurchaseSubscription = async (
  params: ISubscriptionFilterRequest,
  options: IPaginationOptions,
) => {
  const { limit, page, skip } = paginationHelpers.calculatedPagination(options);

  const { searchTerm, ...filterData } = params;

  const filters: Prisma.Purchase_subscriptionWhereInput[] = [];

  // Exact search filter
  const validFilterKeys = Object.keys(filterData).filter(
    (key) =>
      (filterData as any)[key] !== undefined &&
      (filterData as any)[key] !== "undefined"
  );

  if (validFilterKeys.length > 0) {
    filters.push({
      AND: validFilterKeys.map((key) => ({
        [key]: {
          equals: (filterData as any)[key],
        },
      })),
    });
  }

  const where: Prisma.Purchase_subscriptionWhereInput = {
    AND: filters,
  };

  const subscriptions = await prisma.purchase_subscription.findMany({
    where,
    skip,
    take: limit,
    orderBy:
      options.sortBy && options.sortOrder
        ? { [options.sortBy]: options.sortOrder }
        : { createdAt: "desc" },
    select: {
      id: true,
      startDate: true,
      endDate: true,
      cancelAtPeriodEnd: true,
      status: true,
      userId: true,
      planId: true,
      user: {
        select: {
          id: true,
          fullName: true,
        },
      },
      plan: {
        select: {
          name: true,
          price: true,
          validity: true,
        },
      },
    },
  });

  const total = await prisma.purchase_subscription.count({ where });

  return {
    meta: {
      total,
      page,
      limit,
    },
    data: subscriptions,
  };
};

// get my purchase subscription
const getMyPurchaseSubscription = async (userId: string) => {
  const subscriptions = await prisma.purchase_subscription.findMany({
    where: { userId },
    select: {
      id: true,
      startDate: true,
      endDate: true,
      cancelAtPeriodEnd: true,
      status: true,
      userId: true,
      planId: true,
      user: {
        select: {
          id: true,
          fullName: true,
        },
      },
      plan: {
        select: {
          name: true,
          price: true,
          validity: true,
        },
      },
    },
  });

  return subscriptions;
};

// create subscriptions
const createSubscription = async (userId: string, planId: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const plan = await prisma.subscriptionPlan.findUnique({
    where: { id: planId },
  });

  if (!user || !plan)
    throw new ApiError(httpStatus.NOT_FOUND, "User or plan not found");

  // create stripe customer if not already
  let stripeCustomerId = user.stripeCustomerId;
  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.fullName ?? undefined,
    });
    stripeCustomerId = customer.id;
    await prisma.user.update({
      where: { id: userId },
      data: { stripeCustomerId },
    });
  }

  // create subscription
  const subscription = await stripe.subscriptions.create({
    customer: stripeCustomerId,
    items: [{ price: plan.stripePriceId! }],
    payment_behavior: "default_incomplete",
    expand: ["latest_invoice.payment_intent"],
  });

  const latestInvoice = subscription.latest_invoice as Stripe.Invoice;
  const paymentIntent = latestInvoice.payment_intent as Stripe.PaymentIntent;

  // store subscription
  const savedSubscription = await prisma.purchase_subscription.create({
    data: {
      userId,
      planId: plan.id,
      stripeSubscriptionId: subscription.id,
      stripePriceId: plan.stripePriceId!,
      status: SubscriptionStatus.ACTIVE,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      endDate: new Date(subscription.current_period_end * 1000),
      paymentProvider: PaymentProvider.STRIPE,
    },
    include: { plan: true },
  });

  return {
    clientSecret: paymentIntent.client_secret,
    subscriptionId: savedSubscription.id,
  };
};
// create checkout session for subscription
const createCheckoutSessionForSubscription = async (
  userId: string,
  planId: string,
  baseUrl: string,
) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  const plan = await prisma.subscriptionPlan.findUnique({
    where: { id: planId },
  });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  if (!plan) {
    throw new ApiError(httpStatus.NOT_FOUND, "Subscription plan not found");
  }

  if (!plan.stripePriceId) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Stripe Price ID is missing for this subscription plan. Please configure it in Stripe first.",
    );
  }

  // create stripe customer if not exists
  let stripeCustomerId = user.stripeCustomerId;
  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: user.email || undefined,
      name: user.fullName || undefined,
    });
    stripeCustomerId = customer.id;
    await prisma.user.update({
      where: { id: userId },
      data: { stripeCustomerId },
    });
  }

  // create checkout session
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: stripeCustomerId,
    line_items: [
      {
        price: plan.stripePriceId!,
        quantity: 1,
      },
    ],
    success_url: `${baseUrl.replace(/\/$/, "")}/api/v1/subscriptions/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl.replace(/\/$/, "")}/api/v1/subscriptions/cancel`,
    metadata: {
      userId,
      planId,
    },
  });

  return { checkoutUrl: session.url, sessionId: session.id, url: session.url };
};

// handle stripe webhook
const handleStripeWebhook = async (event: Stripe.Event) => {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const stripeSubscriptionId = session.subscription as string | undefined;
      const userId = session.metadata?.userId as string | undefined;
      const planId = session.metadata?.planId as string | undefined;

      if (!stripeSubscriptionId || !userId || !planId)
        return { ok: false, reason: "missing metadata" };

      // get stripe subscription to read price and dates
      const sub = await stripe.subscriptions.retrieve(stripeSubscriptionId);

      await prisma.purchase_subscription.create({
        data: {
          userId,
          planId,
          stripeSubscriptionId,
          stripePriceId: sub.items.data[0].price.id,
          status: "ACTIVE",
          cancelAtPeriodEnd: sub.cancel_at_period_end ?? false,
          endDate: new Date(sub.current_period_end * 1000),
          paymentProvider: "STRIPE",
        },
      });

      // Update user isSubscribed status directly to avoid race conditions
      await prisma.user.update({
        where: { id: userId },
        data: { isSubscribed: true },
      });

      return { ok: true, handled: "checkout.session.completed" };
    }

    case "invoice.payment_succeeded": {
      const invoice = event.data.object as Stripe.Invoice;
      const stripeSubscriptionId = invoice.subscription as string | null;
      if (!stripeSubscriptionId)
        return { ok: false, reason: "missing subscription" };

      const purchase = await prisma.purchase_subscription.findFirst({
        where: { stripeSubscriptionId },
      });
      if (!purchase) return { ok: false, reason: "subscription not found" };

      // safe line item
      const lineItem = invoice.lines.data.find(
        (line) => (line as any).type === "subscription_item_details",
      );

      const endDate = lineItem?.period?.end
        ? new Date(lineItem.period.end * 1000)
        : new Date();

      // update all matching subscriptions
      await prisma.purchase_subscription.updateMany({
        where: { stripeSubscriptionId },
        data: {
          status: "ACTIVE",
          endDate,
        },
      });

      await prisma.payment.create({
        data: {
          purchase_subscriptionId: purchase.id,
          amount: (invoice.amount_paid ?? 0) / 100,
          currency: invoice.currency,
          status: "SUCCESS",
          provider: "STRIPE",
          paymentIntentId:
            (invoice.payment_intent as string | undefined) ?? undefined,
          serviceType: "SUBSCRIPTION",
          userId: purchase.userId,
          planId: purchase.planId,
        },
      });

      // update user subscription status safely
      const activeSubs = await prisma.purchase_subscription.count({
        where: { userId: purchase.userId, status: "ACTIVE" },
      });
      await prisma.user.update({
        where: { id: purchase.userId },
        data: { isSubscribed: activeSubs > 0 },
      });

      return { ok: true, handled: "invoice.payment_succeeded" };
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const stripeSubscriptionId = invoice.subscription as string | null;
      if (!stripeSubscriptionId) return { ok: false };

      await prisma.purchase_subscription.updateMany({
        where: { stripeSubscriptionId },
        data: { status: "INACTIVE" },
      });

      return { ok: true, handled: "invoice.payment_failed" };
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;

      // Find and update subscription
      const purchase = await prisma.purchase_subscription.findFirst({
        where: { stripeSubscriptionId: sub.id },
      });

      if (purchase) {
        await prisma.purchase_subscription.updateMany({
          where: { stripeSubscriptionId: sub.id },
          data: { status: "CANCELED" },
        });

        // Update user isSubscribed status
        await prisma.user.update({
          where: { id: purchase.userId },
          data: { isSubscribed: false },
        });
      }

      return { ok: true, handled: "customer.subscription.deleted" };
    }

    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;

      const endDate = sub.current_period_end
        ? new Date(sub.current_period_end * 1000)
        : undefined;

      await prisma.purchase_subscription.updateMany({
        where: { stripeSubscriptionId: sub.id },
        data: {
          ...(endDate && { endDate }),
          cancelAtPeriodEnd: sub.cancel_at_period_end ?? false,
          status: "ACTIVE", // make sure it's active
        },
      });

      // update user subscription status
      const activeSubs = await prisma.purchase_subscription.count({
        where: { stripeSubscriptionId: sub.id, status: "ACTIVE" },
      });
      if (activeSubs > 0) {
        const purchase = await prisma.purchase_subscription.findFirst({
          where: { stripeSubscriptionId: sub.id },
        });
        if (purchase) {
          await prisma.user.update({
            where: { id: purchase.userId },
            data: { isSubscribed: true },
          });
        }
      }

      return { ok: true, handled: "customer.subscription.updated" };
    }

    // add optional checkout expired handler
    case "checkout.session.expired":
      return { ok: true, handled: "checkout.session.expired" };

    // add handlers for product/plan/price events (optional - for logging/monitoring)
    case "product.created":
    case "plan.created":
    case "price.created":
      // These are typically handled during plan creation, but we can log them
      console.log(`Stripe event handled: ${event.type}`);
      return { ok: true, handled: event.type };

    // handle payment related events
    case "payment_method.attached":
    case "charge.succeeded":
    case "payment_intent.succeeded":
    case "payment_intent.created":
      console.log(`Stripe event handled: ${event.type}`);
      return { ok: true, handled: event.type };

    // handle invoice related events
    case "invoice.created":
    case "invoice.finalized":
    case "invoice.updated":
    case "invoice.paid":
    case "invoice_payment.paid" as any:
      console.log(`Stripe event handled: ${event.type}`);
      return { ok: true, handled: event.type };

    // handle subscription creation
    case "customer.subscription.created":
      console.log(`Stripe event handled: ${event.type}`);
      return { ok: true, handled: event.type };

    default:
      console.log("Unhandled stripe event:", event.type);
      return { ok: true, handled: "unhandled", event: event.type };
  }
};

const verifySubscriptionSession = async (userId: string | undefined, sessionId: string) => {
  const session = await stripe.checkout.sessions.retrieve(sessionId);

  if (!session) {
    throw new ApiError(httpStatus.NOT_FOUND, "Stripe session not found");
  }

  if (session.payment_status !== "paid") {
    return {
      success: false,
      message: "Subscription checkout payment is not completed yet",
      status: session.payment_status,
    };
  }

  const stripeSubscriptionId = session.subscription as string | undefined;
  const planId = session.metadata?.planId as string | undefined;
  const finalUserId = userId || (session.metadata?.userId as string | undefined);

  if (!stripeSubscriptionId || !planId || !finalUserId) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid session metadata");
  }

  // Check if purchase subscription already exists
  let purchase = await prisma.purchase_subscription.findFirst({
    where: { stripeSubscriptionId },
  });

  if (!purchase) {
    const sub = await stripe.subscriptions.retrieve(stripeSubscriptionId);
    purchase = await prisma.purchase_subscription.create({
      data: {
        userId: finalUserId,
        planId,
        stripeSubscriptionId,
        stripePriceId: sub.items.data[0].price.id,
        status: "ACTIVE",
        cancelAtPeriodEnd: sub.cancel_at_period_end ?? false,
        endDate: new Date(sub.current_period_end * 1000),
        paymentProvider: "STRIPE",
      },
    });
  }

  // Always update User table directly to ensure synchrony
  await prisma.user.update({
    where: { id: finalUserId },
    data: { isSubscribed: true },
  });

  return {
    success: true,
    message: "Subscription verified and activated successfully",
    purchase,
  };
};

export const SubscriptionService = {
  createSubscriptionPlan,
  getAllSubscriptionsPlan,
  getSpecificSubscriptionPlan,
  updateSpecificSubscriptionPlan,
  deleteSpecificSubscriptionPlan,

  getAllPurchaseSubscription,
  getMyPurchaseSubscription,
  createSubscription,
  createCheckoutSessionForSubscription,
  handleStripeWebhook,
  verifySubscriptionSession,
};
