"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Play,
  Star,
  MousePointerClick,
  Share2,
  CheckCircle2,
  X,
  ShieldCheck,
  Box,
  Wrench,
  Waves,
  Brush,
  Video,
  Clock,
  CreditCard,
  UserCheck,
  HelpCircle,
  Building2,
  Landmark,
  Plus,
  Minus,
  Check,
  MinusCircle,
} from "lucide-react";

export default function LandingPage() {
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Prestataires services for the ribbon ticker
  const tickerServices = [
    { label: "Ménage", icon: Brush },
    { label: "Plomberie", icon: Wrench },
    { label: "Maintenance", icon: Wrench },
    { label: "Jardinier / Piscine", icon: Waves },
    { label: "Ménage", icon: Brush },
    { label: "Plomberie", icon: Wrench },
    { label: "Maintenance", icon: Wrench },
    { label: "Jardinier / Piscine", icon: Waves },
  ];

  // FAQ List Data
  const faqs = [
    {
      question: "À qui s’adresse Hostigo ?",
      answer:
        "Hostigo est conçu pour les propriétaires qui louent sur Leboncoin, sans être des professionnels de la location. Aucune compétence technique n’est nécessaire.",
    },
    {
      question: "Est-ce que Hostigo prend une commission sur mes réservations ?",
      answer:
        "Non, 0% de commission. Vous conservez 100% du montant de vos réservations directes et de vos extensions de séjour.",
    },
    {
      question: "L’abonnement est-il rentable ?",
      answer:
        "Absolument. Dès la première prolongation de séjour ou réservation directe via vos ambassadeurs, les économies de commission couvrent largement les 29 €/mois.",
    },
    {
      question: "Le tarif de 29 € est-il vraiment fixe, peu importe le nombre de réservations ?",
      answer:
        "Oui, le tarif reste de 29 € par mois sans aucun frais caché ni variation selon votre volume de réservations.",
    },
    {
      question: "Est-ce compliqué à utiliser ?",
      answer:
        "Non, l'interface est conçue pour être aussi simple qu'une application de messagerie. Vous êtes guidé pas à pas.",
    },
    {
      question: "Puis-je adapter mes prix selon les périodes ?",
      answer:
        "Oui, vous fixez et adaptez librement vos règles, vos tarifs de saison et vos week-ends en quelques clics.",
    },
    {
      question: "Comment Hostigo m’aide-t-il concrètement à protéger ma vie privée ?",
      answer:
        "Toutes les communications, consignes, codes et accès passent par l'application. Votre numéro personnel reste confidentiel.",
    },
    {
      question: "Que reçoit le locataire exactement ?",
      answer:
        "Un lien d'accès vers un espace web dédié avec son guide de bienvenue, Wi-Fi, codes, recommandations locales et option d'extension directe.",
    },
    {
      question: "Puis-je gérer plusieurs logements ?",
      answer:
        "Que vous ayez 1 ou 5 logements, votre tableau de bord vous dit exactement ce que vous avez gagné, sans calculs complexes.",
    },
    {
      question: "Est-ce compatible avec Leboncoin ?",
      answer:
        "Oui, parfaitement. Vous ajoutez simplement votre lien Hostigo à vos annonces Leboncoin et dans vos échanges avec les locataires.",
    },
    {
      question: "Mes données et celles de mes locataires sont-elles sécurisées ?",
      answer:
        "Oui, toutes les données et transactions sont chiffrées selon les plus hauts standards de sécurité bancaire et conformes RGPD.",
    },
    {
      question: "Puis-je arrêter quand je veux ?",
      answer:
        "Oui, l'abonnement est 100% sans engagement. Vous pouvez résilier en un clic à tout moment depuis votre compte.",
    },
    {
      question: "Y a-t-il une assistance en cas de problème ?",
      answer:
        "Oui, notre support est basé en France. Vous échangez avec une personne réelle, qui comprend votre quotidien de propriétaire.",
    },
    {
      question: "Pourquoi choisir Hostigo plutôt qu’un autre outil ?",
      answer:
        "Hostigo combine espace voyageur personnalisé, système ambassadeur viral, zéro commission sur extensions et réseau de prestataires vérifiés en un seul outil.",
    },
  ];

  return (
    <div className="min-h-screen bg-white text-zinc-900 font-sans antialiased selection:bg-[#0B4751]/20 selection:text-[#0B4751]">
      
      {/* ========================================================================= */}
      {/* 1. HEADER / NAVIGATION BAR                                                */}
      {/* ========================================================================= */}
      <header className="w-full max-w-7xl mx-auto px-6 sm:px-10 py-6 flex items-center justify-between">
        {/* Brand Logo with cloud icon and text on the right */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="relative h-7 w-7 sm:h-8 sm:w-8 transition-transform duration-200 group-hover:scale-105">
            <Image
              src="/landingpage/logo (2).png"
              alt="Hostigo Cloud Icon"
              fill
              className="object-contain"
              priority
            />
          </div>
          <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#0B4751]">
            HostiBook
          </span>
        </Link>

        {/* Login / Connect Button */}
        <Link
          href="/login"
          className="inline-flex items-center gap-2.5 bg-[#0B4751] hover:bg-[#08363e] text-white px-5 py-2.5 rounded-full text-sm font-semibold tracking-wide shadow-sm hover:shadow transition-all duration-200 active:scale-95"
        >
          <span className="w-6 h-6 rounded-full bg-white/15 flex items-center justify-center">
            <ArrowRight className="w-3.5 h-3.5 text-white" />
          </span>
          <span>Se connecter</span>
        </Link>
      </header>


      {/* ========================================================================= */}
      {/* 2. HERO SECTION                                                           */}
      {/* ========================================================================= */}
      <section className="relative overflow-hidden px-4 sm:px-8 pt-2 pb-16 lg:pb-24">
        {/* Large Rounded Hero Container */}
        <div className="relative max-w-7xl mx-auto rounded-[36px] sm:rounded-[56px] overflow-hidden bg-gradient-to-b from-[#EAF2F4]/80 via-[#F6F9FA]/90 to-[#E4EFF1]/80 border border-white/80 shadow-sm px-6 py-14 sm:py-20 lg:py-24 text-center flex flex-col items-center">
          
          {/* Background Architectural Overlay */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <Image
              src="/landingpage/herobg.png"
              alt="Hero Background Graphic"
              fill
              className="object-cover object-center opacity-30 mix-blend-multiply"
              priority
            />
            {/* Soft Radial Gradient for text contrast */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(255,255,255,0.92)_0%,_rgba(255,255,255,0.65)_50%,_rgba(255,255,255,0.15)_100%)]" />
            
            {/* Dot pattern accents */}
            <div className="absolute bottom-8 left-8 w-32 h-32 bg-[radial-gradient(#0B4751_1.5px,transparent_1.5px)] [background-size:14px_14px] opacity-15 hidden md:block" />
            <div className="absolute bottom-8 right-8 w-32 h-32 bg-[radial-gradient(#0B4751_1.5px,transparent_1.5px)] [background-size:14px_14px] opacity-15 hidden md:block" />
          </div>

          <div className="relative z-10 max-w-5xl mx-auto flex flex-col items-center">
            {/* Main Headline */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[54px] font-extrabold tracking-tight text-zinc-950 max-w-4xl leading-[1.16]">
              Multipliez vos réservations sans dépenser un euro en publicité
            </h1>

            {/* Subtitle */}
            <p className="mt-5 text-base sm:text-lg md:text-xl text-zinc-600 font-normal max-w-2xl">
              Faites de vos voyageurs vos meilleurs commerciaux
            </p>

            {/* Primary CTA Button */}
            <div className="mt-8 flex flex-col items-center gap-3.5">
              <Link
                href="/login"
                className="inline-flex items-center gap-3 bg-[#0B4751] hover:bg-[#08363e] text-white px-8 py-3.5 rounded-full text-base sm:text-lg font-bold shadow-md hover:shadow-lg transition-all duration-200 active:scale-95 group"
              >
                <span className="w-7 h-7 rounded-full bg-white/15 flex items-center justify-center transition-transform duration-200 group-hover:translate-x-0.5">
                  <ArrowRight className="w-4 h-4 text-white" />
                </span>
                <span>Je veux mes premiers ambassadeurs</span>
              </Link>

              {/* Trust Badges / Guarantees */}
              <p className="text-xs sm:text-sm text-zinc-500 font-medium tracking-wide">
                Zéro commission • Sans engagement • Support humain en France
              </p>
            </div>

            {/* Hero Media / Video Thumbnail Showcase */}
            <div className="mt-12 sm:mt-16 w-full max-w-4xl">
              <div className="relative rounded-3xl sm:rounded-[36px] overflow-hidden shadow-2xl border-4 sm:border-8 border-white group bg-zinc-900 aspect-[16/10]">
                <Image
                  src="/landingpage/hero video thumble.png"
                  alt="Showcase Villa Video Preview"
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  priority
                />

                {/* Center Interactive Play Button */}
                <button
                  onClick={() => setIsVideoModalOpen(true)}
                  className="absolute inset-0 m-auto w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#0B4751]/90 hover:bg-[#0B4751] text-white flex items-center justify-center backdrop-blur-sm shadow-xl transition-all duration-300 hover:scale-110 active:scale-95 group-hover:bg-[#0B4751]"
                  aria-label="Play presentation video"
                >
                  <Play className="w-7 h-7 sm:w-8 sm:h-8 fill-white text-white ml-1" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* ========================================================================= */}
      {/* 3. VALUE PROPOSITION BANNER (Transformez chaque séjour...)                 */}
      {/* ========================================================================= */}
      <section className="w-full bg-[#F4F8F9] py-16 sm:py-24 border-y border-zinc-100">
        <div className="max-w-6xl mx-auto px-6 sm:px-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-center">
          {/* Left Main Statement */}
          <div className="lg:col-span-7">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-zinc-950 leading-[1.2]">
              Transformez chaque séjour{" "}
              <span className="text-[#0B4751]">en publicité gratuite</span>
            </h2>
          </div>

          {/* Right Explanation Text */}
          <div className="lg:col-span-5">
            <p className="text-base sm:text-lg text-zinc-600 leading-relaxed">
              Une nuitée vendue, c&apos;est bien. Mais une nuitée qui vous apporte trois nouveaux clients. C&apos;est là que vous gagnez vraiment de l&apos;argent. HostiBook transforme chaque séjour en une machine à recruter.
            </p>
          </div>
        </div>
      </section>


      {/* ========================================================================= */}
      {/* 4. THREE STEPS / AMBASSADORS SECTION                                       */}
      {/* ========================================================================= */}
      <section className="w-full py-20 sm:py-28 bg-white">
        <div className="max-w-6xl mx-auto px-6 sm:px-10">
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-zinc-950">
              Et si vos voyageurs devenaient vos meilleurs ambassadeurs ?
            </h2>
            <p className="mt-5 text-base sm:text-lg text-zinc-600 leading-relaxed">
              Vous ne cherchez plus de clients, ce sont vos clients qui vous amènent leurs amis, leurs familles, leurs collègues. C&apos;est le bouche-à-oreille, <strong className="text-zinc-900">Version Pro</strong>.
            </p>
          </div>

          {/* 3 Step Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 relative">
            {/* Step 1 */}
            <div className="flex flex-col items-start border-l-2 md:border-l border-zinc-200/80 pl-6 md:pl-8">
              <span className="text-2xl font-bold text-[#0B4751] mb-4">01.</span>
              <h3 className="text-lg sm:text-xl font-bold text-zinc-950 flex items-center gap-2 mb-3">
                <span>La note sur 5 qui déclenche tout</span>
                <Star className="w-5 h-5 fill-[#0B4751] text-[#0B4751] shrink-0 inline-block" />
              </h3>
              <p className="text-sm sm:text-base text-zinc-600 leading-relaxed">
                Dès la fin du séjour, HostiBook demande une note sur 5 et un témoignage à votre locataire.
              </p>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-start border-l-2 md:border-l border-zinc-200/80 pl-6 md:pl-8">
              <span className="text-2xl font-bold text-[#0B4751] mb-4">02.</span>
              <h3 className="text-lg sm:text-xl font-bold text-zinc-950 flex items-center gap-2 mb-3">
                <span>Le clic qui change tout</span>
                <MousePointerClick className="w-5 h-5 text-[#0B4751] shrink-0 inline-block" />
              </h3>
              <p className="text-sm sm:text-base text-zinc-600 leading-relaxed">
                Si votre locataire est ravi, il peut cloner son avis partout sur le web (Google, Facebook, Leboncoin, Airbnb...
              </p>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-start border-l-2 md:border-l border-zinc-200/80 pl-6 md:pl-8">
              <span className="text-2xl font-bold text-[#0B4751] mb-4">03.</span>
              <h3 className="text-lg sm:text-xl font-bold text-zinc-950 flex items-center gap-2 mb-3">
                <span>Le partage viral</span>
                <Share2 className="w-5 h-5 text-[#0B4751] shrink-0 inline-block" />
              </h3>
              <p className="text-sm sm:text-base text-zinc-600 leading-relaxed">
                Si la note est excellente (&gt;4/5) un bouton partager apparaît. Le locataire peut partager votre logement directement à tous ses contacts (WhatsApp, SMS, réseaux).
              </p>
            </div>
          </div>

          {/* Centered CTA */}
          <div className="mt-16 text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-3 bg-[#0B4751] hover:bg-[#08363e] text-white px-8 py-3.5 rounded-full text-base font-bold shadow-md hover:shadow-lg transition-all duration-200 active:scale-95 group"
            >
              <span className="w-6 h-6 rounded-full bg-white/15 flex items-center justify-center transition-transform duration-200 group-hover:translate-x-0.5">
                <ArrowRight className="w-3.5 h-3.5 text-white" />
              </span>
              <span>Transformer mes voyageurs en ambassadeurs</span>
            </Link>
          </div>
        </div>
      </section>


      {/* ========================================================================= */}
      {/* 5. "GRAND JEU" / REVIEWS & IMPRESSIONS SECTION                            */}
      {/* ========================================================================= */}
      <section className="w-full bg-[#0B4751] text-white py-20 sm:py-28 overflow-hidden">
        <div className="max-w-6xl mx-auto px-6 sm:px-10 flex flex-col items-center">
          {/* Header */}
          <div className="text-center max-w-3xl mb-14 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight">
              Offrez-leur le &quot;Grand Jeu&quot;
            </h2>
            <p className="mt-4 text-base sm:text-lg text-emerald-100/90 font-normal leading-relaxed">
              On ne recommande pas une location &quot;banale&quot;. Impressionnez-les pour qu&apos;ils aient envie de partager votre adresse
            </p>
          </div>

          {/* Interactive Feature Card with Badges and Doodles */}
          <div className="w-full max-w-4xl relative">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl bg-zinc-800 aspect-[16/9]">
              <Image
                src="/landingpage/review bg.png"
                alt="Guest experiencing 5-star service"
                fill
                className="object-cover object-center"
              />

              {/* 5.0 Rating Badge */}
              <div className="absolute top-6 left-6 sm:top-10 sm:left-10 bg-white text-zinc-900 px-4 py-2 rounded-xl shadow-lg flex items-center gap-2 backdrop-blur-md">
                <span className="font-extrabold text-base sm:text-lg">5.0</span>
                <div className="flex text-[#0B4751] gap-0.5">
                  <Star className="w-4 h-4 fill-[#0B4751]" />
                  <Star className="w-4 h-4 fill-[#0B4751]" />
                  <Star className="w-4 h-4 fill-[#0B4751]" />
                  <Star className="w-4 h-4 fill-[#0B4751]" />
                  <Star className="w-4 h-4 fill-[#0B4751]" />
                </div>
              </div>

              {/* Circular Avatar Badge on Bottom Left */}
              <div className="absolute bottom-6 left-6 sm:bottom-10 sm:left-10 z-10">
                <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden border-4 border-white shadow-xl">
                  <Image
                    src="/landingpage/review rounded user.png"
                    alt="Verified Guest Avatar"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* ========================================================================= */}
      {/* 6. DUAL FEATURE SPLIT (Espace Voyageur & Guide Local)                      */}
      {/* ========================================================================= */}
      <section className="w-full grid grid-cols-1 md:grid-cols-2">
        {/* Left Column: Un espace voyageur qui répond à tout (Dark Slate) */}
        <div className="bg-[#595A5C] text-white p-12 sm:p-16 lg:p-20 flex flex-col items-center text-center justify-center">
          <div className="relative w-16 h-16 sm:w-20 sm:h-20 mb-6">
            <Image
              src="/landingpage/travel 1.png"
              alt="Guest portal traveler icon"
              fill
              className="object-contain"
            />
          </div>
          <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight max-w-md">
            Un espace voyageur qui répond à tout
          </h3>
          <p className="mt-4 text-sm sm:text-base text-zinc-300 leading-relaxed max-w-md">
            Wi-Fi, codes d&apos;accès, consignes... Ils ont tout sur leur téléphone. Fini les SMS à 23h pour savoir comment allumer le chauffage.
          </p>
        </div>

        {/* Right Column: Devenez leur guide local (Light Sage / Ice Blue) */}
        <div className="bg-[#D3DFE2] text-zinc-900 p-12 sm:p-16 lg:p-20 flex flex-col items-center text-center justify-center">
          <div className="relative w-16 h-16 sm:w-20 sm:h-20 mb-6">
            <Image
              src="/landingpage/guideboard.png"
              alt="Local Guide Signpost icon"
              fill
              className="object-contain"
            />
          </div>
          <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-950 max-w-md">
            Devenez leur guide local
          </h3>
          <p className="mt-4 text-sm sm:text-base text-zinc-700 leading-relaxed max-w-md">
            Partagez vos restos favoris et vos coins secrets. C&apos;est cette attention qui garantit le &quot;5 étoiles&quot;
          </p>
        </div>
      </section>


      {/* ========================================================================= */}
      {/* 7. REPRENEZ LE CONTRÔLE (Votre téléphone redevient personnel)              */}
      {/* ========================================================================= */}
      <section className="w-full bg-[#EBF1F3] py-20 sm:py-28">
        <div className="max-w-6xl mx-auto px-6 sm:px-10 flex flex-col items-center">
          {/* Section Header */}
          <div className="text-center max-w-3xl mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-zinc-950">
              Reprenez le contrôle : Votre téléphone redevient personnel
            </h2>
            <p className="mt-4 text-base sm:text-lg text-zinc-600 font-medium leading-relaxed">
              Il est temps pour vous de scinder votre vie privée de votre vie professionnelle, fini les messages tard le soir
            </p>
          </div>

          {/* 3 Floating Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
            {/* Card 1 */}
            <div className="bg-white rounded-3xl p-8 sm:p-10 shadow-sm hover:shadow-md transition-shadow flex flex-col items-start">
              <div className="w-12 h-12 rounded-full bg-[#0B4751] text-white flex items-center justify-center mb-6">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-zinc-950 mb-3">
                Un lien unique, zéro intrusion
              </h3>
              <p className="text-sm sm:text-base text-zinc-600 leading-relaxed">
                Plus besoin de donner votre numéro de portable à chaque contact Leboncoin/Airbnb. Les échanges sont centralisés, sérieux et sécurisés.
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-white rounded-3xl p-8 sm:p-10 shadow-sm hover:shadow-md transition-shadow flex flex-col items-start">
              <div className="w-12 h-12 rounded-full bg-[#0B4751] text-white flex items-center justify-center mb-6">
                <Box className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-zinc-950 mb-3">
                Le pilote automatique
              </h3>
              <p className="text-sm sm:text-base text-zinc-600 leading-relaxed">
                Calendrier synchronisé, prix qui s&apos;adaptent aux saisons... Vous fixez les règles, HostiBook s&apos;occupe de la mise à jour.
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-white rounded-3xl p-8 sm:p-10 shadow-sm hover:shadow-md transition-shadow flex flex-col items-start">
              <div className="w-12 h-12 rounded-full bg-[#0B4751] text-white flex items-center justify-center mb-6">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-zinc-950 mb-3">
                Vision panoramique
              </h3>
              <p className="text-sm sm:text-base text-zinc-600 leading-relaxed">
                Que vous ayez 1 ou 5 logements, votre tableau de bord vous dit exactement ce que vous avez gagné, sans calculs complexes.
              </p>
            </div>
          </div>

          {/* Bottom Button */}
          <div className="mt-14">
            <Link
              href="/login"
              className="inline-flex items-center gap-3 bg-[#0B4751] hover:bg-[#08363e] text-white px-8 py-3.5 rounded-full text-base font-bold shadow-md hover:shadow-lg transition-all duration-200 active:scale-95 group"
            >
              <span className="w-6 h-6 rounded-full bg-white/15 flex items-center justify-center transition-transform duration-200 group-hover:translate-x-0.5">
                <ArrowRight className="w-3.5 h-3.5 text-white" />
              </span>
              <span>Commencer à louer tranquillement</span>
            </Link>
          </div>
        </div>
      </section>


      {/* ========================================================================= */}
      {/* 8. APPLICATION EXCLUSIVE (Mobile App Showcase)                             */}
      {/* ========================================================================= */}
      <section className="w-full py-20 sm:py-28 bg-white overflow-hidden">
        <div className="max-w-6xl mx-auto px-6 sm:px-10 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Left Column: Text & 3 Feature Highlights */}
          <div className="lg:col-span-6 flex flex-col items-start">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-zinc-950 leading-[1.15]">
              Une Application exclusive qui valorise votre sérieux
            </h2>
            <p className="mt-5 text-sm sm:text-base text-zinc-600 leading-relaxed">
              Sur les sites classiques, votre client est entouré d&apos;annonces de voisins qui cherchent à vous voler la vedette. Avec HostiBook, une fois qu&apos;il a réservé, vous le sortez de la jungle pour le mettre dans votre propre vitrine.
            </p>

            <div className="mt-8 space-y-6 w-full">
              {/* Highlight Block 1 (Active Pill Card) */}
              <div className="bg-[#F4F8F9] border-l-4 border-[#0B4751] rounded-2xl p-6 shadow-sm">
                <h3 className="text-lg font-bold text-zinc-950">Aucune distraction</h3>
                <p className="mt-2 text-sm text-zinc-600 leading-relaxed">
                  Dans son espace personnel, il n&apos;y a aucune autre annonce. Pas de publicité, pas de suggestions, pas de voisins. Il est chez vous, et seulement chez vous.
                </p>
              </div>

              {/* Highlight Block 2 */}
              <div className="pl-6 border-l-2 border-transparent">
                <h3 className="text-lg font-bold text-zinc-950">Marquez les esprits</h3>
                <p className="mt-2 text-sm text-zinc-600 leading-relaxed">
                  En lui offrant cet espace pro et sans bruit autour, vous lui prouvez votre sérieux, votre professionnalisme et implicitement le locataire se mettra au même niveau que vous. Vous devenez une adresse sérieuse qu&apos;on a envie de retenir. Soyez fier de l&apos;image que vous renvoyez. Vos locataires sentent qu&apos;ils sont chez un hôte qui assure, pas chez un amateur.
                </p>
              </div>

              {/* Highlight Block 3 */}
              <div className="pl-6 border-l-2 border-transparent">
                <h3 className="text-lg font-bold text-zinc-950">Facilitez le partage</h3>
                <p className="mt-2 text-sm text-zinc-600 leading-relaxed">
                  Comme il n&apos;a pas été pollué par d&apos;autres offres, il n&apos;a qu&apos;un seul nom en tête quand il veut recommander un logement à ses amis : le vôtre.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Handheld Smartphone Application Image */}
          <div className="lg:col-span-6 flex justify-center">
            <div className="relative w-full max-w-lg aspect-square sm:aspect-[4/3] lg:aspect-[5/4] rounded-3xl overflow-hidden shadow-2xl">
              <Image
                src="/landingpage/mobile photo.png"
                alt="HostiBook Guest Mobile Application Experience"
                fill
                className="object-cover object-center"
              />
            </div>
          </div>

        </div>
      </section>


      {/* ========================================================================= */}
      {/* 9. OPPORTUNITÉ FINS DE SÉJOUR (Dark Teal Card Section)                     */}
      {/* ========================================================================= */}
      <section className="w-full py-16 sm:py-24 px-4 sm:px-8 bg-white">
        <div className="max-w-6xl mx-auto bg-[#0B4751] text-white rounded-3xl sm:rounded-[40px] p-8 sm:p-14 lg:p-20 shadow-2xl flex flex-col items-center">
          {/* Header */}
          <div className="text-center max-w-3xl mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-[1.2]">
              L&apos;opportunité qui transforme vos fins de séjour en pur profit
            </h2>
            <p className="mt-5 text-sm sm:text-base text-emerald-100/90 leading-relaxed">
              Il n&apos;y a rien de plus frustrant que de voir un locataire vouloir rester deux nuits de plus, mais devoir gérer cela par SMS, en liquide, ou pire, en perdant 20% de commission sur une autre plateforme.
            </p>
            <p className="mt-3 text-sm sm:text-base text-emerald-200 font-semibold">
              Avec HostiBook, c&apos;est rapide, efficace et rentable :
            </p>
          </div>

          {/* 3 White Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-zinc-900">
            {/* Card 1 */}
            <div className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 flex flex-col items-start shadow-md">
              <div className="w-8 h-8 rounded-full bg-[#0B4751] text-white flex items-center justify-center mb-4 shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-zinc-950 mb-2">
                L&apos;autonomie totale du locataire
              </h3>
              <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
                Votre voyageur peut demander une extension de séjour directement depuis son espace personnel. C&apos;est fluide, pro, et ça évite les négociations gênantes.
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 flex flex-col items-start shadow-md">
              <div className="w-8 h-8 rounded-full bg-[#0B4751] text-white flex items-center justify-center mb-4 shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-zinc-950 mb-2">
                Paiement instantané et sécurisé
              </h3>
              <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
                Il paie ses nuits supplémentaires par carte bancaire en un clic. L&apos;argent est sécurisé et <strong className="text-zinc-900 font-bold">transféré vers votre compte sans délai</strong>.
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 flex flex-col items-start shadow-md">
              <div className="w-8 h-8 rounded-full bg-[#0B4751] text-white flex items-center justify-center mb-4 shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-zinc-950 mb-2">
                Zéro commission cachée
              </h3>
              <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
                Que le séjour soit prolongé de 2 jours ou d&apos;une semaine, HostiBook ne prend aucun pourcentage sur la transaction. Une seule prolongation peut rentabiliser plusieurs mois d&apos;abonnement.
              </p>
            </div>
          </div>

          {/* Bottom Button */}
          <div className="mt-12 sm:mt-14">
            <Link
              href="/login"
              className="inline-flex items-center gap-3 bg-white hover:bg-zinc-100 text-[#0B4751] px-8 py-3.5 rounded-full text-base font-bold shadow-xl transition-all duration-200 active:scale-95 group"
            >
              <span className="w-6 h-6 rounded-full bg-[#0B4751] text-white flex items-center justify-center transition-transform duration-200 group-hover:translate-x-0.5">
                <ArrowRight className="w-3.5 h-3.5 text-white" />
              </span>
              <span>Arrêter de payer des commissions</span>
            </Link>
          </div>
        </div>
      </section>


      {/* ========================================================================= */}
      {/* 10. RÉSEAU DE PRESTATAIRES + SERVICE RIBBON TICKER                        */}
      {/* ========================================================================= */}
      <section className="w-full pt-16 sm:pt-24 bg-white">
        <div className="max-w-6xl mx-auto px-6 sm:px-10 text-center flex flex-col items-center">
          {/* Header */}
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-zinc-950 max-w-4xl leading-[1.2]">
            Ne soyez plus jamais seul : un réseau de prestataires à portée de main
          </h2>
          <p className="mt-5 text-base sm:text-lg text-zinc-600 max-w-3xl leading-relaxed">
            Gérer un évier bouché ou un ménage de dernière minute à distance ne doit plus être une source de stress. Nous mettons à votre disposition un réseau de professionnels locaux vérifiés prêts à intervenir.
          </p>
        </div>

        {/* Full-width Services Ribbon Bar */}
        <div className="mt-14 w-full bg-[#0B4751] py-5 overflow-x-auto no-scrollbar">
          <div className="flex items-center justify-around min-w-max gap-8 sm:gap-14 px-6 text-white text-sm sm:text-base font-semibold tracking-wide">
            {tickerServices.map((service, index) => {
              const IconComponent = service.icon;
              return (
                <div key={index} className="flex items-center gap-2.5 opacity-90 hover:opacity-100 transition-opacity">
                  <IconComponent className="w-5 h-5 text-emerald-300" />
                  <span>{service.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>


      {/* ========================================================================= */}
      {/* 11. NOUVELLE FAÇON DE TRAVAILLER AVEC VOS PRESTATAIRES                    */}
      {/* ========================================================================= */}
      <section className="w-full py-20 sm:py-28 bg-[#F0F6F7]">
        <div className="max-w-5xl mx-auto px-6 sm:px-10 flex flex-col items-center">
          {/* Header */}
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-zinc-950 text-center mb-16">
            Une nouvelle façon de travailler avec vos prestataires
          </h2>

          {/* 4 Floating White Service Cards */}
          <div className="w-full space-y-5">
            {/* Card 1 */}
            <div className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-sm hover:shadow-md transition-shadow flex items-start gap-5 sm:gap-6">
              <div className="w-12 h-12 rounded-2xl bg-[#0B4751] text-white flex items-center justify-center shrink-0">
                <UserCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-zinc-950 mb-2">
                  Un accès direct aux pros
                </h3>
                <p className="text-sm sm:text-base text-zinc-600 leading-relaxed">
                  Plus besoin de chercher pendant des heures, vous accédez aux prestataires disponibles dans votre secteur pour vos besoins quotidiens ou urgents. Vous pouvez sinon inviter vos propres prestataires habituels sur HostiBook. Ils profitent de l&apos;outil, et vous profitez de la sécurité pour chaque mission.
                </p>
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-sm hover:shadow-md transition-shadow flex items-start gap-5 sm:gap-6">
              <div className="w-12 h-12 rounded-2xl bg-[#0B4751] text-white flex items-center justify-center shrink-0">
                <Video className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-zinc-950 mb-2">
                  La preuve par l&apos;image
                </h3>
                <p className="text-sm sm:text-base text-zinc-600 leading-relaxed">
                  Pour chaque mission, le prestataire réalise une vidéo en direct à son arrivée depuis l&apos;application et une autre une fois la tâche terminée (vidéos datées et certifiées). Vous contrôlez la qualité, comme si vous étiez sur place.
                </p>
              </div>
            </div>

            {/* Card 3 */}
            <div className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-sm hover:shadow-md transition-shadow flex items-start gap-5 sm:gap-6">
              <div className="w-12 h-12 rounded-2xl bg-[#0B4751] text-white flex items-center justify-center shrink-0">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-zinc-950 mb-2">
                  48h pour valider
                </h3>
                <p className="text-sm sm:text-base text-zinc-600 leading-relaxed">
                  Une fois l&apos;intervention finie, vous gardez la main. Vous avez deux jours pour vérifier le résultat et valider la prestation sur votre application.
                </p>
              </div>
            </div>

            {/* Card 4 */}
            <div className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-sm hover:shadow-md transition-shadow flex items-start gap-5 sm:gap-6">
              <div className="w-12 h-12 rounded-2xl bg-[#0B4751] text-white flex items-center justify-center shrink-0">
                <CreditCard className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-zinc-950 mb-2">
                  Paiement sécurisé et sans litige
                </h3>
                <p className="text-sm sm:text-base text-zinc-600 leading-relaxed">
                  Le paiement n&apos;est libéré au prestataire que si vous validez la tâche. Si le travail ne correspond pas à ce qui était prévu, l&apos;argent reste bloqué et nous intervenons pour régler la situation.
                </p>
              </div>
            </div>
          </div>

          {/* Centered CTA */}
          <div className="mt-14 text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-3 bg-[#0B4751] hover:bg-[#08363e] text-white px-8 py-3.5 rounded-full text-base font-bold shadow-md hover:shadow-lg transition-all duration-200 active:scale-95 group"
            >
              <span className="w-6 h-6 rounded-full bg-white/15 flex items-center justify-center transition-transform duration-200 group-hover:translate-x-0.5">
                <ArrowRight className="w-3.5 h-3.5 text-white" />
              </span>
              <span>Sécuriser mes prochaines prestations</span>
            </Link>
          </div>
        </div>
      </section>


      {/* ========================================================================= */}
      {/* 12. COMPARISON CALCULATION: HostiBook ne vous coûte rien, il vous rapporte   */}
      {/* ========================================================================= */}
      <section className="w-full py-20 sm:py-28 bg-[#0B4751] text-white relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-6 sm:px-10 flex flex-col items-center">
          
          {/* Main Title & Subtitle */}
          <div className="text-center max-w-3xl mb-14 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-[1.15]">
              Faites le calcul : HostiBook ne vous coûte rien, il vous rapporte.
            </h2>
            <p className="mt-5 text-sm sm:text-base text-emerald-100/90 leading-relaxed">
              Prenons l’exemple de Jean, qui loue son appartement 80 € la nuit. Son locataire se sent bien et décide de prolonger son séjour de 3 nuits supplémentaires
            </p>
          </div>

          {/* 2 Comparison Cards (Platforme Classique vs Espace HostiBook) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-5xl text-zinc-900">
            
            {/* Left Card: Plateforme Classique */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-2xl">
              <div>
                <p className="text-sm text-zinc-600 leading-relaxed">
                  S&apos;il repasse par une plateforme classique (Commission ~17%) :<br />
                  Sur les 240 € de l&apos;extension, les frais cumulés (hôte + voyageur) s&apos;élèvent à environ 41 €.
                </p>
                <p className="mt-3 text-sm font-bold text-red-600">
                  Jean perd 41 €. C&apos;est déjà bien plus que le prix de son abonnement mensuel HostiBook.
                </p>
              </div>

              {/* Mockup Preview Area with Badge */}
              <div className="mt-6 relative rounded-2xl overflow-hidden bg-zinc-100 border border-zinc-200 aspect-[4/3] flex flex-col items-center justify-center p-4">
                <div className="relative w-full h-full rounded-xl overflow-hidden shadow-inner">
                  <Image
                    src="/landingpage/mobile photo.png"
                    alt="Plateforme classique mockup"
                    fill
                    className="object-cover brightness-90 filter grayscale-[0.2]"
                  />
                  <div className="absolute inset-0 bg-black/20" />
                </div>
                
                {/* Badge Bottom */}
                <div className="absolute bottom-4 bg-white text-red-600 px-4 py-2 rounded-full font-extrabold text-xs sm:text-sm shadow-lg flex items-center gap-2">
                  <MinusCircle className="w-4 h-4 text-red-500 fill-red-100" />
                  <span>PLATEFORME CLASSIQUE</span>
                </div>
              </div>
            </div>

            {/* Right Card: Espace HostiBook */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-2xl">
              <div>
                <p className="text-sm text-zinc-600 leading-relaxed">
                  S&apos;il utilise son espace HostiBook :<br />
                  Le locataire valide les 3 nuits en un clic. Jean reçoit 240 € directement.
                </p>
                <p className="mt-3 text-sm font-bold text-emerald-700">
                  Commission : 0 €
                </p>
              </div>

              {/* Mockup Preview Area with Badge */}
              <div className="mt-6 relative rounded-2xl overflow-hidden bg-zinc-100 border border-zinc-200 aspect-[4/3] flex flex-col items-center justify-center p-4">
                <div className="relative w-full h-full rounded-xl overflow-hidden shadow-inner">
                  <Image
                    src="/landingpage/mobile photo.png"
                    alt="Espace HostiBook mockup"
                    fill
                    className="object-cover"
                  />
                </div>
                
                {/* Badge Bottom */}
                <div className="absolute bottom-4 bg-white text-[#0B4751] px-4 py-2 rounded-full font-extrabold text-xs sm:text-sm shadow-lg flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 fill-emerald-100" />
                  <span>ESPACE HostiBook</span>
                </div>
              </div>
            </div>

          </div>

          {/* Bottom Financial Proof Explanation */}
          <div className="mt-14 max-w-4xl text-center text-emerald-100/90 text-sm sm:text-base leading-relaxed space-y-4">
            <p>
              L’abonnement est déjà rentabilisé. Avec cette seule prolongation, Jean a payé son abonnement HostiBook (29 €) et il lui reste <strong className="text-white font-bold">12 € de bénéfice</strong> supplémentaire dans la poche par rapport à avant.
            </p>
            <p className="text-xs sm:text-sm text-emerald-200/80">
              Et n’oubliez pas : ce calcul fonctionne que ce soit sur une seule prolongation de 3 nuits ou sur plusieurs petites extensions cumulées dans le mois. Dès que vous atteignez quelques nuitées en direct, HostiBook devient &quot;gratuit&quot; pour vous.
            </p>
            <p className="text-sm sm:text-base text-white font-medium">
              En clair : utiliser HostiBook est plus rentable que de ne pas l’utiliser. Tout le reste (système ambassadeur, sécurité, vie privée) devient un bonus offert.
            </p>
          </div>

          {/* CTA */}
          <div className="mt-10">
            <Link
              href="/login"
              className="inline-flex items-center gap-3 bg-white hover:bg-zinc-100 text-[#0B4751] px-8 py-3.5 rounded-full text-base font-bold shadow-xl transition-all duration-200 active:scale-95 group"
            >
              <span className="w-6 h-6 rounded-full bg-[#0B4751] text-white flex items-center justify-center transition-transform duration-200 group-hover:translate-x-0.5">
                <ArrowRight className="w-3.5 h-3.5 text-white" />
              </span>
              <span>Je récupère mes 17% de marge</span>
            </Link>
          </div>

        </div>
      </section>


      {/* ========================================================================= */}
      {/* 13. PRICING SECTION: Un prix fixe sans engagement (29 € / mois)           */}
      {/* ========================================================================= */}
      <section className="w-full py-20 sm:py-28 bg-[#F4F8F9]">
        <div className="max-w-4xl mx-auto px-6 sm:px-10 flex flex-col items-center">
          {/* Header */}
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-zinc-950">
              Un prix fixe sans engagement
            </h2>
            <p className="mt-3 text-base sm:text-lg text-zinc-600">
              Oubliez les commissions qui grignotent vos revenus.
            </p>
          </div>

          {/* Pricing Card */}
          <div className="w-full max-w-lg bg-white rounded-[32px] sm:rounded-[40px] p-8 sm:p-12 shadow-xl border-2 border-[#0B4751]/20 flex flex-col">
            {/* Price Header */}
            <div className="text-left border-b border-zinc-100 pb-6 mb-8">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl sm:text-5xl font-black text-[#0B4751]">29 €</span>
                <span className="text-lg text-zinc-500 font-semibold">/ mois</span>
              </div>
              <p className="mt-2 text-sm sm:text-base font-bold text-[#0B4751]">
                0% de commission et sans engagement
              </p>
              <p className="mt-4 text-xs sm:text-sm text-zinc-500 leading-relaxed">
                L’outil tout-en-un qui rentabilise votre investissement dès la première utilisation.
              </p>
            </div>

            {/* Checklist */}
            <div className="space-y-5 flex-1 text-left">
              {/* Item 1 */}
              <div className="flex items-start gap-3.5">
                <Check className="w-5 h-5 text-[#0B4751] shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-zinc-950">Système Ambassadeur</h4>
                  <p className="text-xs sm:text-sm text-zinc-500 leading-relaxed">
                    Vos clients reçoivent une demande d’avis et partagent votre logement à leurs contacts en un clic.
                  </p>
                </div>
              </div>

              {/* Item 2 */}
              <div className="flex items-start gap-3.5">
                <Check className="w-5 h-5 text-[#0B4751] shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-zinc-950">Paiements d’extensions</h4>
                  <p className="text-xs sm:text-sm text-zinc-500 leading-relaxed">
                    Proposez des nuits supplémentaires payables en direct, avec 0% de commission
                  </p>
                </div>
              </div>

              {/* Item 3 */}
              <div className="flex items-start gap-3.5">
                <Check className="w-5 h-5 text-[#0B4751] shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-zinc-950">Espace Privatif</h4>
                  <p className="text-xs sm:text-sm text-zinc-500 leading-relaxed">
                    Une application exclusive pour votre logement, sans aucune publicité pour vos concurrents.
                  </p>
                </div>
              </div>

              {/* Item 4 */}
              <div className="flex items-start gap-3.5">
                <Check className="w-5 h-5 text-[#0B4751] shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-zinc-950">Image 100% Professionnelle</h4>
                  <p className="text-xs sm:text-sm text-zinc-500 leading-relaxed">
                    Un espace centralisé avec votre Espace voyageur et vos Bons Plans locaux (restos, visites) pour épater vos voyageurs.
                  </p>
                </div>
              </div>

              {/* Item 5 */}
              <div className="flex items-start gap-3.5">
                <Check className="w-5 h-5 text-[#0B4751] shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-zinc-950">Bouclier Vie Privée</h4>
                  <p className="text-xs sm:text-sm text-zinc-500 leading-relaxed">
                    Un chat dédié et toutes les informations utiles au même endroit pour ne plus être harcelé sur votre téléphone personnel.
                  </p>
                </div>
              </div>

              {/* Item 6 */}
              <div className="flex items-start gap-3.5">
                <Check className="w-5 h-5 text-[#0B4751] shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-zinc-950">Prestataires à votre service</h4>
                  <p className="text-xs sm:text-sm text-zinc-500 leading-relaxed">
                    Un réseau de pros locaux avec contrôle vidéo des tâches et paiement bloqué jusqu’à votre validation.
                  </p>
                </div>
              </div>
            </div>

            {/* CTA Button */}
            <div className="mt-10 pt-4 flex flex-col items-center">
              <Link
                href="/login"
                className="w-full inline-flex items-center justify-center gap-3 bg-[#0B4751] hover:bg-[#08363e] text-white px-8 py-3.5 rounded-full text-base font-bold shadow-md hover:shadow-lg transition-all duration-200 active:scale-95 group"
              >
                <span className="w-6 h-6 rounded-full bg-white/15 flex items-center justify-center transition-transform duration-200 group-hover:translate-x-0.5">
                  <ArrowRight className="w-3.5 h-3.5 text-white" />
                </span>
                <span>Essayer HostiBook sans engagement</span>
              </Link>
              <p className="mt-3 text-xs text-zinc-400 font-medium">
                Installation en 2 minutes • Support basé en France
              </p>
            </div>

          </div>
        </div>
      </section>


      {/* ========================================================================= */}
      {/* 14. PRISE EN MAIN & SUPPORT HUMAIN                                        */}
      {/* ========================================================================= */}
      <section className="w-full py-20 sm:py-28 bg-white">
        <div className="max-w-6xl mx-auto px-6 sm:px-10 flex flex-col items-center">
          {/* Header */}
          <div className="text-center max-w-3xl mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-zinc-950">
              Une prise en main, un support :<br />Nous sommes à vos côtés
            </h2>
            <p className="mt-4 text-base sm:text-lg text-zinc-600 font-medium leading-relaxed">
              HostiBook n&apos;est pas une &quot;grosse plateforme&quot;. C&apos;est un outil à taille humaine, conçu pour les propriétaires particuliers
            </p>
          </div>

          {/* 3 Support Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
            {/* Card 1 */}
            <div className="bg-white rounded-3xl p-8 sm:p-10 shadow-sm border border-zinc-100 hover:shadow-md transition-shadow flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-[#F4F8F9] text-[#0B4751] flex items-center justify-center mb-6">
                <HelpCircle className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-zinc-950 mb-3">
                Zéro complexité technique
              </h3>
              <p className="text-sm sm:text-base text-zinc-600 leading-relaxed">
                Si vous savez envoyer un message, vous savez utiliser HostiBook
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-white rounded-3xl p-8 sm:p-10 shadow-sm border border-zinc-100 hover:shadow-md transition-shadow flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-[#F4F8F9] text-[#0B4751] flex items-center justify-center mb-6">
                <Landmark className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-zinc-950 mb-3">
                Une équipe française, vraiment disponible
              </h3>
              <p className="text-sm sm:text-base text-zinc-600 leading-relaxed">
                Le support est basé en France. Vous échangez avec une personne réelle, qui comprend votre quotidien de propriétaire
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-white rounded-3xl p-8 sm:p-10 shadow-sm border border-zinc-100 hover:shadow-md transition-shadow flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-[#F4F8F9] text-[#0B4751] flex items-center justify-center mb-6">
                <Building2 className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-zinc-950 mb-3">
                Une image plus soignée
              </h3>
              <p className="text-sm sm:text-base text-zinc-600 leading-relaxed">
                Vos locataires perçoivent immédiatement une organisation sérieuse et fluide
              </p>
            </div>
          </div>
        </div>
      </section>


      {/* ========================================================================= */}
      {/* 15. COMMENT COMMENCER SIMPLEMENT                                          */}
      {/* ========================================================================= */}
      <section className="w-full bg-[#0B4751] text-white py-20 sm:py-28 relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-6 sm:px-10 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Left Column: Heading & CTA */}
          <div className="lg:col-span-5 flex flex-col items-start">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-[1.2]">
              Comment commencer simplement
            </h2>
            <p className="mt-5 text-base sm:text-lg text-emerald-100/90 leading-relaxed">
              Louez mieux, gagnez plus, et laissez vos clients faire le travail pour vous
            </p>
            <div className="mt-8">
              <Link
                href="/login"
                className="inline-flex items-center gap-3 bg-white hover:bg-zinc-100 text-[#0B4751] px-8 py-3.5 rounded-full text-base font-bold shadow-xl transition-all duration-200 active:scale-95 group"
              >
                <span className="w-6 h-6 rounded-full bg-[#0B4751] text-white flex items-center justify-center transition-transform duration-200 group-hover:translate-x-0.5">
                  <ArrowRight className="w-3.5 h-3.5 text-white" />
                </span>
                <span>Je simplifie ma gestion</span>
              </Link>
            </div>
          </div>

          {/* Right Column: 3 Steps */}
          <div className="lg:col-span-7 space-y-5">
            {/* Step 1 */}
            <div className="bg-[#125864]/90 rounded-2xl sm:rounded-3xl p-6 sm:p-8 flex items-start gap-5 border border-white/10 shadow-lg">
              <div className="w-8 h-8 rounded-xl bg-white text-[#0B4751] font-bold text-sm flex items-center justify-center shrink-0">
                1
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-white mb-2">
                  Une image plus soignée
                </h3>
                <p className="text-sm sm:text-base text-emerald-100/90 leading-relaxed">
                  Ajoutez vos informations et recommandations en quelques minutes.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-[#125864]/90 rounded-2xl sm:rounded-3xl p-6 sm:p-8 flex items-start gap-5 border border-white/10 shadow-lg">
              <div className="w-8 h-8 rounded-xl bg-white text-[#0B4751] font-bold text-sm flex items-center justify-center shrink-0">
                2
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-white mb-2">
                  Partagez votre lien
                </h3>
                <p className="text-sm sm:text-base text-emerald-100/90 leading-relaxed">
                  Ajoutez votre lien HostiBook à vos annonces Leboncoin et à vos échanges avec les locataires.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-[#125864]/90 rounded-2xl sm:rounded-3xl p-6 sm:p-8 flex items-start gap-5 border border-white/10 shadow-lg">
              <div className="w-8 h-8 rounded-xl bg-white text-[#0B4751] font-bold text-sm flex items-center justify-center shrink-0">
                3
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-white mb-2">
                  Appréciez le calme
                </h3>
                <p className="text-sm sm:text-base text-emerald-100/90 leading-relaxed">
                  Moins de questions, moins d&apos;imprévus, plus de sérénité.
                </p>
              </div>
            </div>
          </div>

        </div>
      </section>


      {/* ========================================================================= */}
      {/* 16. FAQs ACCORDION SECTION                                                */}
      {/* ========================================================================= */}
      <section className="w-full py-20 sm:py-28 bg-[#F0F6F7]">
        <div className="max-w-4xl mx-auto px-6 sm:px-10 flex flex-col items-center">
          {/* Header */}
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-zinc-950 text-center mb-16">
            FAQs
          </h2>

          {/* Accordion Container */}
          <div className="w-full space-y-4">
            {faqs.map((faq, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <div
                  key={index}
                  className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-zinc-100 overflow-hidden transition-all duration-200"
                >
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                    className="w-full text-left p-6 sm:p-7 flex items-center justify-between gap-4 font-bold text-zinc-900 hover:text-[#0B4751] transition-colors"
                  >
                    <span className="text-base sm:text-lg">{faq.question}</span>
                    <span className="shrink-0 w-8 h-8 rounded-full bg-zinc-100 text-[#0B4751] flex items-center justify-center transition-transform">
                      {isOpen ? (
                        <Minus className="w-4 h-4" />
                      ) : (
                        <Plus className="w-4 h-4" />
                      )}
                    </span>
                  </button>
                  {isOpen && (
                    <div className="px-6 sm:px-7 pb-6 sm:pb-7 text-sm sm:text-base text-zinc-600 leading-relaxed border-t border-zinc-100 pt-4 animate-in fade-in duration-200">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>


      {/* ========================================================================= */}
      {/* 17. FOOTER SECTION                                                        */}
      {/* ========================================================================= */}
      <footer className="w-full bg-zinc-950 text-zinc-400 py-14 px-6 sm:px-10 border-t border-zinc-800">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          {/* Logo Brand */}
          <div className="flex items-center gap-2.5">
            <div className="relative h-6 w-6 sm:h-7 sm:w-7">
              <Image
                src="/landingpage/logo (2).png"
                alt="HostiBook Logo"
                fill
                className="object-contain brightness-0 invert"
              />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">
              HostiBook
            </span>
          </div>

          {/* Quick links & Copyright */}
          <div className="flex items-center gap-6 text-sm">
            <Link href="/privacy-policy" className="hover:text-white transition-colors">
              Politique de confidentialité
            </Link>
            <Link href="/login" className="hover:text-white transition-colors">
              Espace Membre
            </Link>
          </div>

          <p className="text-xs text-zinc-500">
            &copy; {new Date().getFullYear()} HostiBook. Tous droits réservés.
          </p>
        </div>
      </footer>


      {/* ========================================================================= */}
      {/* VIDEO MODAL (If user clicks Play button)                                 */}
      {/* ========================================================================= */}
      {isVideoModalOpen && (
        <div
          onClick={() => setIsVideoModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 sm:p-6 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-4xl bg-black rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl border border-zinc-800"
          >
            {/* Close Modal Button */}
            <button
              onClick={() => setIsVideoModalOpen(false)}
              className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 p-2.5 rounded-full bg-black/70 hover:bg-black text-white transition-all hover:scale-105 active:scale-95 shadow-lg border border-white/10"
              aria-label="Fermer la vidéo"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Cloudinary Stream Video Player */}
            <div className="relative w-full aspect-video bg-black flex items-center justify-center">
              <video
                src="https://res.cloudinary.com/dhxyjdrvr/video/upload/q_auto,f_auto/v1787654817/hostigo/luxury_airbnb_property_tour.mp4"
                controls
                autoPlay
                playsInline
                preload="metadata"
                className="w-full h-full object-contain"
              >
                Votre navigateur ne prend pas en charge la lecture de cette vidéo.
              </video>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}