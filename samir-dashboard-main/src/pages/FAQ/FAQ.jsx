import { useState, useEffect } from "react";
import {
  useGetAllFaqsQuery,
  useCreateFaqMutation,
  useUpdateFaqMutation,
  useDeleteFaqMutation,
} from "../../redux/api/faqApi";
import { Spin, message, Modal, Form, Input, Button } from "antd";

export default function FAQ() {
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState(null);
  const [deletingFaqId, setDeletingFaqId] = useState(null);
  const [form] = Form.useForm();

  const { data: faqData, isLoading, error } = useGetAllFaqsQuery();
  const [createFaq, { isLoading: isCreating }] = useCreateFaqMutation();
  const [updateFaq, { isLoading: isUpdating }] = useUpdateFaqMutation();
  const [deleteFaq] = useDeleteFaqMutation();

  const toggleFaq = (index) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  const handleCreateFaq = async (values) => {
    try {
      await createFaq(values).unwrap();
      message.success("FAQ created successfully");
      setIsCreateModalOpen(false);
      form.resetFields();
    } catch {
      message.error("Failed to create FAQ");
    }
  };

  const handleUpdateFaq = async (values) => {
    try {
      if (!editingFaq || !editingFaq._id) {
        message.error("Cannot update FAQ: Missing ID");
        return;
      }
      console.log("Updating FAQ with ID:", editingFaq._id);
      await updateFaq({ id: editingFaq._id, ...values }).unwrap();
      message.success("FAQ updated successfully");
      setIsEditModalOpen(false);
      setEditingFaq(null);
      form.resetFields();
    } catch (error) {
      console.error("Update FAQ error:", error);
      message.error("Failed to update FAQ");
    }
  };

  const handleDeleteFaq = async (faq) => {
    const faqId = faq._id || faq.id;

    if (!faqId) {
      message.error("Cannot delete FAQ: Missing ID");
      return;
    }

    Modal.confirm({
      title: "Are you sure you want to delete this FAQ?",
      content: `Question: ${faq.question}`,
      okText: "Delete",
      okType: "danger",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          setDeletingFaqId(faqId);
          await deleteFaq(faqId).unwrap();
          message.success("FAQ deleted successfully");
        } catch (error) {
          console.error("Delete FAQ error:", error);
          message.error("Failed to delete FAQ");
        } finally {
          setDeletingFaqId(null);
        }
      },
    });
  };

  const openEditModal = (faq) => {
    console.log("Opening edit modal for FAQ:", faq);
    console.log("FAQ ID fields:", {
      _id: faq._id,
      id: faq.id,
      // Check for any other possible ID fields
      ...Object.keys(faq)
        .filter((key) => key.toLowerCase().includes("id"))
        .reduce((obj, key) => {
          obj[key] = faq[key];
          return obj;
        }, {}),
    });

    // Try to find the ID field
    const faqId = faq._id || faq.id;

    if (!faqId) {
      message.error("Cannot edit FAQ: No valid ID found");
      return;
    }

    setEditingFaq({ ...faq, _id: faqId }); // Ensure we have _id for consistency
    form.setFieldsValue({
      question: faq.question,
      answer: faq.answer,
    });
    setIsEditModalOpen(true);
  };

  useEffect(() => {
    if (error) {
      message.error("Failed to load FAQs");
    }
  }, [error]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" />
      </div>
    );
  }

  const faqs = faqData?.data || [];

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Frequently Asked Questions
            </h1>
            <p className="text-gray-600 text-lg">
              Find answers to common questions about our platform
            </p>
          </div>
          <Button
            type="primary"
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-blue-500 hover:bg-blue-600"
          >
            Add New FAQ
          </Button>
        </div>

        {/* FAQ Cards */}
        <div className="space-y-4">
          {faqs.length > 0 ? (
            faqs.map((faq, index) => {
              const faqId = faq._id || faq.id;
              return (
                <div
                  key={faqId || index}
                  className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden"
                >
                  <button
                    onClick={() => toggleFaq(index)}
                    className="w-full text-left px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors focus:outline-none focus:bg-gray-50"
                  >
                    <span className="text-gray-800 font-medium text-base">
                      {faq.question}
                    </span>
                    <div className="flex items-center space-x-2">
                      {faqId && (
                        <>
                          <Button
                            size="small"
                            type="text"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditModal(faq);
                            }}
                            className="text-blue-500 hover:text-blue-600"
                          >
                            Edit
                          </Button>
                          <Button
                            size="small"
                            type="text"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteFaq(faq);
                            }}
                            className="text-red-500 hover:text-red-600"
                            loading={deletingFaqId === faqId}
                          >
                            Delete
                          </Button>
                        </>
                      )}
                      <svg
                        className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${
                          expandedFaq === index ? "rotate-180" : ""
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </div>
                  </button>

                  {expandedFaq === index && (
                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                      <p className="text-gray-600 text-sm leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No FAQs available at the moment.</p>
            </div>
          )}
        </div>

        {/* Create FAQ Modal */}
        <Modal
          title="Create New FAQ"
          open={isCreateModalOpen}
          onCancel={() => {
            setIsCreateModalOpen(false);
            form.resetFields();
          }}
          footer={null}
        >
          <Form form={form} layout="vertical" onFinish={handleCreateFaq}>
            <Form.Item
              name="question"
              label="Question"
              rules={[{ required: true, message: "Please enter a question" }]}
            >
              <Input.TextArea rows={2} placeholder="Enter your question" />
            </Form.Item>
            <Form.Item
              name="answer"
              label="Answer"
              rules={[{ required: true, message: "Please enter an answer" }]}
            >
              <Input.TextArea rows={4} placeholder="Enter your answer" />
            </Form.Item>
            <Form.Item className="mb-0">
              <div className="flex justify-end space-x-2">
                <Button
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    form.resetFields();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={isCreating}
                  className="bg-blue-500 hover:bg-blue-600"
                >
                  Create FAQ
                </Button>
              </div>
            </Form.Item>
          </Form>
        </Modal>

        {/* Edit FAQ Modal */}
        <Modal
          title="Edit FAQ"
          open={isEditModalOpen}
          onCancel={() => {
            setIsEditModalOpen(false);
            setEditingFaq(null);
            form.resetFields();
          }}
          footer={null}
        >
          <Form form={form} layout="vertical" onFinish={handleUpdateFaq}>
            <Form.Item
              name="question"
              label="Question"
              rules={[{ required: true, message: "Please enter a question" }]}
            >
              <Input.TextArea rows={2} placeholder="Enter your question" />
            </Form.Item>
            <Form.Item
              name="answer"
              label="Answer"
              rules={[{ required: true, message: "Please enter an answer" }]}
            >
              <Input.TextArea rows={4} placeholder="Enter your answer" />
            </Form.Item>
            <Form.Item className="mb-0">
              <div className="flex justify-end space-x-2">
                <Button
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditingFaq(null);
                    form.resetFields();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={isUpdating}
                  className="bg-blue-500 hover:bg-blue-600"
                >
                  Update FAQ
                </Button>
              </div>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </div>
  );
}
