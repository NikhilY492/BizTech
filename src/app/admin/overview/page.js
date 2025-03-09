"use client"
import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Users, Activity, BarChart2, User, Clock, Monitor, Coffee } from 'lucide-react';

// Sample data for demonstration
const mockEmployeesData = [
  { id: 1, name: 'John Doe', role: 'Developer', productivityScore: 78, deepWorkHours: 23, distractedHours: 9, breakTime: 4.5 },
  { id: 2, name: 'Jane Smith', role: 'Designer', productivityScore: 82, deepWorkHours: 25, distractedHours: 7, breakTime: 5 },
  { id: 3, name: 'Mike Johnson', role: 'Product Manager', productivityScore: 75, deepWorkHours: 21, distractedHours: 11, breakTime: 3.8 },
  { id: 4, name: 'Sarah Williams', role: 'Developer', productivityScore: 85, deepWorkHours: 27, distractedHours: 6, breakTime: 4.2 },
  { id: 5, name: 'David Brown', role: 'QA Engineer', productivityScore: 73, deepWorkHours: 20, distractedHours: 12, breakTime: 5.3 },
];

const weeklyTrendData = [
  { name: 'Week 1', avgProductivity: 72, totalDeepWork: 110 },
  { name: 'Week 2', avgProductivity: 75, totalDeepWork: 115 },
  { name: 'Week 3', avgProductivity: 73, totalDeepWork: 112 },
  { name: 'Week 4', avgProductivity: 78, totalDeepWork: 122 },
  { name: 'Week 5', avgProductivity: 80, totalDeepWork: 130 },
];

const departmentData = [
  { name: 'Development', value: 42, color: '#2563eb' },
  { name: 'Design', value: 28, color: '#7c3aed' },
  { name: 'Product', value: 15, color: '#8b5cf6' },
  { name: 'QA', value: 10, color: '#a855f7' },
  { name: 'Other', value: 5, color: '#d1d5db' },
];

const COLORS = ['#2563eb', '#7c3aed', '#8b5cf6', '#a855f7', '#d1d5db'];

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [employees, setEmployees] = useState(mockEmployeesData);
  const [isLoading, setIsLoading] = useState(false);

  // Calculate metrics
  const avgProductivityScore = Math.round(
    employees.reduce((acc, emp) => acc + emp.productivityScore, 0) / employees.length
  );
  
  const totalDeepWorkHours = employees.reduce((acc, emp) => acc + emp.deepWorkHours, 0);
  
  const avgBreakTime = (
    employees.reduce((acc, emp) => acc + emp.breakTime, 0) / employees.length
  ).toFixed(1);

  useEffect(() => {
    // Here you would fetch real data from your API
    // Example:
    // const fetchEmployees = async () => {
    //   setIsLoading(true);
    //   try {
    //     const response = await fetch('http://localhost:5000/admin/employees');
    //     const data = await response.json();
    //     setEmployees(data);
    //   } catch (error) {
    //     console.error('Error fetching employees:', error);
    //   } finally {
    //     setIsLoading(false);
    //   }
    // };
    // fetchEmployees();
  }, []);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg">
        <div className="p-4 border-b">
          <h2 className="text-xl font-bold text-gray-800">Time Tracker</h2>
          <p className="text-sm text-gray-500">Admin Dashboard</p>
        </div>
        
        <div className="p-4">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold">
              AD
            </div>
            <div>
              <h3 className="font-medium text-black">Admin User</h3>
              <p className="text-sm text-gray-500">Administrator</p>
            </div>
          </div>
          
          <nav>
            <button 
              onClick={() => setActiveTab('overview')}
              className={`flex items-center space-x-2 w-full p-2 rounded-md mb-1 ${activeTab === 'overview' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <Activity size={18} />
              <span>Overview</span>
            </button>
            
            <button 
              onClick={() => setActiveTab('employees')}
              className={`flex items-center space-x-2 w-full p-2 rounded-md mb-1 ${activeTab === 'employees' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <Users size={18} />
              <span>Employees</span>
            </button>
            
            <button 
              onClick={() => setActiveTab('reports')}
              className={`flex items-center space-x-2 w-full p-2 rounded-md mb-1 ${activeTab === 'reports' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <BarChart2 size={18} />
              <span>Reports</span>
            </button>
            
            <button 
              onClick={() => setActiveTab('settings')}
              className={`flex items-center space-x-2 w-full p-2 rounded-md mb-1 ${activeTab === 'settings' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <Monitor size={18} />
              <span>Settings</span>
            </button>
          </nav>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <header className="bg-white p-4 border-b flex items-center justify-between">
          <h1 className="text-xl font-semibold text-black">Admin Dashboard</h1>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">March 8, 2025</span>
            <button className="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm">
              Download Reports
            </button>
          </div>
        </header>
        
        {/* Dashboard Content */}
        <main className="p-6">
          {activeTab === 'overview' && (
            <>
              {/* Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-4 rounded-lg shadow">
                  <div className="flex items-center justify-between">
                    <h3 className="text-gray-500 text-sm">Total Employees</h3>
                    <span className="text-sm px-2 py-1 rounded bg-blue-100 text-blue-800">Active</span>
                  </div>
                  <div className="mt-2 flex items-end justify-between text-black">
                    <span className="text-3xl font-bold">{employees.length}</span>
                    <Users className="text-indigo-500" size={24} />
                  </div>
                </div>
                
                <div className="bg-white p-4 rounded-lg shadow">
                  <div className="flex items-center justify-between">
                    <h3 className="text-gray-500 text-sm">Avg. Productivity</h3>
                    <span className={`text-sm px-2 py-1 rounded ${avgProductivityScore >= 75 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {avgProductivityScore >= 75 ? 'Good' : 'Average'}
                    </span>
                  </div>
                  <div className="mt-2 flex items-end justify-between text-black">
                    <span className="text-3xl font-bold">{avgProductivityScore}%</span>
                    <Activity className="text-indigo-500" size={24} />
                  </div>
                </div>
                
                <div className="bg-white p-4 rounded-lg shadow">
                  <div className="flex items-center justify-between">
                    <h3 className="text-gray-500 text-sm">Total Deep Work</h3>
                    <span className="text-sm px-2 py-1 rounded bg-purple-100 text-purple-800">This Week</span>
                  </div>
                  <div className="mt-2 flex items-end justify-between text-black">
                    <span className="text-3xl font-bold">{totalDeepWorkHours}h</span>
                    <Clock className="text-indigo-500" size={24} />
                  </div>
                </div>
                
                <div className="bg-white p-4 rounded-lg shadow">
                  <div className="flex items-center justify-between">
                    <h3 className="text-gray-500 text-sm">Avg. Break Time</h3>
                    <span className="text-sm px-2 py-1 rounded bg-orange-100 text-orange-800">Per Day</span>
                  </div>
                  <div className="mt-2 flex items-end justify-between text-black">
                    <span className="text-3xl font-bold">{avgBreakTime}h</span>
                    <Coffee className="text-orange-500" size={24} />
                  </div>
                </div>
              </div>
              
              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Productivity Trend Chart */}
                <div className="bg-white p-4 rounded-lg shadow">
                  <h3 className="font-medium mb-4">Weekly Productivity Trend</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart
                      data={weeklyTrendData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="avgProductivity" 
                        name="Avg. Productivity (%)" 
                        stroke="#8884d8" 
                        activeDot={{ r: 8 }} 
                      />
                      <Line 
                        type="monotone" 
                        dataKey="totalDeepWork" 
                        name="Total Deep Work (h)" 
                        stroke="#82ca9d" 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                
                {/* Department Distribution Chart */}
                <div className="bg-white p-4 rounded-lg shadow">
                  <h3 className="font-medium mb-4">Department Distribution</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={departmentData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {departmentData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          )}
          
          {activeTab === 'employees' && (
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-medium">Employee Performance</h3>
                <div className="flex space-x-2">
                  <select className="border rounded-md px-2 py-1 text-sm">
                    <option>All Departments</option>
                    <option>Development</option>
                    <option>Design</option>
                    <option>Product</option>
                    <option>QA</option>
                  </select>
                  <select className="border rounded-md px-2 py-1 text-sm">
                    <option>This Week</option>
                    <option>This Month</option>
                    <option>Last 3 Months</option>
                  </select>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                      <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                      <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Productivity Score</th>
                      <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deep Work Hours</th>
                      <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Distracted Hours</th>
                      <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Break Time</th>
                      <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {employees.map((employee) => (
                      <tr key={employee.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 flex-shrink-0 rounded-full bg-gray-200 flex items-center justify-center">
                              {employee.name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{employee.role}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{employee.productivityScore}%</div>
                          <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                            <div 
                              className={`h-2 rounded-full ${
                                employee.productivityScore >= 80 ? 'bg-green-500' : 
                                employee.productivityScore >= 70 ? 'bg-blue-500' : 
                                'bg-yellow-500'
                              }`} 
                              style={{ width: `${employee.productivityScore}%` }}
                            ></div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{employee.deepWorkHours}h</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{employee.distractedHours}h</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{employee.breakTime}h</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button className="text-indigo-600 hover:text-indigo-900">View Details</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {activeTab === 'reports' && (
            <div className="space-y-6">
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="font-medium mb-4">Generate Reports</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium">Productivity Report</h4>
                      <BarChart2 size={20} className="text-indigo-500" />
                    </div>
                    <p className="text-sm text-gray-500">Weekly overview of team productivity metrics</p>
                  </div>
                  
                  <div className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium">Time Usage Report</h4>
                      <Clock size={20} className="text-indigo-500" />
                    </div>
                    <p className="text-sm text-gray-500">Breakdown of how time is spent across teams</p>
                  </div>
                  
                  <div className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium">Application Usage</h4>
                      <Monitor size={20} className="text-indigo-500" />
                    </div>
                    <p className="text-sm text-gray-500">Analytics on most used applications</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="font-medium mb-4">Scheduled Reports</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Report Name</th>
                        <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Frequency</th>
                        <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recipients</th>
                        <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Generated</th>
                        <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">Weekly Team Performance</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Weekly (Mon)</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Team Leads (5)</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Mar 4, 2025</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <button className="text-indigo-600 hover:text-indigo-900 mr-3">Edit</button>
                          <button className="text-red-600 hover:text-red-900">Delete</button>
                        </td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">Monthly Department Overview</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Monthly (1st)</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Department Heads (3)</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Mar 1, 2025</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <button className="text-indigo-600 hover:text-indigo-900 mr-3">Edit</button>
                          <button className="text-red-600 hover:text-red-900">Delete</button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'settings' && (
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="font-medium mb-4">Dashboard Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-md font-medium mb-3">General Settings</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Time Zone
                      </label>
                      <select className="border rounded-md w-full p-2">
                        <option>UTC (GMT+0)</option>
                        <option>Eastern Time (GMT-5)</option>
                        <option>Pacific Time (GMT-8)</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Work Hours
                      </label>
                      <div className="flex space-x-2">
                        <input type="time" className="border rounded-md p-2" defaultValue="09:00" />
                        <span className="self-center">to</span>
                        <input type="time" className="border rounded-md p-2" defaultValue="17:00" />
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      <input type="checkbox" id="weekends" className="rounded border-gray-300 mr-2" />
                      <label htmlFor="weekends" className="text-sm text-gray-700">
                        Include weekends in productivity calculations
                      </label>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-md font-medium mb-3">Notification Settings</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium">Email Reports</div>
                        <div className="text-xs text-gray-500">Receive scheduled reports by email</div>
                      </div>
                      <div className="relative inline-block w-10 mr-2 align-middle select-none">
                        <input type="checkbox" id="toggle1" className="sr-only" defaultChecked />
                        <div className="block bg-gray-300 w-10 h-6 rounded-full"></div>
                        <div className="dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition"></div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium">Low Productivity Alerts</div>
                        <div className="text-xs text-gray-500">Get notified when team productivity drops</div>
                      </div>
                      <div className="relative inline-block w-10 mr-2 align-middle select-none">
                        <input type="checkbox" id="toggle2" className="sr-only" defaultChecked />
                        <div className="block bg-gray-300 w-10 h-6 rounded-full"></div>
                        <div className="dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition"></div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium">System Notifications</div>
                        <div className="text-xs text-gray-500">Updates, maintenance and other system alerts</div>
                      </div>
                      <div className="relative inline-block w-10 mr-2 align-middle select-none">
                        <input type="checkbox" id="toggle3" className="sr-only" defaultChecked />
                        <div className="block bg-gray-300 w-10 h-6 rounded-full"></div>
                        <div className="dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end">
                <button className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 mr-2">
                  Cancel
                </button>
                <button className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700">
                  Save Changes
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;