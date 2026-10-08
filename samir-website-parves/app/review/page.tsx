import ReviewForm from "./components/ReviewForm";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

export const metadata = {
  title: "Review Your Stay | Samir Booking",
  description: "Share your feedback about your stay.",
};

export default function ReviewPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 py-16 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="absolute top-0 left-0 w-full h-96 bg-blue-600/5 -skew-y-6 transform origin-top-left -z-10"></div>
      
      <div className="w-full max-w-4xl mx-auto flex flex-col items-center">
        <div className="mb-10 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold text-blue-900 mb-4 tracking-tight">
            Samir Booking
          </h1>
          <p className="text-lg text-blue-700/80 max-w-xl mx-auto">
            Your opinion shapes our standard. We're excited to hear about your experience!
          </p>
        </div>

        <Suspense fallback={
          <div className="flex justify-center p-12">
            <Loader2 className="animate-spin text-blue-600" size={48} />
          </div>
        }>
          <ReviewForm />
        </Suspense>
      </div>
    </div>
  );
}
