import { Request, Response } from "express";

import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import ApiError from "../../../errors/ApiErrors";
import httpStatus from "http-status";
import { SubscriptionService } from "./subscription.service";
import config from "../../../config";
import stripe from "../../../helpars/stripe";
import Stripe from "stripe";
import { filterField } from "./subscription.constant";
import { paginationFields } from "../../../constants/pagination";
import { pick } from "../../../shared/pick";

// ----------------------------subscription plan--------------------------------

// create subscription plan
const createSubscriptionPlan = catchAsync(
  async (req: Request, res: Response) => {
    const subscription = req.body;
    const userId = req.user?.id;
    const newSubscription = await SubscriptionService.createSubscriptionPlan(
      subscription,
      userId,
    );
    if (!newSubscription) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Failed to create new subscription!",
      );
    }
    sendResponse(res, {
      statusCode: 201,
      success: true,
      message: "Subscription created successfully",
      data: newSubscription,
    });
  },
);

// get all subscriptions plan
const getAllSubscriptionsPlan = catchAsync(
  async (req: Request, res: Response) => {
    const { query } = req.query;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 8;

    const skip = (page - 1) * limit;
    const subscriptions = await SubscriptionService.getAllSubscriptionsPlan(
      query as string,
      skip,
      limit,
    );

    const totalSubscriptions = subscriptions.length || 0;
    const totalPages = Math.ceil(totalSubscriptions / limit);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Subscriptions retrieved successfully",
      data: subscriptions,
    });
  },
);

// get specific subscription plan by id
const getSpecificSubscriptionPlan = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const subscription =
      await SubscriptionService.getSpecificSubscriptionPlan(id);
    if (!subscription) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Subscription not found!");
    }
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Subscription retrieved successfully",
      data: subscription,
    });
  },
);

// update specific subscription plan
const updateSpecificSubscriptionPlan = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const data = req.body;

    const updatedSubscription =
      await SubscriptionService.updateSpecificSubscriptionPlan(id, data);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Subscription updated successfully",
      data: updatedSubscription,
    });
  },
);

// deleting specific subscription plan
const deleteSpecificSubscriptionPlan = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const deletedSubscription =
      await SubscriptionService.deleteSpecificSubscriptionPlan(id);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Subscription deleted successfully",
      data: deletedSubscription,
    });
  },
);

// ----------------------------subscription--------------------------------

// get all purchase subscription
const getAllPurchaseSubscription = catchAsync(
  async (req: Request, res: Response) => {
    const filter = pick(req.query, filterField);
    const options = pick(req.query, paginationFields);
    const subscriptions = await SubscriptionService.getAllPurchaseSubscription(
      filter,
      options,
    );
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Subscriptions retrieved successfully",
      data: subscriptions,
    });
  },
);

// get my purchase subscription
const getMyPurchaseSubscription = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const subscriptions =
      await SubscriptionService.getMyPurchaseSubscription(userId);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Subscriptions retrieved successfully",
      data: subscriptions,
    });
  },
);

// create subscription
const createSubscription = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const { planId } = req.body;

  const subscription = await SubscriptionService.createSubscription(
    userId,
    planId,
  );

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Subscription created successfully",
    data: subscription,
  });
});

// create checkout session for subscription
const createCheckoutSessionForSubscription = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const { planId } = req.body;
    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const session =
      await SubscriptionService.createCheckoutSessionForSubscription(
        userId,
        planId,
        baseUrl,
      );
    return sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Checkout session created",
      data: session,
    });
  },
);

// Webhook handlers for payment providers
const handleStripeWebhook = catchAsync(async (req: Request, res: Response) => {
  console.log("--- Subscription Webhook Received ---");
  const sig = req.headers["stripe-signature"] as string;
  if (!sig) {
    console.error("Subscription Webhook Error: Missing stripe signature");
    throw new ApiError(httpStatus.BAD_REQUEST, "Missing stripe signature", "");
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      req.rawBody!, // RAW BODY
      sig,
      config.stripe.webhookSecret_2 as string,
    );
    console.log(`Subscription Webhook Event Type: ${event.type}`);
  } catch (err: any) {
    console.error(`Subscription Webhook Construction Error: ${err.message}`);
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Webhook Error: ${err.message}`,
      "",
    );
  }

  try {
    await SubscriptionService.handleStripeWebhook(event);
    console.log("--- Subscription Webhook Processed Successfully ---");
    res.json({ received: true });
  } catch (err) {
    console.error("Subscription Webhook Processing Error:", err);
    res.status(500).send(`Webhook processing error.`);
  }
});

const verifySubscriptionSession = catchAsync(async (req: Request, res: Response) => {
  const { sessionId } = req.params;
  const userId = req.user?.id;

  const result = await SubscriptionService.verifySubscriptionSession(userId, sessionId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: result.message,
    data: result,
  });
});

const paymentSuccessRedirect = catchAsync(async (req: Request, res: Response) => {
  const sessionId = req.query.session_id as string;
  if (!sessionId) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Missing session_id query parameter");
  }

  try {
    await SubscriptionService.verifySubscriptionSession(undefined, sessionId);
  } catch (error) {
    console.error("Subscription verification failed during redirect:", error);
  }

  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  const redirectUrl = `${frontendUrl}/dashboard/propertyowner/home?role=property%20owner`;

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Successful</title>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800&display=swap" rel="stylesheet">
  <style>
    body {
      margin: 0;
      padding: 0;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      background: #f4f7fe;
      font-family: 'Outfit', sans-serif;
      overflow: hidden;
    }

    .card {
      text-align: center;
      background: #246bfd;
      padding: 3rem;
      border-radius: 24px;
      box-shadow: 0 20px 50px rgba(36, 107, 253, 0.25);
      max-width: 420px;
      width: 90%;
      display: flex;
      flex-direction: column;
      align-items: center;
      animation: fadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      box-sizing: border-box;
    }

    .checkmark-wrapper {
      position: relative;
      width: 80px;
      height: 80px;
      margin-bottom: 20px;
    }

    .checkmark-circle {
      width: 100%;
      height: 100%;
      border: 4px solid rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      box-sizing: border-box;
    }

    .checkmark {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      stroke: #ffffff;
      stroke-width: 4;
      stroke-linecap: round;
      stroke-linejoin: round;
      fill: none;
    }

    h1 {
      font-size: 1.8rem;
      margin: 0 0 0.5rem 0;
      font-weight: 800;
      color: #ffffff;
    }

    p {
      color: rgba(255, 255, 255, 0.85);
      font-size: 1.05rem;
      margin: 0 0 1.5rem 0;
      line-height: 1.5;
    }

    .redirect-text {
      color: rgba(255, 255, 255, 0.7);
      font-size: 0.9rem;
      margin-bottom: 1.5rem;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .btn {
      display: inline-block;
      padding: 0.85rem 2rem;
      background: #ffffff;
      color: #246bfd;
      text-decoration: none;
      font-weight: 800;
      font-size: 0.95rem;
      border-radius: 16px;
      box-shadow: 0 10px 20px rgba(0, 0, 0, 0.15);
      transition: all 0.2s ease;
    }

    .btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 12px 24px rgba(0, 0, 0, 0.2);
      background: #f8faff;
    }

    .btn:active {
      transform: translateY(0);
    }

    .loader {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255, 255, 255, 0.25);
      border-radius: 50%;
      border-top-color: #ffffff;
      animation: spin 0.8s linear infinite;
      display: inline-block;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  </style>
</head>
<body>

  <div class="card">
    <div class="checkmark-wrapper">
      <div class="checkmark-circle"></div>
      <svg class="checkmark" viewBox="0 0 52 52">
        <path d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
      </svg>
    </div>
    <h1>Payment Successful</h1>
    <p>Your subscription is active. Welcome to Hostigo.</p>
    
    <div class="redirect-text">
      <div class="loader"></div>
      <span>Redirecting you to dashboard in <strong id="countdown">3</strong> seconds...</span>
    </div>

    <a href="${redirectUrl}" class="btn">Go to Dashboard</a>
  </div>

  <script>
    var redirectUrl = "${redirectUrl}";
    var count = 3;
    var countdownEl = document.getElementById("countdown");
    var interval = setInterval(function() {
      count--;
      if (countdownEl) countdownEl.innerText = count;
      if (count <= 0) {
        clearInterval(interval);
        window.location.href = redirectUrl;
      }
    }, 1000);
  </script>
</body>
</html>
  `;

  res.setHeader("Content-Type", "text/html");
  res.status(httpStatus.OK).send(htmlContent);
});

const paymentCancelRedirect = catchAsync(async (req: Request, res: Response) => {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  const redirectUrl = `${frontendUrl}/dashboard/propertyowner/home?role=property%20owner`;

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Canceled</title>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800&display=swap" rel="stylesheet">
  <style>
    body {
      margin: 0;
      padding: 0;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      background: radial-gradient(circle at center, #1e1b4b, #0f172a);
      font-family: 'Outfit', sans-serif;
      color: #ffffff;
      overflow: hidden;
    }
    .card {
      text-align: center;
      background: rgba(255, 255, 255, 0.03);
      padding: 3rem;
      border-radius: 24px;
      backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.08);
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4);
      max-width: 400px;
      width: 90%;
      animation: fadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    .cross-wrapper {
      width: 100px;
      height: 100px;
      margin: 0 auto 2rem auto;
      position: relative;
    }
    .cross-circle {
      width: 100px;
      height: 100px;
      border: 4px solid rgba(239, 68, 68, 0.2);
      border-radius: 50%;
      position: absolute;
      top: 0;
      left: 0;
      box-sizing: border-box;
    }
    .cross {
      width: 100px;
      height: 100px;
      border-radius: 50%;
      display: block;
      stroke-width: 4;
      stroke: #ef4444;
      stroke-miterlimit: 10;
      box-shadow: inset 0px 0px 0px #ef4444;
      animation: fill-error .4s ease-in-out .4s forwards, scale .3s ease-in-out .9s cubic-bezier(0.16, 1, 0.3, 1) alternate both;
    }
    .cross-line {
      transform-origin: 50% 50%;
      stroke-linecap: round;
      stroke-dasharray: 48;
      stroke-dashoffset: 48;
      animation: stroke 0.6s cubic-bezier(0.65, 0, 0.45, 1) 0.6s forwards;
    }
    h1 {
      font-size: 2rem;
      margin: 0 0 0.5rem 0;
      font-weight: 800;
      background: linear-gradient(135deg, #f87171, #ef4444);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    p {
      color: #94a3b8;
      font-size: 1.1rem;
      margin: 0 0 2rem 0;
      line-height: 1.5;
    }
    .loader {
      display: inline-block;
      width: 24px;
      height: 24px;
      border: 3px solid rgba(255, 255, 255, 0.1);
      border-radius: 50%;
      border-top-color: #ef4444;
      animation: spin 0.8s linear infinite;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes stroke {
      100% { stroke-dashoffset: 0; }
    }
    @keyframes scale {
      0%, 100% { transform: none; }
      50% { transform: scale3d(1.1, 1.1, 1); }
    }
    @keyframes fill-error {
      100% { box-shadow: inset 0px 0px 0px 50px rgba(239, 68, 68, 0.05); }
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="cross-wrapper">
      <div class="cross-circle"></div>
      <svg class="cross" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
        <path class="cross-line" fill="none" d="M16 16 36 36 M36 16 16 36"/>
      </svg>
    </div>
    <h1>Payment Canceled</h1>
    <p>Your payment transaction was canceled. You can close this window now.</p>
    <div class="loader"></div>
  </div>
  <script>
    setTimeout(function() {
      try {
        window.close();
      } catch (e) {
        console.error(e);
      }
    }, 2500);
  </script>
</body>
</html>
  `;

  res.setHeader("Content-Type", "text/html");
  res.status(httpStatus.OK).send(htmlContent);
});

export const SubscriptionController = {
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
  paymentSuccessRedirect,
  paymentCancelRedirect,
};
