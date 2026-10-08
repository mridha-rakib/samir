"use client";

import { useState } from "react";
import { Star, CheckCircle2, Loader2, MessageSquare } from "lucide-react";
import { useSubmitReviewViaTokenMutation } from "../../../redux/api/reviewApi";
import { useSearchParams, useRouter } from "next/navigation";

export default function ReviewForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [submitReview, { isLoading }] = useSubmitReviewViaTokenMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!token) {
      setErrorMessage("Invalid or missing review token.");
      return;
    }
    if (rating === 0) {
      setErrorMessage("Please select a rating before submitting.");
      return;
    }

    try {
      const res = await submitReview({ token, rating, comment }).unwrap();
      if (res.success) {
        setIsSuccess(true);
        // Optional: redirect after some time
        // setTimeout(() => router.push("/"), 3000);
      }
    } catch (err: any) {
      setErrorMessage(err.data?.message || "Something went wrong. Please try again.");
    }
  };

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-blue-50/50 transform transition-all animate-in fade-in zoom-in duration-500">
        <div className="w-20 h-20 bg-green-100 text-green-500 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 size={40} />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-3">Thank You!</h2>
        <p className="text-gray-600 text-lg max-w-sm">
          Your feedback has been successfully submitted. We deeply appreciate your time!
        </p>
        <button
          onClick={() => router.push("/")}
          className="mt-8 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-full transition-colors shadow-md hover:shadow-lg"
        >
          Return to Home
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-gray-100 p-8 w-full max-w-xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Rate Your Experience</h2>
        <p className="text-gray-500">How was your stay? Let us know!</p>
      </div>

      <div className="flex flex-col items-center mb-8">
        <div className="flex space-x-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              onClick={() => setRating(star)}
              className={`transform transition-all duration-200 hover:scale-110 focus:outline-none ${
                (hoverRating || rating) >= star ? "text-yellow-400" : "text-gray-200"
              }`}
            >
              <Star
                size={48}
                className={(hoverRating || rating) >= star ? "fill-current" : ""}
                strokeWidth={1.5}
              />
            </button>
          ))}
        </div>
        <span className="mt-4 text-sm font-medium text-gray-400 uppercase tracking-widest">
          {rating === 0 ? "Select Rating" : rating === 5 ? "Excellent!" : rating >= 3 ? "Good" : "Needs Improvement"}
        </span>
      </div>

      <div className="mb-6 relative">
        <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
          Additional Comments (Optional)
        </label>
        <div className="relative">
          <MessageSquare className="absolute top-3 left-4 text-gray-400" size={20} />
          <textarea
            id="comment"
            rows={4}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none resize-none"
            placeholder="Tell us what you loved or what could be better..."
          />
        </div>
      </div>

      {errorMessage && (
        <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100">
          {errorMessage}
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading || !token}
        className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
      >
        {isLoading ? (
          <>
            <Loader2 className="animate-spin" size={20} />
            <span>Submitting...</span>
          </>
        ) : (
          <span>Submit Review</span>
        )}
      </button>

      {!token && (
        <p className="mt-4 text-center text-sm text-red-500">
          Security token missing. Please use the link provided in your email.
        </p>
      )}
    </form>
  );
}
