import {
  ConfigProvider,
  Modal,
  Table,
  Button,
  Form,
  Input,
  InputNumber,
  Select,
  message,
} from "antd";
import { useState } from "react";
import { IoChevronBack, IoEyeOutline, IoAddOutline } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import {
  useGetAllSubscriptionPlansQuery,
  useUpdateSubscriptionPlanMutation,
  useCancelSubscriptionMutation,
} from "../../redux/api/subscrition";
import { FiEdit2 } from "react-icons/fi";
import { RiDeleteBin6Line } from "react-icons/ri";

function SubscriptionPlans() {
  const navigate = useNavigate();
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [form] = Form.useForm();
  const [features, setFeatures] = useState([]);
  const [newFeature, setNewFeature] = useState("");

  // API calls
  const { data: plansData, isLoading } = useGetAllSubscriptionPlansQuery();
  const [updateSubscriptionPlan, { isLoading: isUpdating }] =
    useUpdateSubscriptionPlanMutation();
  const [deleteSubscriptionPlan, { isLoading: isDeleting }] =
    useCancelSubscriptionMutation();

  // Transform API data to table format
  const dataSource =
    plansData?.data?.map((plan) => ({
      key: plan.id,
      name: plan.name || "Unknown Plan",
      price: `${plan.price?.currency || "$"}${plan.price?.amount || 0}`,
      duration: `${plan.validity?.value || 0} ${
        plan.validity?.type || "months"
      }`,
      features: Array.isArray(plan.features)
        ? plan.features.join(", ")
        : plan.features || "No features specified",
      status: plan.isActive ? "Active" : "Inactive",
      users: plan.activeUserCount ?? 0, // dynamic active user count
      originalData: plan,
    })) || [];

  const showViewModal = (plan) => {
    setSelectedPlan(plan);
    setIsViewModalOpen(true);
  };

  const showEditModal = (plan) => {
    setSelectedPlan(plan);
    setFeatures(plan.originalData?.features || []);
    form.setFieldsValue({
      name: plan.originalData?.name || "",
      currency: plan.originalData?.price?.currency || "USD",
      amount: plan.originalData?.price?.amount || 0,
      validityType: plan.originalData?.validity?.type || "months",
      validityValue: plan.originalData?.validity?.value || 1,
    });
    setIsEditModalOpen(true);
  };

  const handleViewCancel = () => {
    setIsViewModalOpen(false);
    setSelectedPlan(null);
  };

  const handleEditCancel = () => {
    setIsEditModalOpen(false);
    setSelectedPlan(null);
    form.resetFields();
    setFeatures([]);
    setNewFeature("");
  };

  const handleEditSubmit = async (values) => {
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

      await updateSubscriptionPlan({
        id: selectedPlan.originalData.id,
        ...planData,
      }).unwrap();
      message.success("Plan updated successfully!");
      handleEditCancel();
    } catch (error) {
      message.error(error?.data?.message || "Failed to update plan");
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

  const handleDeletePlan = async (plan) => {
    setSelectedPlan(plan);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteSubscriptionPlan(selectedPlan.originalData.id).unwrap();
      message.success("Plan deleted successfully!");
      setIsDeleteModalOpen(false);
      setSelectedPlan(null);
    } catch (error) {
      // Handle specific database constraint errors
      if (error?.err?.code === "P2014") {
        message.error(
          "Cannot delete this plan because it's linked to active subscriptions. Please deactivate subscriptions first."
        );
      } else {
        message.error(error?.data?.message || "Failed to delete plan");
      }
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false);
    setSelectedPlan(null);
  };

  const columns = [
    {
      title: "No",
      key: "no",
      width: 70,
      render: (_, _r, index) => index + 1,
    },
    {
      title: "Plan Name",
      dataIndex: "name",
      key: "name",
      render: (value) => <span className="font-medium">{value}</span>,
    },
    {
      title: "Price",
      dataIndex: "price",
      key: "price",
    },
    {
      title: "Duration",
      dataIndex: "duration",
      key: "duration",
    },

    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <span
          className={`px-2 py-1 rounded-full text-xs ${
            status === "Active"
              ? "bg-green-100 text-green-800"
              : status === "Inactive"
              ? "bg-red-100 text-red-800"
              : "bg-gray-100 text-gray-800"
          }`}
        >
          {status}
        </span>
      ),
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <div className="flex gap-2">
          <button
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
            onClick={() => showViewModal(record)}
            title="View Plan Details"
          >
            <IoEyeOutline className="text-blue-600 w-5 h-5 cursor-pointer" />
          </button>
          <button
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
            onClick={() => showEditModal(record)}
            title="Edit Plan"
          >
            <FiEdit2 className="text-blue-600 w-5 h-5 cursor-pointer rounded-md" />
          </button>
          <button
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
            onClick={() => handleDeletePlan(record)}
            title="Delete Plan"
            disabled={isDeleting}
          >
            <RiDeleteBin6Line className="text-red-500 w-5 h-5 cursor-pointer rounded-md" />
          </button>
        </div>
      ),
    },
  ];

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
          Subscription Plans
        </h1>

        <button
          type="button"
          onClick={() => navigate("/add-subscription-plan")}
          className="ml-auto bg-white text-blue-600 px-3 py-1 rounded-md font-semibold flex items-center gap-2 hover:opacity-95 transition cursor-pointer"
        >
          <IoAddOutline className="w-4 h-4" />
          Add Subscription Plan
        </button>
      </div>

      <ConfigProvider
        theme={{
          components: {
            InputNumber: {
              activeBorderColor: "#00c0b5",
            },
            Pagination: {
              colorPrimaryBorder: "#111827",
              colorBorder: "#111827",
              colorPrimaryHover: "#111827",
              colorTextPlaceholder: "#111827",
              itemActiveBgDisabled: "#111827",
              colorPrimary: "#111827",
            },
            Table: {
              headerBg: "#f9fafb",
              headerColor: "#000000",
              cellFontSize: 14,
              headerSplitColor: "#f9fafb",
              colorTextHeading: "#000000",
            },
          },
        }}
      >
        <Table
          dataSource={dataSource}
          columns={columns}
          loading={isLoading}
          pagination={{ pageSize: 10 }}
          scroll={{ x: "max-content" }}
          rowClassName="hover:bg-gray-50 cursor-pointer"
        />

        {/* View Plan Details Modal */}
        <Modal
          open={isViewModalOpen}
          centered
          onCancel={handleViewCancel}
          footer={null}
          width={800}
        >
          {selectedPlan && (
            <div className="relative">
              {/* Header with blue gradient */}
              <div className="bg-blue-600 p-6 -m-6 mb-6 rounded-t-lg">
                <h2 className="text-3xl font-bold text-white mb-2">
                  {selectedPlan.name}
                </h2>
                <div className="flex items-center gap-3">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      selectedPlan.status === "Active"
                        ? "bg-green-100 text-green-800"
                        : selectedPlan.status === "Inactive"
                        ? "bg-red-100 text-red-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {selectedPlan.status}
                  </span>
                  <span className="text-white/90">
                    {selectedPlan.users} users
                  </span>
                </div>
              </div>

              {/* Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm">
                  <div className="text-gray-500 text-sm">Plan Name</div>
                  <div className="text-lg font-semibold">
                    {selectedPlan.name}
                  </div>
                </div>
                <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm">
                  <div className="text-gray-500 text-sm">Price</div>
                  <div className="text-lg font-semibold">
                    {selectedPlan.price}
                  </div>
                </div>
                <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm">
                  <div className="text-gray-500 text-sm">Duration</div>
                  <div className="text-lg font-semibold">
                    {selectedPlan.duration}
                  </div>
                </div>
                <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm">
                  <div className="text-gray-500 text-sm">Active Users</div>
                  <div className="text-lg font-semibold">
                    {selectedPlan.users} users
                  </div>
                </div>
                <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm md:col-span-2">
                  <div className="text-gray-500 text-sm">Features</div>
                  <div className="text-lg font-semibold">
                    {selectedPlan.features}
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex justify-end items-center mt-8 pt-6 border-t border-gray-200 gap-3">
                <button
                  onClick={handleViewCancel}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </Modal>

        {/* Edit Plan Modal */}
        <Modal
          open={isEditModalOpen}
          centered
          onCancel={handleEditCancel}
          footer={null}
          width={600}
        >
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-6">Edit Subscription Plan</h2>

            <Form form={form} layout="vertical" onFinish={handleEditSubmit}>
              <Form.Item
                label="Plan Name"
                name="name"
                rules={[{ required: true, message: "Please enter plan name" }]}
              >
                <Input placeholder="Enter plan name" />
              </Form.Item>

              <div className="grid grid-cols-2 gap-4">
                <Form.Item
                  label="Currency"
                  name="currency"
                  rules={[
                    { required: true, message: "Please select currency" },
                  ]}
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

              <div className="grid grid-cols-2 gap-4">
                <Form.Item
                  label="Validity Type"
                  name="validityType"
                  rules={[
                    { required: true, message: "Please select validity type" },
                  ]}
                >
                  <Select>
                    <Select.Option value="days">Days</Select.Option>
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
                <Button onClick={handleEditCancel}>Cancel</Button>
                <Button type="primary" htmlType="submit" loading={isUpdating}>
                  Update Plan
                </Button>
              </div>
            </Form>
          </div>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          open={isDeleteModalOpen}
          centered
          onCancel={handleDeleteCancel}
          footer={null}
          width={400}
        >
          <div className="p-6 text-center">
            <div className="mb-4">
              <RiDeleteBin6Line className="text-red-500 text-5xl mx-auto" />
            </div>
            <h2 className="text-xl font-bold mb-2">Delete Subscription Plan</h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete the plan &quot;
              {selectedPlan?.name}&quot;? This action cannot be undone.
            </p>
            <div className="flex justify-center gap-3">
              <Button onClick={handleDeleteCancel}>Cancel</Button>
              <Button
                type="primary"
                danger
                onClick={handleDeleteConfirm}
                loading={isDeleting}
              >
                Delete Plan
              </Button>
            </div>
          </div>
        </Modal>
      </ConfigProvider>
    </div>
  );
}

export default SubscriptionPlans;
