import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import httpStatus from "http-status";
import { PaymentService } from "./payment.sercice";
import ApiError from "../../../errors/ApiErrors";
import config from "../../../config";
import stripe from "../../../helpars/stripe";
import Stripe from "stripe";
import { ServiceType } from "./Stripe/stripe";

// stripe account onboarding
const stripeAccountOnboarding = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const result = await PaymentService.stripeAccountOnboarding(userId);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Stripe account onboarding successfully",
      data: result,
    });
  }
);

// checkout session on stripe for hotel
const createStripeCheckoutSessionForHotel = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const { bookingId } = req.params;
    const { description } = req.body;

    const proto = req.headers["x-forwarded-proto"] || req.protocol;
    const baseUrl = `${proto}://${req.get("host")}`;

    const result = await PaymentService.createStripeCheckoutSessionForHotel(
      userId,
      bookingId,
      description,
      baseUrl
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Checkout session created successfully",
      data: result,
    });
  }
);

// checkout session on stripe for service
const createStripeCheckoutSessionForService = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const { bookingId } = req.params;
    const { description } = req.body;

    const proto = req.headers["x-forwarded-proto"] || req.protocol;
    const baseUrl = `${proto}://${req.get("host")}`;

    const result = await PaymentService.createStripeCheckoutSessionForService(
      userId,
      bookingId,
      description,
      baseUrl
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Checkout session created successfully",
      data: result,
    });
  }
);

// stripe webhook payment
const stripeHandleWebhook = catchAsync(async (req: Request, res: Response) => {
  console.log("--- Payment Webhook Received ---");
  const sig = req.headers["stripe-signature"] as string;
  if (!sig) {
    console.error("Payment Webhook Error: Missing stripe-signature header");
    throw new ApiError(httpStatus.BAD_REQUEST, "Missing stripe signature", "");
  }

  let event: Stripe.Event;

  try {
    if (!req.rawBody) {
      console.error("Payment Webhook Error: req.rawBody is missing! Ensure body-parser verify is working.");
      throw new ApiError(httpStatus.BAD_REQUEST, "Raw body not available", "");
    }

    console.log(`[Webhook] Signature present, rawBody length: ${req.rawBody.length}`);
    console.log(`[Webhook] Using Webhook Secret starting with: ${config.stripe.webhookSecret?.substring(0, 8)}...`);

    event = stripe.webhooks.constructEvent(
      req.rawBody,
      sig,
      config.stripe.webhookSecret as string
    );
    console.log(`[Webhook] Event Verified & Constructed. Type: ${event.type}`);
  } catch (err: any) {
    console.error(`[Webhook] Construction Error: ${err.message}`);
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Webhook Error: ${err.message}`,
      ""
    );
  }

  const result = await PaymentService.stripeHandleWebhook(event);
  console.log("--- Payment Webhook Processed Successfully ---");
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Stripe webhook payment successfully",
    data: result,
  });
});

// stripe cancel booking
const cancelStripeBooking = catchAsync(async (req, res) => {
  const { serviceType, bookingId } = req.params;
  const userId = req.user?.id;

  const result = await PaymentService.cancelStripeBooking(
    serviceType as ServiceType,
    bookingId,
    userId
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Booking cancelled successfully",
    data: result,
  });
});

// get my all my transactions
const getMyTransactions = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const result = await PaymentService.getMyTransactions(userId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "My transactions fetched successfully",
    data: result,
  });
});

// payment success redirect
const paymentSuccess = catchAsync(async (req: Request, res: Response) => {
  const { bookingId, session_id } = req.query;
  console.log(`[Payment Success Redirect] BookingID: ${bookingId}, SessionID: ${session_id}`);
  
  // Fallback: Update status immediately if session is complete (in case webhook is slow)
  if (session_id) {
    try {
      const session = await stripe.checkout.sessions.retrieve(session_id as string);
      
      // For manual capture (SERVICE bookings), payment_status is 'unpaid' but status is 'complete'
      if (session.payment_status === 'paid' || session.status === 'complete') {
        console.log(`[Payment Fallback] Session is ${session.status}. Updating database for Booking: ${bookingId}`);
        
        // Mock checkout.session.completed
        await PaymentService.stripeHandleWebhook({
          type: "checkout.session.completed",
          data: { object: session }
        } as any);
        
        // Mock payment_intent.amount_capturable_updated if it's a SERVICE booking
        if (session.payment_intent) {
          const intent = await stripe.paymentIntents.retrieve(session.payment_intent as string);
          if (intent.status === 'requires_capture') {
            await PaymentService.stripeHandleWebhook({
              type: "payment_intent.amount_capturable_updated",
              data: { object: intent }
            } as any);
          }
        }
      }
    } catch (error) {
      console.error("[Payment Fallback Error]", error);
    }
  }
  
  const successHtml = `
   <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Payment Successful</title>
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600&display=swap" rel="stylesheet">
        <style>
            body { font-family: 'Outfit', sans-serif; background: #0f172a; color: white; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; overflow: hidden; }
            .card { background: rgba(30, 41, 59, 0.7); backdrop-filter: blur(10px); padding: 40px; border-radius: 24px; text-align: center; border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); max-width: 400px; width: 90%; animation: slideUp 0.6s ease-out; }
            @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
            .icon { font-size: 64px; margin-bottom: 20px; display: inline-block; animation: scaleIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) 0.3s both; }
            @keyframes scaleIn { from { transform: scale(0); } to { transform: scale(1); } }
            h1 { margin: 0; font-size: 28px; font-weight: 600; color: #10b981; }
            p { color: #94a3b8; margin: 15px 0 30px; line-height: 1.6; }
            .btn { background: #10b981; color: white; align-items: center; margin: auto; border: none; padding: 14px 28px; border-radius: 12px; font-weight: 600; cursor: pointer; text-decoration: none; display: block; transition: all 0.3s; }
            .btn:active { transform: scale(0.95); }
            .booking-id { font-size: 12px; color: #475569; margin-top: 20px; font-family: monospace; }
        </style>
    </head>
    <body>
        <div class="card">
            <div class="icon">✅</div>
            <h1>Payment Successful!</h1>
            <p>Your booking has been confirmed. You can now close this window and return to the app.</p>
            <button onclick="window.close()" class="btn" style="margin-top: 20px;">Close Window</button>
        </div>
        <script>
            // For Flutter/Mobile WebView coordination
            setTimeout(() => {
                if (window.Flutter) {
                    window.Flutter.postMessage('payment_success');
                }
            }, 2000);
        </script>
    </body>
    </html>
  `;
  
  res.setHeader('Content-Type', 'text/html');
  res.send(successHtml);
});

            // <button class="btn" onclick="window.close()">Back to App</button>
            // <div class="booking-id">ID: ${bookingId}</div>

// payment cancel redirect
const paymentCancel = catchAsync(async (req: Request, res: Response) => {
  const { bookingId } = req.query;
  console.log(`[Payment Cancel] Hit handler for BookingID: ${bookingId}`);
  
  const cancelHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Payment Cancelled</title>
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600&display=swap" rel="stylesheet">
        <style>
            body { font-family: 'Outfit', sans-serif; background: #0f172a; color: white; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
            .card { background: rgba(30, 41, 59, 0.7); backdrop-filter: blur(10px); padding: 40px; border-radius: 24px; text-align: center; border: 1px solid rgba(255,255,255,0.1); max-width: 400px; width: 90%; }
            .icon { font-size: 64px; margin-bottom: 20px; }
            h1 { margin: 0; font-size: 28px; font-weight: 600; color: #f43f5e; }
            p { color: #94a3b8; margin: 15px 0 30px; }
            .btn { background: #334155; color: white; border: none; padding: 14px 28px; border-radius: 12px; margin: auto; align-items: center; font-weight: 600; text-decoration: none; display: block; }
        </style>
    </head>
    <body>
        <div class="card">
            <div class="icon">❌</div>
            <h1>Payment Cancelled</h1>
            <p>The payment process was cancelled. No charges were made.</p>
            <button onclick="window.close()" class="btn" style="margin-top: 20px;">Close Window</button>
        </div>
    </body>
    </html>
  `;
  
  res.setHeader('Content-Type', 'text/html');
  res.send(cancelHtml);
});


  // <button class="btn" onclick="window.close()">Return to App</button>

  
export const PaymentController = {
  stripeAccountOnboarding,
  stripeHandleWebhook,
  cancelStripeBooking,
  getMyTransactions,
  createStripeCheckoutSessionForHotel,
  createStripeCheckoutSessionForService,
  paymentSuccess,
  paymentCancel,
};
