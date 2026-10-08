"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";

const onboardingSlides = [
  {
    image: "/login (1).png",
    title: "Hostibook",
    subtitle: "Simplify your property management.",
    color: "from-blue-600 to-indigo-700",
  },
  {
    image: "/login (2).png",
    title: "Welcome to Hostibook",
    subtitle: "List properties, manage bookings, and track services - all in one connected platform.",
    color: "from-indigo-600 to-blue-700",
  },
  {
    image: "/login (3).png",
    title: "Stay in control with Hostibook",
    subtitle: "Manage your properties, track tasks, and connect with your team wherever you go.",
    color: "from-blue-700 to-indigo-800",
  },
];

export default function Home() {
  const router = useRouter();
  const token = useSelector((state: RootState) => state.auth.token);
  const user = useSelector((state: RootState) => state.auth.user);

  const [currentSlide, setCurrentSlide] = useState(0);
  const [showRoleSelection, setShowRoleSelection] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  // Auto-login redirect if token and user role exist
  useEffect(() => {
    if (token && user?.role) {
      let roleQuery = "guest";
      if (user.role === "PROPERTY_OWNER") roleQuery = "property owner";
      else if (user.role === "SERVICE_PROVIDER") roleQuery = "service provider";
      router.replace(`/dashboard?role=${encodeURIComponent(roleQuery)}`);
    }
  }, [token, user, router]);

  // Auto-play slider on desktop left panel
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % onboardingSlides.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  const handleNextMobile = () => {
    if (currentSlide < onboardingSlides.length - 1) {
      setCurrentSlide((prev) => prev + 1);
    } else {
      setShowRoleSelection(true);
    }
  };

  const handleSkipMobile = () => {
    setShowRoleSelection(true);
  };

  const handleSelectRole = (role: string) => {
    setSelectedRole(role);
    // Smooth transition before navigating
    setTimeout(() => {
      router.push(`/login?role=${encodeURIComponent(role.toLowerCase())}`);
    }, 300);
  };

  return (
    <div className="flex min-h-screen flex-col bg-zinc-100 font-sans text-zinc-900 antialiased selection:bg-blue-100 selection:text-blue-800">
      {/* Outer wrapper */}
      <main className="flex flex-1 flex-col md:flex-row">
        
        {/* LEFT COLUMN: ONBOARDING SLIDESHOW (Visible on desktop/tablet, serving as the immersive brand side) */}
        <section className="relative hidden flex-1 flex-col justify-between overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-12 text-white md:flex lg:p-16">
          {/* Logo brand top-left */}
          <div className="z-10 flex items-center gap-3">
            <div className="relative h-12 w-12 rounded-xl bg-white/10 p-2 backdrop-blur-md transition-transform duration-300 hover:scale-105">
              <Image
                src="/Logo.png"
                alt="Hostibook Logo"
                fill
                priority
                className="object-contain p-1"
              />
            </div>
            <span className="text-2xl font-bold tracking-tight">Hostibook</span>
          </div>

          {/* Interactive Slides Container */}
          <div className="relative z-10 flex flex-1 flex-col items-center justify-center py-12">
            <div className="relative w-full max-w-lg aspect-square mb-8">
              {onboardingSlides.map((slide, idx) => (
                <div
                  key={idx}
                  className={`absolute inset-0 flex flex-col items-center justify-center transition-all duration-700 ease-in-out ${
                    idx === currentSlide
                      ? "opacity-100 translate-y-0 scale-100 pointer-events-auto"
                      : "opacity-0 translate-y-8 scale-95 pointer-events-none"
                  }`}
                >
                  <div className="relative h-72 w-72 lg:h-80 lg:w-80 filter drop-shadow-2xl">
                    <Image
                      src={slide.image}
                      alt={slide.title}
                      fill
                      priority
                      className="object-contain"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Slider Content */}
            <div className="w-full max-w-md text-center">
              {onboardingSlides.map((slide, idx) => (
                <div
                  key={idx}
                  className={`transition-all duration-500 ${
                    idx === currentSlide
                      ? "block opacity-100"
                      : "hidden opacity-0"
                  }`}
                >
                  <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl mb-4">
                    {slide.title}
                  </h2>
                  <p className="text-lg text-blue-100/90 font-medium leading-relaxed">
                    {slide.subtitle}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Dot Indicators */}
          <div className="z-10 flex items-center justify-between">
            <div className="flex gap-2">
              {onboardingSlides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlide(idx)}
                  className={`h-2.5 rounded-full transition-all duration-300 ${
                    idx === currentSlide
                      ? "w-8 bg-white"
                      : "w-2.5 bg-white/40 hover:bg-white/60"
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
            <Link
              href="/landingpage"
              className="text-xs text-white/80 hover:text-white font-medium underline underline-offset-4 transition-colors"
            >
              Découvrir la présentation Hostibook →
            </Link>
          </div>

          {/* Decorative backdrop glow */}
          <div className="absolute -left-20 -top-20 h-80 w-80 rounded-full bg-blue-500/25 blur-3xl" />
          <div className="absolute -right-20 -bottom-20 h-85 w-85 rounded-full bg-indigo-500/25 blur-3xl" />
        </section>

        {/* RIGHT COLUMN: SELECT YOUR ROLE (Desktop view alongside the slider, Mobile view as page transition) */}
        <section className={`flex flex-col justify-center items-center w-full bg-white md:w-[480px] lg:w-[560px] p-6 sm:p-10 md:p-12 transition-all duration-500 ${
          showRoleSelection ? "flex" : "hidden md:flex"
        }`}>
          {/* Mobile Back Button (only shown on mobile when in Role Selection screen) */}
          <div className="w-full max-w-md flex items-center justify-between mb-8 md:hidden">
            <button
              onClick={() => setShowRoleSelection(false)}
              className="flex items-center justify-center h-10 w-10 rounded-full bg-zinc-100 hover:bg-zinc-200 transition-colors"
              aria-label="Back to onboarding"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="relative h-7 w-24">
              <Image src="/Logo.png" alt="Hostibook Logo" fill className="object-contain" />
            </div>
            <div className="w-10 h-10 opacity-0" /> {/* Spacer */}
          </div>

          {/* Desktop Logo (hidden on mobile) */}
          <div className="hidden w-full max-w-md mb-10 md:flex flex-col items-center">
            <div className="relative h-14 w-14 rounded-2xl bg-blue-50 p-2.5 mb-4 shadow-sm">
              <Image src="/Logo.png" alt="Hostibook Logo" fill className="object-contain p-1.5" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-blue-600">Hostibook</h1>
          </div>

          {/* Heading Container */}
          <div className="w-full max-w-md text-center md:text-left mb-8">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight">
              Select Your Role
            </h2>
            <p className="mt-2 text-sm sm:text-base text-zinc-500">
              Choose how you&apos;ll use Hostibook
            </p>
          </div>

          {/* Role Choice Cards */}
          <div className="w-full max-w-md space-y-4">
            {/* PROPERTY OWNER CARD */}
            <button
              onClick={() => handleSelectRole("Property Owner")}
              disabled={selectedRole !== null}
              className={`w-full flex items-start gap-4 p-5 rounded-2xl border-2 text-left transition-all duration-300 hover:-translate-y-0.5 ${
                selectedRole === "Property Owner"
                  ? "border-blue-600 bg-blue-50/50 shadow-md shadow-blue-500/10 ring-1 ring-blue-500/20"
                  : "border-zinc-200 bg-white hover:border-zinc-300 hover:shadow-sm"
              }`}
            >
              <div className={`p-3 rounded-xl transition-colors shrink-0 ${
                selectedRole === "Property Owner" ? "bg-blue-600 text-white" : "bg-blue-50"
              }`}>
                <div className="relative h-8 w-8">
                  <Image
                    src="/logo of  Property Owner.png"
                    alt="Property Owner Icon"
                    fill
                    className="object-contain"
                  />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-base sm:text-lg font-bold text-zinc-950">Property Owner</h3>
                <p className="mt-1 text-xs sm:text-sm text-zinc-500 leading-relaxed">
                  Manage your properties, bookings, and security staff.
                </p>
              </div>
              <div className="self-center">
                <svg
                  className={`w-5 h-5 transition-transform duration-300 ${
                    selectedRole === "Property Owner" ? "translate-x-1 text-blue-600" : "text-zinc-400 group-hover:translate-x-1"
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>

            {/* SERVICE PROVIDER CARD */}
            <button
              onClick={() => handleSelectRole("Service Provider")}
              disabled={selectedRole !== null}
              className={`w-full flex items-start gap-4 p-5 rounded-2xl border-2 text-left transition-all duration-300 hover:-translate-y-0.5 ${
                selectedRole === "Service Provider"
                  ? "border-blue-600 bg-blue-50/50 shadow-md shadow-blue-500/10 ring-1 ring-blue-500/20"
                  : "border-zinc-200 bg-white hover:border-zinc-300 hover:shadow-sm"
              }`}
            >
              <div className={`p-3 rounded-xl transition-colors shrink-0 ${
                selectedRole === "Service Provider" ? "bg-blue-600 text-white" : "bg-blue-50"
              }`}>
                <div className="relative h-8 w-8">
                  <Image
                    src="/logo of  Service Provider.png"
                    alt="Service Provider Icon"
                    fill
                    className="object-contain"
                  />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-base sm:text-lg font-bold text-zinc-950">Service Provider</h3>
                <p className="mt-1 text-xs sm:text-sm text-zinc-500 leading-relaxed">
                  View and complete tasks, and receive direct payments.
                </p>
              </div>
              <div className="self-center">
                <svg
                  className={`w-5 h-5 transition-transform duration-300 ${
                    selectedRole === "Service Provider" ? "translate-x-1 text-blue-600" : "text-zinc-400"
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>

            {/* GUEST CARD */}
            <button
              onClick={() => handleSelectRole("Guest")}
              disabled={selectedRole !== null}
              className={`w-full flex items-start gap-4 p-5 rounded-2xl border-2 text-left transition-all duration-300 hover:-translate-y-0.5 ${
                selectedRole === "Guest"
                  ? "border-blue-600 bg-blue-50/50 shadow-md shadow-blue-500/10 ring-1 ring-blue-500/20"
                  : "border-zinc-200 bg-white hover:border-zinc-300 hover:shadow-sm"
              }`}
            >
              <div className={`p-3 rounded-xl transition-colors shrink-0 ${
                selectedRole === "Guest" ? "bg-blue-600 text-white" : "bg-blue-50"
              }`}>
                <div className="relative h-8 w-8">
                  <Image
                    src="/logo of  Guest.png"
                    alt="Guest Icon"
                    fill
                    className="object-contain"
                  />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-base sm:text-lg font-bold text-zinc-950">Guest</h3>
                <p className="mt-1 text-xs sm:text-sm text-zinc-500 leading-relaxed">
                  Explore properties, book stays, and chat with your host.
                </p>
              </div>
              <div className="self-center">
                <svg
                  className={`w-5 h-5 transition-transform duration-300 ${
                    selectedRole === "Guest" ? "translate-x-1 text-blue-600" : "text-zinc-400"
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>

            {/* Link to Landing Page */}
            <div className="mt-6 pt-5 border-t border-zinc-100 w-full text-center">
              <Link
                href="/landingpage"
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline transition-colors group"
              >
                <span>Découvrir la présentation Hostibook</span>
                <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
              </Link>
            </div>
          </div>
        </section>

        {/* MOBILE PORT: ONLY SHOWS ONBOARDING SCREEN SLIDER ON MOBILE WHEN showRoleSelection is FALSE */}
        <section className={`flex-1 flex-col justify-between p-6 bg-white md:hidden transition-all duration-500 ${
          showRoleSelection ? "hidden" : "flex"
        }`}>
          {/* Mobile Header: Dot indicators and Skip */}
          <div className="flex items-center justify-between">
            {/* Dots */}
            <div className="flex items-center gap-1.5">
              {onboardingSlides.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    idx === currentSlide ? "w-6 bg-blue-600" : "w-2 bg-zinc-300"
                  }`}
                />
              ))}
            </div>
            
            {/* Skip */}
            <button
              onClick={handleSkipMobile}
              className="text-sm font-semibold text-zinc-400 hover:text-zinc-600 transition-colors"
            >
              Skip
            </button>
          </div>

          {/* Mobile Slide Illustration */}
          <div className="my-8 flex flex-col items-center justify-center flex-1">
            <div className="relative w-64 h-64 sm:w-72 sm:h-72 filter drop-shadow-xl transition-all duration-500">
              <Image
                src={onboardingSlides[currentSlide].image}
                alt={onboardingSlides[currentSlide].title}
                fill
                priority
                className="object-contain"
              />
            </div>
          </div>

          {/* Mobile Typography and Action Buttons */}
          <div className="w-full flex flex-col items-center">
            {/* Title & Sub */}
            <div className="text-center max-w-sm mb-10">
              <h2 className="text-2xl font-extrabold tracking-tight text-zinc-900">
                {onboardingSlides[currentSlide].title}
              </h2>
              <p className="mt-3 text-sm sm:text-base text-zinc-500 leading-relaxed font-medium">
                {onboardingSlides[currentSlide].subtitle}
              </p>
            </div>

            {/* Next Button */}
            <button
              onClick={handleNextMobile}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all"
            >
              Next
            </button>

            {/* Already account */}
            <p className="mt-4 text-xs font-semibold text-zinc-500">
              Already have an account?{" "}
              <button
                onClick={() => router.push("/login")}
                className="text-blue-600 hover:underline font-bold"
              >
                Log in
              </button>
            </p>

            {/* Landing page link */}
            <div className="mt-4 text-center">
              <Link
                href="/landingpage"
                className="text-xs font-bold text-blue-600 hover:underline"
              >
                Découvrir la présentation Hostibook →
              </Link>
            </div>
          </div>
        </section>
        
      </main>
    </div>
  );
}
