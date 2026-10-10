import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaCamera } from "react-icons/fa";
import EditProfile from "./EditProfile";
import ChangePass from "./ChangePass";
import { IoChevronBack } from "react-icons/io5";
import { useDispatch, useSelector } from "react-redux";
import {
  useGetMyProfileQuery,
  useUpdateUserMutation,
} from "../../redux/api/authApi";
import { message } from "antd";
import { getUser } from "../../redux/features/auth/authSlice";

function ProfilePage() {
  const { user } = useSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState("editProfile");
  const [profileImagePreview, setProfileImagePreview] = useState(null);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [updateUser, { isLoading }] = useUpdateUserMutation();
  const { data: profileData, refetch } = useGetMyProfileQuery();

  useEffect(() => {
    if (profileData?.data?.profileImage) {
      setProfileImagePreview(profileData.data.profileImage);
    } else if (user?.profileImage) {
      setProfileImagePreview(user.profileImage);
    }
  }, [profileData?.data?.profileImage, user?.profileImage]);

  const handleProfileImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Show immediate preview
      setProfileImagePreview(URL.createObjectURL(file));
      handleProfileImageUpload(file);
    }
  };

  const handleProfileImageUpload = async (file) => {
    if (!file) return;

    const formData = new FormData();
    formData.append("profileImage", file);

    try {
      const response = await updateUser(formData).unwrap();
      dispatch(getUser(response.data));
      message.success("Profile image updated successfully!");

      // Update localStorage user data
      const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
      const updatedUser = { ...currentUser, ...response.data };
      localStorage.setItem("user", JSON.stringify(updatedUser));

      // Update preview with new image from response
      if (response.data.profileImage) {
        setProfileImagePreview(response.data.profileImage);
        refetch();
      }
    } catch (error) {
      message.error(error?.data?.message || "Failed to update profile image");
    }
  };

  return (
    <div className="overflow-y-auto">
      <div className="px-5 pb-5 h-full">
        <div className="bg-blue-600 px-4 md:px-5 py-3 rounded-md mb-3 flex flex-wrap md:flex-nowrap items-start md:items-center gap-2 md:gap-3">
          <button
            onClick={() => navigate(-1)}
            className="text-white hover:opacity-90 transition"
            aria-label="Go back"
          >
            <IoChevronBack className="w-6 h-6" />
          </button>
          <h1 className="text-white text-xl sm:text-2xl font-bold">Profile</h1>
        </div>
        <div className="mx-auto flex flex-col justify-center items-center">
          {/* Profile Picture Section */}
          <div className="flex flex-col md:flex-row justify-center items-center bg-blue-600 mt-5 text-white w-full max-w-3xl mx-auto p-4 md:p-5 gap-4 md:gap-5 rounded-lg">
            <div className="relative">
              <div className="w-[122px] h-[122px] bg-blue-600 rounded-full border-4 border-white shadow-xl flex justify-center items-center">
                <img
                  src={
                    profileImagePreview ||
                    "https://avatar.iran.liara.run/public/44"
                  }
                  alt="profile"
                  className="h-30 w-32 rounded-full"
                />
                {/* Upload Icon */}
                <div className="absolute bottom-2 right-2 bg-white p-2 rounded-full shadow-md cursor-pointer">
                  <label htmlFor="profilePicUpload" className="cursor-pointer">
                    {isLoading ? (
                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <FaCamera className="text-[#575757]" />
                    )}
                  </label>
                  <input
                    type="file"
                    id="profilePicUpload"
                    className="hidden"
                    onChange={handleProfileImageChange}
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>
            <div className="text-center md:text-left">
              <p className="text-lg sm:text-xl md:text-3xl font-bold">
                {user?.fullName || "Shah Aman"}
              </p>
              <p className="text-base sm:text-lg font-semibold">Admin</p>
            </div>
          </div>

          {/* Tab Navigation Section */}
          <div className="flex flex-wrap justify-center items-center gap-3 md:gap-5 text-sm sm:text-base md:text-xl font-semibold my-4 md:my-5">
            <p
              onClick={() => setActiveTab("editProfile")}
              className={`cursor-pointer px-3 py-1 rounded-md pb-1 ${
                activeTab === "editProfile"
                  ? "text-[#111827] border-b-2 border-[#111827]"
                  : "text-[#6A6D76]"
              }`}
            >
              Edit Profile
            </p>
            <p
              onClick={() => setActiveTab("changePassword")}
              className={`cursor-pointer px-3 py-1 rounded-md pb-1 ${
                activeTab === "changePassword"
                  ? "text-[#111827] border-b-2 border-[#111827]"
                  : "text-[#6A6D76]"
              }`}
            >
              Change Password
            </p>
          </div>

          {/* Tab Content Section */}
          <div className="flex justify-center items-center p-4 md:p-5 rounded-md w-full">
            <div className="w-full max-w-3xl">
              {activeTab === "editProfile" && <EditProfile />}
              {activeTab === "changePassword" && <ChangePass />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
