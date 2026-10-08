"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useGetSingleHotelQuery } from "@/redux/api/hotelApi";
import { useCreateHotelBookingMutation } from "@/redux/api/hotelBookingApi";
import { useCreateStripeCheckoutSessionHotelMutation } from "@/redux/api/paymentApi";
import { useCheckAccessForHotelQuery } from "@/redux/api/hotelBookingApi";

export default function PropertyPublicPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();

  // Detect auth token client-side only
  const [isMounted, setIsMounted] = useState(false);
  const [hasToken, setHasToken] = useState(false);
  useEffect(() => {
    setIsMounted(true);
    const token = localStorage.getItem("token") || document.cookie.match(/token=([^;]+)/)?.[1] || "";
    setHasToken(!!token);
  }, []);

  const { data: response, isLoading, isError } = useGetSingleHotelQuery(id, {
    skip: !id,
  });

  // Only fetch access check if user is logged in
  const { data: accessResponse } = useCheckAccessForHotelQuery(id, {
    skip: !id || !isMounted || !hasToken,
  });
  const hasAccess = accessResponse?.data?.hasAccess === true;

  const property = response?.data;
  const [activePhoto, setActivePhoto] = useState(0);

  // Booking state
  const [showBooking, setShowBooking] = useState(false);
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(1);
  const [bookingStep, setBookingStep] = useState<"form" | "processing" | "done">("form");
  const [bookingError, setBookingError] = useState("");

  const [createHotelBooking] = useCreateHotelBookingMutation();
  const [createStripeCheckout] = useCreateStripeCheckoutSessionHotelMutation();

  /* ─── Loading ─── */
  if (isLoading) {
    return (
      <div className="property-loading">
        <div className="property-spinner" />
        <p>Loading property details…</p>
      </div>
    );
  }

  /* ─── Error / not found ─── */
  if (isError || !property) {
    return (
      <div className="property-error">
        <div className="property-error-icon">🏠</div>
        <h1>Property Not Found</h1>
        <p>This property link may have expired or been removed.</p>
      </div>
    );
  }

  const photos: string[] = property.uploadPhotosOrVideos || [];
  const amenities: string[] = Array.isArray(property.amenities)
    ? property.amenities
    : [];
  const localTips: any[] = Array.isArray(property.addLocalTips)
    ? property.addLocalTips
    : [];
  const guards: any[] = Array.isArray(property.guards) ? property.guards : [];

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        body { background: #0a0a0f; color: #f0f0f4; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }

        /* ── Loading / Error ── */
        .property-loading {
          min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center;
          background: #0a0a0f; color: #a0a0b0; gap: 20px;
        }
        .property-spinner {
          width: 44px; height: 44px; border: 3px solid #1e1e2e; border-top-color: #6366f1;
          border-radius: 50%; animation: spin 0.9s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .property-error {
          min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center;
          background: #0a0a0f; color: #a0a0b0; gap: 16px; text-align: center; padding: 24px;
        }
        .property-error-icon { font-size: 64px; }
        .property-error h1 { font-size: 24px; font-weight: 700; color: #f0f0f4; }
        .property-error p { font-size: 15px; max-width: 320px; line-height: 1.6; }

        /* ── Hero Gallery ── */
        .hero {
          position: relative; width: 100%; height: 52vw; max-height: 520px; min-height: 260px;
          background: #111120; overflow: hidden;
        }
        .hero-img {
          width: 100%; height: 100%; object-fit: cover; transition: opacity 0.4s;
        }
        .hero-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(to bottom, rgba(10,10,15,0.1) 0%, rgba(10,10,15,0.7) 80%, #0a0a0f 100%);
        }
        .hero-badge {
          position: absolute; top: 20px; left: 20px;
          background: rgba(255,255,255,0.12); backdrop-filter: blur(12px);
          border: 1px solid rgba(255,255,255,0.18); border-radius: 100px;
          padding: 6px 14px; font-size: 12px; font-weight: 600; color: #fff;
          display: flex; align-items: center; gap: 6px;
        }
        .hero-badge::before { content: ""; width: 7px; height: 7px; border-radius: 50%; background: #4ade80; flex-shrink: 0; }

        .thumb-row {
          position: absolute; bottom: 16px; left: 50%; transform: translateX(-50%);
          display: flex; gap: 8px; padding: 0 16px;
        }
        .thumb {
          width: 52px; height: 38px; border-radius: 8px; object-fit: cover; cursor: pointer;
          border: 2px solid transparent; opacity: 0.6; transition: all 0.2s;
        }
        .thumb.active { border-color: #6366f1; opacity: 1; }
        .thumb:hover { opacity: 0.9; }

        /* ── Main Layout ── */
        .page { max-width: 780px; margin: 0 auto; padding: 0 20px 80px; }

        /* ── Title Section ── */
        .title-section { padding: 32px 0 20px; }
        .title-section h1 { font-size: 26px; font-weight: 800; color: #f0f0f4; line-height: 1.25; margin-bottom: 10px; }
        .address-row { display: flex; align-items: center; gap: 8px; color: #8888a0; font-size: 14px; }
        .address-row svg { flex-shrink: 0; }

        /* ── Stat Pills ── */
        .stat-row { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 20px; }
        .stat-pill {
          display: flex; align-items: center; gap: 8px;
          background: #13131f; border: 1px solid #1e1e30; border-radius: 100px;
          padding: 8px 16px; font-size: 13px; font-weight: 600; color: #c0c0d0;
        }
        .stat-pill .icon { font-size: 16px; }

        /* ── Section Card ── */
        .section { margin-top: 28px; background: #13131f; border: 1px solid #1e1e30; border-radius: 20px; padding: 24px; }
        .section-title { font-size: 15px; font-weight: 700; color: #f0f0f4; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
        .section-title .s-icon { font-size: 18px; }

        /* ── Description ── */
        .desc { font-size: 14px; line-height: 1.75; color: #9090a8; }

        /* ── Amenities ── */
        .amenity-grid { display: flex; flex-wrap: wrap; gap: 10px; }
        .amenity-chip {
          background: #1a1a2e; border: 1px solid #2a2a44; border-radius: 100px;
          padding: 6px 14px; font-size: 12px; font-weight: 600; color: #a0a0c0;
        }

        /* ── Info Box (WiFi / Pin) ── */
        .info-box {
          background: #0d0d1a; border: 1px solid #1a1a30; border-radius: 14px;
          padding: 18px 20px; display: flex; flex-direction: column; gap: 14px;
        }
        .info-row { display: flex; justify-content: space-between; align-items: center; }
        .info-label { font-size: 12px; color: #6060808; color: #606080; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; }
        .info-value { font-size: 15px; font-weight: 700; color: #e0e0f0; font-family: 'Courier New', monospace; }
        .info-divider { height: 1px; background: #1e1e30; }

        /* ── Price Box ── */
        .price-box {
          background: linear-gradient(135deg, #1a1030 0%, #0e1a2e 100%);
          border: 1px solid #2a1a50; border-radius: 16px; padding: 22px; text-align: center;
        }
        .price-amount { font-size: 36px; font-weight: 900; color: #a78bfa; }
        .price-label { font-size: 12px; color: #8070a0; margin-top: 4px; }

        /* ── Tips Grid ── */
        .tips-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 14px; }
        .tip-card {
          border-radius: 14px; overflow: hidden; background: #111120; border: 1px solid #1e1e30;
        }
        .tip-card img { width: 100%; height: 90px; object-fit: cover; }
        .tip-info { padding: 10px 12px; }
        .tip-info .tip-name { font-size: 12px; font-weight: 700; color: #d0d0e8; margin-bottom: 3px; }
        .tip-info .tip-desc { font-size: 11px; color: #70708a; line-height: 1.4; }

        /* ── Guard Card ── */
        .guard-card {
          display: flex; align-items: center; gap: 16px;
          background: #0d0d1a; border: 1px solid #1a1a30; border-radius: 16px; padding: 18px 20px;
        }
        .guard-avatar { width: 56px; height: 56px; border-radius: 50%; object-fit: cover; border: 2px solid #2a2a44; flex-shrink: 0; }
        .guard-avatar-placeholder {
          width: 56px; height: 56px; border-radius: 50%; background: #1a1a30;
          display: flex; align-items: center; justify-content: center; font-size: 22px; flex-shrink: 0;
        }
        .guard-name { font-size: 15px; font-weight: 700; color: #e0e0f0; }
        .guard-phone { font-size: 13px; color: #6060848; color: #608084; margin-top: 3px; }
        .guard-badge {
          margin-left: auto; background: rgba(74, 222, 128, 0.1); border: 1px solid rgba(74, 222, 128, 0.25);
          color: #4ade80; font-size: 11px; font-weight: 700; border-radius: 100px; padding: 4px 10px;
          white-space: nowrap;
        }

        /* ── Footer ── */
        .property-footer {
          margin-top: 48px; text-align: center; color: #404058; font-size: 12px; line-height: 1.8;
        }
        .property-footer strong { color: #6366f1; }

        /* ── Responsive ── */
        @media (max-width: 480px) {
          .hero { height: 65vw; }
          .title-section h1 { font-size: 22px; }
          .tips-grid { grid-template-columns: 1fr 1fr; }
        }
      `}</style>

      {/* ── Hero ── */}
      <div className="hero">
        {photos.length > 0 ? (
          <img
            className="hero-img"
            src={photos[activePhoto]}
            alt={property.propertyTitle || "Property"}
          />
        ) : (
          <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg, #1a1030 0%, #0d1a2e 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 64 }}>
            🏠
          </div>
        )}
        <div className="hero-overlay" />

        {property.availableForBooking && (
          <div className="hero-badge">Available for Booking</div>
        )}

        {photos.length > 1 && (
          <div className="thumb-row">
            {photos.slice(0, 6).map((src, i) => (
              <img
                key={i}
                src={src}
                alt=""
                className={`thumb${i === activePhoto ? " active" : ""}`}
                onClick={() => setActivePhoto(i)}
              />
            ))}
          </div>
        )}
      </div>

      <div className="page">
        {/* ── Title ── */}
        <div className="title-section">
          <h1>{property.propertyTitle || "Unnamed Property"}</h1>
          {property.propertyAddress && (
            <div className="address-row">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              {property.propertyAddress}
            </div>
          )}

          <div className="stat-row">
            {property.maxGuests && (
              <div className="stat-pill"><span className="icon">👥</span> {property.maxGuests} Guests</div>
            )}
            {property.bedrooms && (
              <div className="stat-pill"><span className="icon">🛏</span> {property.bedrooms} Bedroom{property.bedrooms !== 1 ? "s" : ""}</div>
            )}
            {property.bathrooms && (
              <div className="stat-pill"><span className="icon">🚿</span> {property.bathrooms} Bathroom{property.bathrooms !== 1 ? "s" : ""}</div>
            )}
            {property.basePrice && (
              <div className="stat-pill"><span className="icon">💰</span> ${property.basePrice}/night</div>
            )}
          </div>
        </div>

        {/* ── Description ── */}
        {property.propertyDescription && (
          <div className="section">
            <div className="section-title"><span className="s-icon">📋</span> About This Property</div>
            <p className="desc">{property.propertyDescription}</p>
          </div>
        )}

        {/* ── Amenities ── */}
        {amenities.length > 0 && (
          <div className="section">
            <div className="section-title"><span className="s-icon">✨</span> Amenities</div>
            <div className="amenity-grid">
              {amenities.map((a, i) => (
                <div key={i} className="amenity-chip">{a}</div>
              ))}
            </div>
          </div>
        )}

        {/* ── WiFi & Access (gated) ── */}
        {(property.wifiPassword || property.smartLockCode || property.keyBoxPin) && (
          <div className="section">
            <div className="section-title"><span className="s-icon">🔑</span> Access &amp; WiFi</div>
            {!isMounted ? null : !hasToken ? (
              // Not logged in
              <div className="access-gate">
                <div className="access-gate-icon">🔒</div>
                <p className="access-gate-text">Log in to view WiFi &amp; access codes</p>
                <button
                  className="access-gate-btn"
                  onClick={() => router.push(`/login?redirect=/property/${id}`)}
                >
                  Log In
                </button>
              </div>
            ) : !hasAccess ? (
              // Logged in but no confirmed booking
              <div className="access-gate">
                <div className="access-gate-icon">📅</div>
                <p className="access-gate-text">Access codes are only shown to guests with a confirmed booking for this property.</p>
              </div>
            ) : (
              // Has a confirmed booking — show codes
              <div className="info-box">
                {property.wifiPassword && (
                  <>
                    <div className="info-row">
                      <span className="info-label">WiFi Password</span>
                      <span className="info-value">{property.wifiPassword}</span>
                    </div>
                    {(property.smartLockCode || property.keyBoxPin) && <div className="info-divider" />}
                  </>
                )}
                {property.smartLockCode && (
                  <>
                    <div className="info-row">
                      <span className="info-label">Smart Lock Code</span>
                      <span className="info-value">{property.smartLockCode}</span>
                    </div>
                    {property.keyBoxPin && <div className="info-divider" />}
                  </>
                )}
                {property.keyBoxPin && (
                  <div className="info-row">
                    <span className="info-label">Key Box PIN</span>
                    <span className="info-value">{property.keyBoxPin}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Pricing ── */}
        {property.basePrice && (
          <div className="section">
            <div className="section-title"><span className="s-icon">💳</span> Pricing</div>
            <div className="price-box">
              <div className="price-amount">${Number(property.basePrice).toLocaleString()}</div>
              <div className="price-label">per night</div>
            </div>
            <div style={{ display: "flex", gap: 12, marginTop: 14 }}>
              {property.weeklyOffers && (
                <div className="stat-pill" style={{ flex: 1, justifyContent: "center" }}>
                  <span className="icon">📅</span> Weekly: ${property.weeklyOffers}/night
                </div>
              )}
              {property.monthlyOffers && (
                <div className="stat-pill" style={{ flex: 1, justifyContent: "center" }}>
                  <span className="icon">🗓</span> Monthly: ${property.monthlyOffers}/night
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── House Rules (PDF) ── */}
        {property.houseRules && (
          <div className="section">
            <div className="section-title"><span className="s-icon">📄</span> House Rules</div>
            <a
              href={property.houseRules}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "flex", alignItems: "center", gap: 12, padding: "14px 18px",
                background: "#0d0d1a", border: "1px solid #1e1e30", borderRadius: 14,
                color: "#a78bfa", textDecoration: "none", fontWeight: 700, fontSize: 14,
                transition: "background 0.2s",
              }}
            >
              <span style={{ fontSize: 22 }}>📋</span>
              View Full House Rules
              <svg style={{ marginLeft: "auto" }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </a>
          </div>
        )}

        {/* ── Local Tips ── */}
        {localTips.length > 0 && (
          <div className="section">
            <div className="section-title"><span className="s-icon">🗺</span> Local Tips & Recommendations</div>
            <div className="tips-grid">
              {localTips.map((tip, i) => (
                <div key={i} className="tip-card">
                  {tip.subcategoryImage && (
                    <img src={tip.subcategoryImage} alt={tip.subcategoryName || ""} />
                  )}
                  <div className="tip-info">
                    <div className="tip-name">{tip.subcategoryName || tip.name || "Tip"}</div>
                    {tip.description && (
                      <div className="tip-desc">{tip.description}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Security Guard ── */}
        {guards.length > 0 && (
          <div className="section">
            <div className="section-title"><span className="s-icon">🛡</span> Security Contact</div>
            {guards.map((guard, i) => (
              <div key={i} className="guard-card" style={{ marginTop: i > 0 ? 12 : 0 }}>
                {guard.guardImage ? (
                  <img className="guard-avatar" src={guard.guardImage} alt={guard.guardName} />
                ) : (
                  <div className="guard-avatar-placeholder">👮</div>
                )}
                <div>
                  <div className="guard-name">{guard.guardName || "Security Guard"}</div>
                  {guard.guardPhone && (
                    <a href={`tel:${guard.guardPhone}`} className="guard-phone" style={{ textDecoration: "none", display: "block" }}>
                      📞 {guard.guardPhone}
                    </a>
                  )}
                  {guard.guardWhatsapp && (
                    <a
                      href={`https://wa.me/${guard.guardWhatsapp.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="guard-phone"
                      style={{ color: "#4ade80", textDecoration: "none", display: "block", marginTop: 2 }}
                    >
                      💬 WhatsApp
                    </a>
                  )}
                </div>
                <div className="guard-badge">On Duty</div>
              </div>
            ))}
          </div>
        )}

        {/* ── Footer ── */}
        <div className="property-footer">
          <p>Powered by <strong>Hostibook</strong> · Scan QR from your welcome packet</p>
          <p style={{ marginTop: 4 }}>Need help? Contact your host directly.</p>
        </div>
      </div>

      {/* ── Sticky Book Now Bar ── */}
      {property.availableForBooking && (
        <div className="sticky-bar">
          <div className="sticky-price">
            <span className="sticky-amount">${Number(property.basePrice || 0).toLocaleString()}</span>
            <span className="sticky-unit">/night</span>
          </div>
          <button className="sticky-btn" onClick={() => setShowBooking(true)}>
            Book Now
          </button>
        </div>
      )}

      {/* ── Booking Modal ── */}
      {showBooking && (
        <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) { setShowBooking(false); setBookingStep("form"); setBookingError(""); } }}>
          <div className="modal-card">
            <div className="modal-header">
              <h2 className="modal-title">Reserve Your Stay</h2>
              <button className="modal-close" onClick={() => { setShowBooking(false); setBookingStep("form"); setBookingError(""); }}>✕</button>
            </div>

            {bookingStep === "form" && (
              <>
                <div className="modal-property-name">{property.propertyTitle}</div>

                {/* Date Fields */}
                <div className="date-row">
                  <div className="date-field">
                    <label className="date-label">CHECK-IN</label>
                    <input
                      type="date"
                      className="date-input"
                      value={checkIn}
                      min={new Date().toISOString().split("T")[0]}
                      onChange={(e) => { setCheckIn(e.target.value); setBookingError(""); }}
                    />
                  </div>
                  <div className="date-divider" />
                  <div className="date-field">
                    <label className="date-label">CHECK-OUT</label>
                    <input
                      type="date"
                      className="date-input"
                      value={checkOut}
                      min={checkIn || new Date().toISOString().split("T")[0]}
                      onChange={(e) => { setCheckOut(e.target.value); setBookingError(""); }}
                    />
                  </div>
                </div>

                {/* Guests */}
                <div className="guests-row">
                  <span className="guests-label">👤 Guests</span>
                  <div className="guests-controls">
                    <button className="guests-btn" onClick={() => setGuests(Math.max(1, guests - 1))}>−</button>
                    <span className="guests-count">{guests}</span>
                    <button className="guests-btn" onClick={() => setGuests(Math.min(property.maxGuests || 20, guests + 1))}>+</button>
                  </div>
                </div>

                {/* Price Preview */}
                {checkIn && checkOut && (() => {
                  const nights = Math.max(0, Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000));
                  const subtotal = nights * Number(property.basePrice || 0);
                  return nights > 0 ? (
                    <div className="price-preview">
                      <div className="price-preview-row">
                        <span>${Number(property.basePrice || 0).toLocaleString()} × {nights} night{nights !== 1 ? "s" : ""}</span>
                        <span>${subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                      <div className="price-preview-divider" />
                      <div className="price-preview-row total">
                        <span>Total</span>
                        <span>${subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                  ) : null;
                })()}

                {bookingError && <div className="booking-error">{bookingError}</div>}

                <button
                  className="confirm-btn"
                  onClick={async () => {
                    setBookingError("");
                    if (!checkIn || !checkOut) { setBookingError("Please select check-in and check-out dates."); return; }
                    const nights = Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000);
                    if (nights <= 0) { setBookingError("Check-out must be after check-in."); return; }

                    // Check token
                    const token = typeof window !== "undefined"
                      ? localStorage.getItem("token") || document.cookie.match(/token=([^;]+)/)?.[1]
                      : null;
                    if (!token) {
                      router.push(`/login?redirect=/property/${id}`);
                      return;
                    }

                    setBookingStep("processing");
                    try {
                      const bookingRes = await createHotelBooking({
                        hotelId: id,
                        body: { bookedFromDate: checkIn, bookedToDate: checkOut, personOfGuests: guests },
                      }).unwrap();

                      const bookingId = bookingRes?.data?.id || bookingRes?.data?._id;
                      if (!bookingId) throw new Error("Booking creation failed");

                      const checkoutRes = await createStripeCheckout(bookingId).unwrap();
                      const checkoutUrl = checkoutRes?.data?.url || checkoutRes?.data?.checkoutUrl;
                      if (!checkoutUrl) throw new Error("Payment session failed");

                      window.open(checkoutUrl, "_blank");
                    } catch (err: any) {
                      setBookingStep("form");
                      setBookingError(err?.data?.message || err?.message || "Booking failed. Please try again.");
                    }
                  }}
                >
                  Confirm &amp; Pay
                </button>

                <p className="modal-note">You won't be charged yet — payment is processed on the next step.</p>
              </>
            )}

            {bookingStep === "processing" && (
              <div className="processing-state">
                <div className="property-spinner" style={{ margin: "0 auto" }} />
                <p style={{ color: "#a0a0b0", fontSize: 14, textAlign: "center", marginTop: 16 }}>
                  Creating your booking and redirecting to payment…
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        /* ── Sticky Bar ── */
        .sticky-bar {
          position: fixed; bottom: 0; left: 0; right: 0; z-index: 100;
          background: rgba(13, 13, 26, 0.9); backdrop-filter: blur(16px);
          border-top: 1px solid #1e1e30; padding: 14px 24px;
          display: flex; align-items: center; justify-content: space-between; gap: 16px;
        }
        .sticky-price { display: flex; align-items: baseline; gap: 4px; }
        .sticky-amount { font-size: 22px; font-weight: 900; color: #a78bfa; }
        .sticky-unit { font-size: 13px; color: #6060808; color: #606080; }
        .sticky-btn {
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          color: white; border: none; border-radius: 14px; padding: 14px 28px;
          font-size: 15px; font-weight: 800; cursor: pointer; transition: opacity 0.2s;
          white-space: nowrap;
        }
        .sticky-btn:hover { opacity: 0.85; }

        /* ── Modal ── */
        .modal-backdrop {
          position: fixed; inset: 0; z-index: 200;
          background: rgba(0,0,0,0.7); backdrop-filter: blur(8px);
          display: flex; align-items: flex-end; justify-content: center;
          padding: 0;
        }
        .modal-card {
          width: 100%; max-width: 520px; background: #13131f;
          border: 1px solid #1e1e30; border-radius: 24px 24px 0 0; padding: 28px 24px 36px;
          animation: slideUp 0.28s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @media (min-width: 560px) {
          .modal-backdrop { align-items: center; padding: 24px; }
          .modal-card { border-radius: 24px; max-height: 90vh; overflow-y: auto; }
        }
        .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
        .modal-title { font-size: 18px; font-weight: 800; color: #f0f0f4; }
        .modal-close { background: none; border: none; color: #606080; font-size: 18px; cursor: pointer; line-height: 1; padding: 4px; }
        .modal-close:hover { color: #f0f0f4; }
        .modal-property-name { font-size: 13px; color: #7070908; color: #707090; margin-bottom: 22px; }

        /* Date Row */
        .date-row {
          display: flex; gap: 0; background: #0d0d1a; border: 1px solid #1e1e30;
          border-radius: 16px; overflow: hidden; margin-bottom: 14px;
        }
        .date-field { flex: 1; padding: 14px 16px; }
        .date-divider { width: 1px; background: #1e1e30; align-self: stretch; }
        .date-label { display: block; font-size: 10px; font-weight: 700; color: #505070; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 6px; }
        .date-input {
          width: 100%; background: transparent; border: none; outline: none;
          color: #e0e0f0; font-size: 14px; font-weight: 600; cursor: pointer;
          color-scheme: dark;
        }

        /* Guests */
        .guests-row {
          display: flex; justify-content: space-between; align-items: center;
          background: #0d0d1a; border: 1px solid #1e1e30; border-radius: 16px;
          padding: 14px 18px; margin-bottom: 18px;
        }
        .guests-label { font-size: 14px; font-weight: 600; color: #c0c0d0; }
        .guests-controls { display: flex; align-items: center; gap: 14px; }
        .guests-btn {
          width: 32px; height: 32px; border-radius: 50%; background: #1e1e30;
          border: 1px solid #2a2a44; color: #e0e0f0; font-size: 18px; cursor: pointer;
          display: flex; align-items: center; justify-content: center; transition: background 0.15s;
        }
        .guests-btn:hover { background: #2a2a44; }
        .guests-count { font-size: 16px; font-weight: 800; color: #f0f0f4; min-width: 24px; text-align: center; }

        /* Price Preview */
        .price-preview {
          background: #0d0d1a; border: 1px solid #1e1e30; border-radius: 14px;
          padding: 16px 18px; margin-bottom: 18px;
        }
        .price-preview-row { display: flex; justify-content: space-between; font-size: 13px; color: #9090a8; }
        .price-preview-row.total { font-size: 15px; font-weight: 800; color: #e0e0f0; margin-top: 2px; }
        .price-preview-divider { height: 1px; background: #1e1e30; margin: 10px 0; }

        /* Error */
        .booking-error {
          background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.25);
          color: #f87171; font-size: 13px; font-weight: 600; border-radius: 12px;
          padding: 12px 16px; margin-bottom: 16px;
        }

        /* Confirm Button */
        .confirm-btn {
          width: 100%; padding: 16px; border-radius: 16px; border: none;
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          color: white; font-size: 16px; font-weight: 800; cursor: pointer;
          transition: opacity 0.2s; margin-bottom: 12px;
        }
        .confirm-btn:hover { opacity: 0.85; }
        .modal-note { font-size: 11px; color: #505070; text-align: center; line-height: 1.5; }

        /* Processing */
        .processing-state { padding: 32px 0; display: flex; flex-direction: column; align-items: center; }

        /* Access Gate */
        .access-gate {
          display: flex; flex-direction: column; align-items: center; gap: 10px;
          padding: 24px; text-align: center;
          background: #0d0d1a; border: 1px solid #1e1e30; border-radius: 14px;
        }
        .access-gate-icon { font-size: 32px; }
        .access-gate-text { font-size: 13px; color: #7070908; color: #707090; line-height: 1.5; max-width: 280px; }
        .access-gate-btn {
          margin-top: 4px; padding: 10px 24px; border-radius: 100px;
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          color: white; border: none; font-size: 13px; font-weight: 700; cursor: pointer;
          transition: opacity 0.2s;
        }
        .access-gate-btn:hover { opacity: 0.85; }

        /* Extra bottom space for sticky bar */
        .page { padding-bottom: 100px !important; }
      `}</style>
    </>
  );
}
