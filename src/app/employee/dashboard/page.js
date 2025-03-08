"use client";
import React, { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Clock,
  Activity,
  Monitor,
  Coffee,
  BarChart2,
} from "lucide-react";

const mockProductivityData = [
  { name: "Mon", deepWork: 4.5, distracted: 2.5, idle: 1 },
  { name: "Tue", deepWork: 5, distracted: 1.5, idle: 1.5 },
  { name: "Wed", deepWork: 6, distracted: 1, idle: 1 },
  { name: "Thu", deepWork: 3.5, distracted: 3.5, idle: 1 },
  { name: "Fri", deepWork: 4, distracted: 2, idle: 2 },
];

const appUsageData = [
  { name: "VS Code", value: 35, color: "#2563eb" },
  { name: "Browser", value: 25, color: "#7c3aed" },
  { name: "Slack", value: 15, color: "#8b5cf6" },
  { name: "Zoom", value: 10, color: "#a855f7" },
  { name: "Others", value: 15, color: "#d1d5db" },
];

const COLORS = ["#2563eb", "#7c3aed", "#8b5cf6", "#a855f7", "#d1d5db"];

const EmployeeDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");

  const totalHours = mockProductivityData.reduce(
    (acc, day) => acc + day.deepWork + day.distracted + day.idle,
    0
  );
  const deepWorkHours = mockProductivityData.reduce(
    (acc, day) => acc + day.deepWork,
    0
  );
  const productivityScore = Math.round((deepWorkHours / totalHours) * 100);

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="w-64 bg-white shadow-lg">
        <div className="p-4 border-b">
          <h2 className="text-xl font-bold text-gray-800">Time Tracker</h2>
          <p className="text-sm text-gray-500">Employee Dashboard</p>
        </div>

        <div className="p-4">
          <nav>
            {[
              { label: "Overview", icon: Activity, key: "overview" },
              { label: "Productivity", icon: BarChart2, key: "productivity" },
              { label: "Applications", icon: Monitor, key: "applications" },
              { label: "Breaks", icon: Coffee, key: "breaks" },
            ].map(({ label, icon: Icon, key }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex items-center space-x-2 w-full p-2 rounded-md mb-1 ${
                  activeTab === key
                    ? "bg-blue-50 text-blue-600"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <Icon size={18} />
                <span>{label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-gray-500 text-sm">Productivity Score</h3>
            <span
              className={`text-sm px-2 py-1 rounded ${
                productivityScore >= 70
                  ? "bg-green-100 text-green-800"
                  : "bg-yellow-100 text-yellow-800"
              }`}
            >
              {productivityScore >= 70 ? "Good" : "Average"}
            </span>
            <div className="mt-2 text-black text-3xl font-bold">
              {productivityScore}%
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-medium mb-4">Weekly Work Pattern</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={mockProductivityData} barSize={20}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="deepWork" fill="#2563eb" />
                <Bar dataKey="distracted" fill="#8b5cf6" />
                <Bar dataKey="idle" fill="#d1d5db" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-medium mb-4">App Usage Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={appUsageData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="value"
                >
                  {appUsageData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
