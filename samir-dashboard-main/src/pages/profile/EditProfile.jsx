import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { useUpdateUserMutation } from "../../redux/api/authApi";
import { message } from "antd";
import { getUser } from "../../redux/features/auth/authSlice";
import { useGetMyProfileQuery } from "../../redux/api/authApi";
import { useSelector } from "react-redux";

function EditProfile() {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const [updateUser, { isLoading }] = useUpdateUserMutation();
  const { data: profileResponse } = useGetMyProfileQuery();

  const profileData = profileResponse?.data || user;

  const [formData, setFormData] = useState({
    fullName: profileData?.fullName || "",
    contactNo: profileData?.contactNumber || "",
    country: profileData?.country || "",
    address: profileData?.address || "",
  });

  useEffect(() => {
    if (profileData) {
      setFormData({
        fullName: profileData.fullName || "",
        contactNo: profileData.contactNumber || "",
        country: profileData.country || "",
        address: profileData.address || "",
      });
    }
  }, [profileData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formDataToSend = new FormData();
    formDataToSend.append("fullName", formData.fullName);
    formDataToSend.append("contactNumber", formData.contactNo);
    formDataToSend.append("country", formData.country);
    formDataToSend.append("address", formData.address);

    try {
      const response = await updateUser(formDataToSend).unwrap();
      dispatch(getUser(response.data));
      message.success("Profile updated successfully!");

      // Update localStorage user data
      const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
      const updatedUser = { ...currentUser, ...response.data };
      localStorage.setItem("user", JSON.stringify(updatedUser));


    } catch (error) {
      message.error(error?.data?.message || "Failed to update profile");
    }
  };

  return (
    <div className="w-full flex justify-center items-center p-4">
      <div className="bg-white w-full max-w-xl px-4 sm:px-6 md:px-8 py-5 rounded-md border border-gray-200 shadow-sm">
        <p className="text-[#111827] text-center font-bold text-xl sm:text-2xl mb-5">
          Edit Your Profile
        </p>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="text-sm md:text-base text-[#111827] mb-2 font-semibold block">
              User Name
            </label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-md outline-none placeholder:text-sm md:placeholder:text-base focus:ring-2 focus:ring-[#74AA2E]"
              placeholder="Enter full name"
              required
            />
          </div>

          <div>
            <label className="text-sm md:text-base text-[#111827] mb-2 font-semibold block">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={profileData?.email || ""}
              disabled
              className="w-full px-4 py-3 border border-gray-300 rounded-md outline-none placeholder:text-sm md:placeholder:text-base focus:ring-2 focus:ring-[#74AA2E] bg-gray-100 cursor-not-allowed"
              placeholder="Enter email"
            />
          </div>

          <div>
            <label className="text-sm md:text-base text-[#111827] mb-2 font-semibold block">
              Address
            </label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-md outline-none placeholder:text-sm md:placeholder:text-base focus:ring-2 focus:ring-[#74AA2E]"
              placeholder="Enter address"
            />
          </div>
          <div>
            <label className="text-sm md:text-base text-[#0D0D0D] mb-2 font-semibold block">
              Contact Number
            </label>
            <input
              type="text"
              name="contactNo"
              value={formData.contactNo}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-md outline-none placeholder:text-sm md:placeholder:text-base focus:ring-2 focus:ring-[#74AA2E]"
              placeholder="Enter contact number"
              required
            />
          </div>

          <div>
            <label className="text-sm md:text-base text-[#111827] mb-2 font-semibold block">
              Country
            </label>
            <input
              type="text"
              name="country"
              value={formData.country}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-md outline-none placeholder:text-sm md:placeholder:text-base focus:ring-2 focus:ring-[#74AA2E]"
              placeholder="Enter country"
              required
            />
          </div>
          <div className="text-center pt-2">
            <button 
              type="submit"
              disabled={isLoading}
              className="bg-blue-600 text-white font-semibold w-full py-3 rounded-lg hover:opacity-95 transition disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? "Saving..." : "Save & Change"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditProfile;
