import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import JoditComponent from "../../components/JoditComponent";
import { IoChevronBack } from "react-icons/io5";
import { useCreateTermsAndConditionMutation, useGetTermsAndConditionQuery } from "../../redux/api/termsApi";
import { message } from "antd";

function TermsCondition() {
  const [content, setContent] = useState("");
  const navigate = useNavigate();

  const { data: termsData, isLoading: isFetching } = useGetTermsAndConditionQuery();
  const [createTerms, { isLoading }] = useCreateTermsAndConditionMutation();

  useEffect(() => {
    if (termsData?.data && termsData?.data?.length > 0) {
      setContent(termsData.data[0]?.description || "");
    }
  }, [termsData]);

  const handleSave = async () => {
    try {
      await createTerms({ description: content }).unwrap();
      message.success("Terms and Conditions saved successfully!");
    } catch (error) {
      message.error(
        error?.data?.message || "Failed to save terms and conditions"
      );
    }
  };

  return (
    <div className="px-5 md:px-0 py-5 md:py-10">
      <div className="bg-blue-600 px-5 py-3 rounded-md mb-3 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="text-white hover:opacity-90 transition"
          aria-label="Go back"
        >
          <IoChevronBack className="w-6 h-6" />
        </button>
        <h1 className="text-white text-2xl font-bold">Terms & Condition</h1>
      </div>

      <div className=" bg-white rounded shadow p-5 h-full">
        {isFetching ? (
          <div className="text-center py-10">Loading...</div>
        ) : (
          <JoditComponent content={content} setContent={setContent} />
        )}
      </div>
      <div className="text-center py-5">
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

export default TermsCondition;
