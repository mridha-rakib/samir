import { useState } from "react";
import { IoEyeOffOutline, IoEyeOutline } from "react-icons/io5";
import { useChangePasswordMutation } from "../../redux/api/authApi";
import { message } from "antd";

function ChangePass() {
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [changePassword, { isLoading }] = useChangePasswordMutation();

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);
    const passwordData = {
      oldPassword: formData.get("currentPassword"),
      newPassword: formData.get("newPassword"),
      confirmPassword: formData.get("confirmPassword"),
    };

    // Validate passwords match
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      message.error("New password and confirm password do not match");
      return;
    }

    try {
      await changePassword(passwordData).unwrap();
      message.success("Password changed successfully!");
      e.target.reset();
    } catch (error) {
      message.error(error?.data?.message || "Failed to change password");
    }
  };

  return (
    <div className="bg-white w-full max-w-xl mx-auto px-4 sm:px-6 md:px-8 pt-8 py-5 rounded-md border border-gray-200 shadow-sm">
      <p className="text-[#111827] text-center font-bold text-xl sm:text-2xl mb-5">
        Change Password
      </p>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="w-full">
          <label
            htmlFor="password"
            className="text-sm md:text-base text-[#111827] mb-2 font-semibold"
          >
            Current Password
          </label>
          <div className="w-full relative">
            <input
              type={showPassword ? "text" : "password"}
              name="currentPassword"
              placeholder="**********"
              className="w-full border border-gray-300 rounded-md outline-none px-4 py-3 placeholder:text-sm md:placeholder:text-base focus:ring-2 focus:ring-[#74AA2E]"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center text-[#6A6D76]"
            >
              {showPassword ? (
                <IoEyeOffOutline className="w-5 h-5 cursor-pointer" />
              ) : (
                <IoEyeOutline className="w-5 h-5 cursor-pointer" />
              )}
            </button>
          </div>
        </div>
        <div className="w-full">
          <label
            htmlFor="password"
            className="text-sm md:text-base text-[#111827] mb-2 font-semibold"
          >
            New Password
          </label>
          <div className="w-full relative">
            <input
              type={showNewPassword ? "text" : "password"}
              name="newPassword"
              placeholder="**********"
              className="w-full border border-gray-300 rounded-md outline-none px-4 py-3 placeholder:text-sm md:placeholder:text-base focus:ring-2 focus:ring-[#74AA2E]"
              required
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center text-[#6A6D76]"
            >
              {showNewPassword ? (
                <IoEyeOffOutline className="w-5 h-5 cursor-pointer" />
              ) : (
                <IoEyeOutline className="w-5 h-5 cursor-pointer" />
              )}
            </button>
          </div>
        </div>
        <div className="w-full">
          <label
            htmlFor="password"
            className="text-sm md:text-base text-[#111827] mb-2 font-semibold"
          >
            Confirm New Password
          </label>
          <div className="w-full relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              name="confirmPassword"
              placeholder="**********"
              className="w-full border border-gray-300 rounded-md outline-none px-4 py-3 placeholder:text-sm md:placeholder:text-base focus:ring-2 focus:ring-[#74AA2E]"
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center text-[#6A6D76]"
            >
              {showConfirmPassword ? (
                <IoEyeOffOutline className="w-5 h-5 cursor-pointer" />
              ) : (
                <IoEyeOutline className="w-5 h-5 cursor-pointer" />
              )}
            </button>
          </div>
        </div>
        <div className="text-center pt-2">
          <button
            type="submit"
            disabled={isLoading}
            className="bg-blue-600 text-white font-semibold w-full py-3 rounded-md hover:opacity-95 transition disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? "Changing..." : "Save & Change"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default ChangePass;
