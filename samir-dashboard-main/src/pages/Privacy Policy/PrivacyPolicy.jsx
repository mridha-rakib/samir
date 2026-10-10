import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import JoditComponent from "../../components/JoditComponent";
import { IoChevronBack } from "react-icons/io5";
import { useCreatePolicyMutation, useGetPolicyQuery } from "../../redux/api/policy";
import { message } from "antd";

export default function PrivacyPolicy() {
  const [content, setContent] = useState("");
  const navigate = useNavigate();

  const { data: policyData, isLoading: isFetching } = useGetPolicyQuery();
  const [createPolicy, { isLoading }] = useCreatePolicyMutation();

  useEffect(() => {
    if (policyData?.data && policyData?.data?.length > 0) {
      setContent(policyData.data[0]?.description || "");
    }
  }, [policyData]);

  const handleSave = async () => {
    try {
      await createPolicy({ description: content }).unwrap();
      message.success("Privacy Policy saved successfully!");
    } catch (error) {
      message.error(error?.data?.message || "Failed to save privacy policy");
    }
  };
  return (
    <div className="p-5">
      <div className="bg-blue-600 px-5 py-3 rounded-md mb-3 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="text-white hover:opacity-90 transition"
          aria-label="Go back"
        >
          <IoChevronBack className="w-6 h-6" />
        </button>
        <h1 className="text-white text-2xl font-bold">Privacy Policy</h1>
      </div>

      <div className=" bg-white rounded shadow p-5 h-full">
        {isFetching ? (
          <div className="text-center py-10">Loading...</div>
        ) : (
          <JoditComponent content={content} setContent={setContent} />
        )}
      </div>
      <div className="text-center py-5 w-full">
        <button
          onClick={handleSave}
          disabled={isLoading}
          className="bg-blue-600 text-white font-semibold w-full py-2 rounded transition duration-200 disabled:opacity-50 cursor-pointer"
        >
          {isLoading ? "Saving..." : "Save changes"}
        </button>
      </div>
    </div>
  );
}
