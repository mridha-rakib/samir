import { Form, Input, InputNumber, Select, Button, message } from "antd";
import { useState } from "react";
import { IoChevronBack } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import { useCreateSubscriptionPlanMutation } from "../../redux/api/subscrition";

function AddSubscriptionPlan() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [features, setFeatures] = useState([]);
  const [newFeature, setNewFeature] = useState("");
  const [createSubscriptionPlan, { isLoading }] =
    useCreateSubscriptionPlanMutation();

  const handleSubmit = async (values) => {
    try {
      const planData = {
        name: values.name,
        price: {
          currency: values.currency,
          amount: values.amount,
        },
        validity: {
          type: values.validityType,
          value: values.validityValue,
        },
        features: features,
      };

      await createSubscriptionPlan(planData).unwrap();
      message.success("Plan created successfully!");
      navigate("/subscription-plans");
    } catch (error) {
      message.error(error?.data?.message || "Failed to create plan");
    }
  };

  const addFeature = () => {
    if (newFeature.trim() && !features.includes(newFeature.trim())) {
      setFeatures([...features, newFeature.trim()]);
      setNewFeature("");
    }
  };

  const removeFeature = (indexToRemove) => {
    setFeatures(features.filter((_, index) => index !== indexToRemove));
  };

  return (
    <div>
      <div className="bg-blue-600 px-4 md:px-5 py-3 rounded-md mb-3 flex flex-wrap md:flex-nowrap items-start md:items-center gap-2 md:gap-3">
        <button
          onClick={() => navigate(-1)}
          className="text-white hover:opacity-90 transition"
          aria-label="Go back"
        >
          <IoChevronBack className="w-6 h-6" />
        </button>
        <h1 className="text-white text-xl sm:text-2xl font-bold">
          Add Subscription Plan
        </h1>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          className="max-w-2xl"
        >
          <Form.Item
            label="Plan Name"
            name="name"
            rules={[{ required: true, message: "Please enter plan name" }]}
          >
            <Input placeholder="Enter plan name" />
          </Form.Item>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Form.Item
              label="Currency"
              name="currency"
              rules={[{ required: true, message: "Please select currency" }]}
            >
              <Select>
                <Select.Option value="USD">USD</Select.Option>
                <Select.Option value="EUR">EUR</Select.Option>
                <Select.Option value="GBP">GBP</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item
              label="Amount"
              name="amount"
              rules={[{ required: true, message: "Please enter amount" }]}
            >
              <InputNumber min={0} placeholder="0" className="w-full" />
            </Form.Item>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Form.Item
              label="Validity Type"
              name="validityType"
              rules={[
                { required: true, message: "Please select validity type" },
              ]}
            >
              <Select>
                <Select.Option value="months">Months</Select.Option>
                <Select.Option value="years">Years</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item
              label="Validity Value"
              name="validityValue"
              rules={[
                { required: true, message: "Please enter validity value" },
              ]}
            >
              <InputNumber min={1} placeholder="1" className="w-full" />
            </Form.Item>
          </div>

          <Form.Item label="Features">
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  placeholder="Add a feature"
                  value={newFeature}
                  onChange={(e) => setNewFeature(e.target.value)}
                  onPressEnter={addFeature}
                />
                <Button onClick={addFeature}>Add</Button>
              </div>

              <div className="space-y-1">
                {features.map((feature, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-gray-50 p-2 rounded"
                  >
                    <span>{feature}</span>
                    <Button
                      type="text"
                      size="small"
                      onClick={() => removeFeature(index)}
                      danger
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </Form.Item>

          <div className="flex justify-end gap-3 mt-6">
            <Button onClick={() => navigate("/subscription-plans")}>
              Cancel
            </Button>
            <Button type="primary" htmlType="submit" loading={isLoading}>
              Create Plan
            </Button>
          </div>
        </Form>
      </div>
    </div>
  );
}

export default AddSubscriptionPlan;
