/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const TotalView = ({ chartData }) => {
  const [chartHeight, setChartHeight] = useState(220);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 220) {
        setChartHeight(250); // Adjust height for mobile
      } else if (window.innerWidth < 768) {
        setChartHeight(220); // Adjust height for smaller tablets
      } else {
        setChartHeight(220); // Default height for larger screens
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize(); // Call on mount to set the initial height

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const maxCount = Math.max(...chartData.map((item) => item.count || 0), 100);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const { month, count } = payload[0].payload;
      return (
        <div className="bg-white shadow-md p-3 rounded-md border text-gray-700 text-blue-600">
          <p className="font-medium text-blue-600">Month: {month}</p>
          <p className="font-medium text-blue-600">Users: {count}</p>
        </div>
      );
    }
    return null;
  };
  return (
    <div>
      <ResponsiveContainer width="100%" height={chartHeight}>
        <BarChart
          data={chartData}
          margin={{
            top: 0,
            right: 0,
            left: 0,
            bottom: 0,
          }}
        >
          <XAxis tickLine={false} dataKey="month" className="text-blue-600" />
          <YAxis
            tickLine={false}
            domain={[0, maxCount + 10]}
            className="text-blue-600"
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar
            barSize={30}
            radius={[5, 5, 0, 0]}
            dataKey="count"
            fill="#0c78d6ff"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TotalView;
