/* eslint-disable react/prop-types */
import { ConfigProvider, Table } from "antd";

const RecentUsers = ({ recentUsers }) => {
  const dataSource = recentUsers.map((user, index) => ({
    key: user.id || index,
    fullName: user.fullName,
    email: user.email,
    profileImage: user.profileImage,
    joined: new Date(user.createdAt).toLocaleDateString(),
    status: user.status,
  }));

  const columns = [
    {
      title: "No",
      key: "no",
      width: 70,
      render: (_, _r, index) => index + 1,
    },
    {
      title: "Full Name",
      dataIndex: "fullName",
      key: "fullName",
      render: (value, record) => (
        <div className="flex items-center gap-3">
          <img
            src={
              record.profileImage ||
              `https://avatar.iran.liara.run/public/${record.key}`
            }
            className="w-10 h-10 object-cover rounded-full"
            alt="User Avatar"
            onError={(e) => {
              e.target.src = `https://avatar.iran.liara.run/public/${record.key}`;
            }}
          />
          <span className="leading-none">{value}</span>
        </div>
      ),
    },
    // { title: "Role", dataIndex: "role", key: "role" },
    // { title: "Clinic", dataIndex: "clinic", key: "clinic" },
    { title: "Email", dataIndex: "email", key: "email" },
    { title: "Status", dataIndex: "status", key: "status" },
    { title: "Joined Date", dataIndex: "joined", key: "joined" },
  ];

  return (
    <>
      <ConfigProvider
        theme={{
          components: {
            InputNumber: {
              activeBorderColor: "blue-600",
            },

            Table: {
              headerBg: "blue-600",
              headerColor: "blue-600",
              cellFontSize: 16,
              headerSplitColor: "blue-600",
            },
          },
        }}
      >
        <Table
          dataSource={dataSource}
          columns={columns}
          pagination={false}
          scroll={{ x: "max-content" }}
        />
      </ConfigProvider>
    </>
  );
};

export default RecentUsers;
