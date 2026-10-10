/* eslint-disable react/prop-types */
import { Link, useLocation, useNavigate } from "react-router-dom";
import { RxDashboard } from "react-icons/rx";
import { LuUsers } from "react-icons/lu";
import { TbReport } from "react-icons/tb";
import { IoMdSettings } from "react-icons/io";
import { IoCloseSharp, IoLogOutOutline } from "react-icons/io5";
import { MdAdminPanelSettings } from "react-icons/md";
import { BiChat } from "react-icons/bi";

import { BsCurrencyDollar, BsCreditCard, BsCheckCircle } from "react-icons/bs";
import { FaQuestion } from "react-icons/fa";
import { logout } from "../../redux/features/auth/authSlice";
import { useLogoutMutation } from "../../redux/api/authApi";
import { message } from "antd";
import { useDispatch, useSelector } from "react-redux";

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { token } = useSelector((state) => state.auth);
  const [logoutApi, { isLoading }] = useLogoutMutation();

  let userRole = null;
  if (token) {
    try {
      const payload = token.split(".")[1];
      if (payload) {
        const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
        const decodedPayload = JSON.parse(atob(base64));
        userRole = decodedPayload.role;
      }
    } catch (error) {
      console.error("Error decoding token in Sidebar:", error);
    }
  }
  const currentPath = location.pathname;
  const isActive = (path) => currentPath === path;

  const handleLogout = async () => {
    try {
      await logoutApi().unwrap();
      dispatch(logout());
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
      navigate("/");
      message.success("Logged out successfully!");
    } catch {
      // Even if API fails, clear local data and logout
      dispatch(logout());
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
      navigate("/");
      message.success("Logged out successfully!");
    }
  };

  // Close sidebar when a link is clicked on mobile
  const handleLinkClick = () => {
    if (window.innerWidth < 1024) {
      toggleSidebar();
    }
  };

  return (
    <>
      {/* Overlay for mobile when sidebar is open */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <div
        className={`bg-[#fff] text-blue-600 border border-[#E5E7EB] h-screen overflow-y-auto py-5 md:py-0 z-50 transition-transform shadow-lg
          w-[80%] sm:w-[70%] md:w-[60%] lg:w-70 xl:w-72
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          fixed top-0 left-0 bottom-0
          lg:static lg:translate-x-0
        `}
      >
        {/* Close Button (Mobile Only) */}
        <button
          onClick={toggleSidebar}
          className="absolute top-4 right-4 lg:hidden text-white bg-blue-600 focus:outline-none p-2 rounded-full"
        >
          <IoCloseSharp />
        </button>

        {/* Logo */}
        <div className="flex justify-center items-center gap-2 px-5 mt-8">
          <img
            src="/logo.png"
            className="w-[120px] h-[100px]"
            alt="User Avatar"
          />
        </div>

        {/* Sidebar Menu */}
        <ul className="mt-10 px-5 text-[10px]">
          {/* Dashboard Page */}
          <Link to="/" onClick={handleLinkClick}>
            <li
              className={`flex items-center gap-2 cursor-pointer transition-all duration-300 ease-in-out ${
                isActive("/")
                  ? "bg-blue-600 text-white px-3 py-3 rounded-lg"
                  : "hover:bg-gray-100 px-3 py-3 rounded-lg"
              }`}
            >
              <RxDashboard className="w-5 h-5" />
              <p className="text-lg font-semibold">Dashboard</p>
            </li>
          </Link>

          {/* User Management */}
          <Link to="/user-details" onClick={handleLinkClick}>
            <li
              className={`flex items-center gap-2 mt-2 cursor-pointer transition-all duration-300 ease-in-out ${
                isActive("/user-details")
                  ? "bg-blue-600 text-white px-3 py-3 rounded-lg"
                  : "hover:bg-gray-100 px-3 py-3 rounded-lg"
              }`}
            >
              <LuUsers className="w-5 h-5" />
              <p className="text-lg font-semibold">All Users</p>
            </li>
          </Link>

          {/* provider verify request */}
          <Link to="/verify-request" onClick={handleLinkClick}>
            <li
              className={`flex items-center gap-2 mt-2 cursor-pointer transition-all duration-300 ease-in-out ${
                isActive("/verify-request")
                  ? "bg-blue-600 text-white px-3 py-3 rounded-lg"
                  : "hover:bg-gray-100 px-3 py-3 rounded-lg"
              }`}
            >
              <BsCheckCircle className="w-5 h-5" />
              <p className="text-lg font-semibold">Verify Request</p>
            </li>
          </Link>

          {/* Earnings */}
          <Link to="/earnings" onClick={handleLinkClick}>
            <li
              className={`flex items-center gap-2 mt-2 cursor-pointer transition-all duration-300 ease-in-out ${
                isActive("/earnings")
                  ? "bg-blue-600 text-white px-3 py-3 rounded-lg"
                  : "hover:bg-gray-100 px-3 py-3 rounded-lg"
              }`}
            >
              <BsCurrencyDollar className="w-5 h-5" />
              <p className="text-lg font-semibold">Earnings</p>
            </li>
          </Link>

          {/* Subscriptions */}
          <Link to="/subscriptions" onClick={handleLinkClick}>
            <li
              className={`flex items-center gap-2 mt-2 cursor-pointer transition-all duration-300 ease-in-out ${
                isActive("/subscriptions")
                  ? "bg-blue-600 text-white px-3 py-3 rounded-lg"
                  : "hover:bg-gray-100 px-3 py-3 rounded-lg"
              }`}
            >
              <BsCreditCard className="w-5 h-5" />
              <p className="text-lg font-semibold">Subscribers</p>
            </li>
          </Link>

          {/* Subscription Plans */}
          <Link to="/subscription-plans" onClick={handleLinkClick}>
            <li
              className={`flex items-center gap-2 mt-2 cursor-pointer transition-all duration-300 ease-in-out ${
                isActive("/subscription-plans")
                  ? "bg-blue-600 text-white px-3 py-3 rounded-lg"
                  : "hover:bg-gray-100 px-3 py-3 rounded-lg"
              }`}
            >
              <BsCreditCard className="w-5 h-5" />
              <p className="text-lg font-semibold">Subscription Plans</p>
            </li>
          </Link>

          {/* chats */}
          {/* <Link to="/chat" onClick={handleLinkClick}>
            <li
              className={`flex items-center gap-2 mt-2 cursor-pointer transition-all duration-300 ease-in-out ${
                isActive("/chat")
                  ? "bg-blue-600 text-white px-3 py-3 rounded-lg"
                  : "hover:bg-gray-100 px-3 py-3 rounded-lg"
              }`}
            >
              <BiChat className="w-5 h-5" />
              <p className="text-lg font-semibold">Chat</p>
            </li>
          </Link> */}

          {/* FAQ */}
          <Link to="/faq" onClick={handleLinkClick}>
            <li
              className={`flex items-center gap-2 mt-2 cursor-pointer transition-all duration-300 ease-in-out ${
                isActive("/faq")
                  ? "bg-blue-600 text-white px-3 py-3 rounded-lg"
                  : "hover:bg-gray-100 px-3 py-3 rounded-lg"
              }`}
            >
              <FaQuestion className="w-5 h-5" />
              <p className="text-lg font-semibold">FAQ</p>
            </li>
          </Link>

          {/* Create Admin */}
          {userRole === "SUPER_ADMIN" && (
            <Link to="/create-admin" onClick={handleLinkClick}>
              <li
                className={`flex items-center gap-2 mt-2 cursor-pointer transition-all duration-300 ease-in-out ${
                  isActive("/create-admin")
                    ? "bg-blue-600 text-white px-3 py-3 rounded-lg"
                    : "hover:bg-gray-100 px-3 py-3 rounded-lg"
                }`}
              >
                <MdAdminPanelSettings className="w-5 h-5" />
                <p className="text-lg font-semibold">Create Admin</p>
              </li>
            </Link>
          )}

          {/* reports */}
          <Link to="/reports">
            <li
              className={`flex items-center gap-2 mt-2 cursor-pointer transition-all duration-300 ease-in-out ${
                isActive("/reports")
                  ? "bg-blue-600 text-white px-3 py-3 rounded-lg"
                  : "hover:bg-gray-100 px-3 py-3 rounded-lg"
              }`}
            >
              <TbReport className="w-5 h-5" />
              <p className="text-lg font-semibold">Reports</p>
            </li>
          </Link>

          {/* settings */}
          <Link to="/settings">
            <li
              className={`flex items-center gap-2 mt-2 cursor-pointer transition-all duration-300 ease-in-out ${
                isActive("/settings")
                  ? "bg-blue-600 text-white px-3 py-3 rounded-lg"
                  : "hover:bg-gray-100 px-3 py-3 rounded-lg"
              }`}
            >
              <IoMdSettings className="w-5 h-5 text-lg font-semibold" />
              <p className="text-lg font-semibold">Settings</p>
            </li>
          </Link>
        </ul>

        {/* Logout Button */}
        <div className="mt-6 w-full px-5">
          <Link to="/sign-in">
            <button
              onClick={handleLogout}
              disabled={isLoading}
              className="flex items-center gap-4 w-full py-3 rounded-lg bg-blue-600 px-3 duration-200 text-white justify-center cursor-pointer disabled:opacity-50"
            >
              <IoLogOutOutline className="w-5 h-5 font-bold" />
              <span>Logout</span>
            </button>
          </Link>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
