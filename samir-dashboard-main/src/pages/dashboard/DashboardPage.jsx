import { FaChevronDown } from "react-icons/fa";
import { useState } from "react";
import dayjs from "dayjs";
import RecentUsers from "./RecentUsers";
import TotalView from "./TotalView";
import { useDashboardOverviewQuery } from "../../redux/api/dashboard_tab";

function DashboardPage() {
  const currentYear = dayjs().year();
  const startYear = 2020;
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [isOpen, setIsOpen] = useState(false);

  const { data: dashboardData } = useDashboardOverviewQuery(selectedYear);

  const years = Array.from(
    { length: currentYear - startYear + 1 },
    (_, index) => startYear + index
  );

  const handleSelect = (year) => {
    setSelectedYear(year);
    setIsOpen(false);
  };

  return (
    <div className="flex flex-col space-y-5 p-4 md:p-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {[
          {
            value: dashboardData?.data?.totalUsers || "0",
            label: "Total Users",
          },
          {
            value: dashboardData?.data?.totalGuests || "0",
            label: "Total Guests",
          },
          {
            value: dashboardData?.data?.totalServiceProviders || "0",
            label: "Service Providers",
          },
          {
            value: dashboardData?.data?.totalPropertyOwners || "0",
            label: "Property Owners",
          },
          {
            value: dashboardData?.data?.totalHosts || "0",
            label: "Total Property",
          },
          {
            value: dashboardData?.data?.totalHotelBookings || "0",
            label: "Hotel Bookings",
          },
          {
            value: dashboardData?.data?.totalServiceBookings || "0",
            label: "Service Bookings",
          },
          {
            value: dashboardData?.data?.totalBookings || "0",
            label: "Total Bookings",
          },
          {
            value: `$${(
              dashboardData?.data?.adminEarnings || 0
            ).toLocaleString()}`,
            label: "Total Revenue",
          },
        ].map((stat, index, array) => (
          <div
            key={stat.label}
            className={`bg-[#F2F2F2] p-4 rounded-lg flex flex-col items-center justify-center min-h-[120px] ${
              index < array.length - 1 ? "md:border-r-2 md:border-blue-600" : ""
            }`}
          >
            <p className="text-blue-600 text-2xl md:text-3xl font-bold">
              {stat.value}
            </p>
            <p className="text-blue-600 text-lg md:text-xl font-semibold text-center">
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      {/* User Growth Section */}
      <div className="w-full bg-[#F2F2F2] rounded-lg shadow-md p-4 md:p-6">
        <div className="flex flex-col space-y-4 md:space-y-0 md:flex-row md:justify-between md:items-center mb-6">
          <h1 className="text-xl text-blue-600 font-semibold">User Growth</h1>
          <div className="relative w-full md:w-40">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="w-full px-4 py-2 border border-[#111827] rounded-md flex justify-between items-center bg-white hover:bg-gray-50 transition-colors"
            >
              <span className="text-[#111827] text-sm md:text-base">
                {selectedYear}
              </span>
              <FaChevronDown
                className={`text-[#111827] w-4 h-4 transition-transform ${
                  isOpen ? "transform rotate-180" : ""
                }`}
              />
            </button>

            {isOpen && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setIsOpen(false)}
                />
                <div className="absolute z-30 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {years.map((year) => (
                    <div
                      key={year}
                      onClick={() => handleSelect(year)}
                      className={`px-4 py-2 cursor-pointer hover:bg-gray-50 transition-colors text-sm md:text-base ${
                        year === selectedYear
                          ? "bg-blue-50 text-blue-600 font-medium"
                          : "text-gray-700"
                      }`}
                    >
                      {year}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
        <div className="h-64 md:h-80">
          <TotalView chartData={dashboardData?.data?.userChart || []} />
        </div>
      </div>
      {/* Recent Users Section */}
      <div className="w-full">
        <h1 className="text-xl md:text-2xl text-blue-600 font-bold mb-4">
          Recent Joined Users
        </h1>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <RecentUsers recentUsers={dashboardData?.data?.recentUsers || []} />
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
