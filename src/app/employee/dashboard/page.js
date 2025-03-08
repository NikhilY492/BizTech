"use client";
import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Clock, Calendar, Activity, Monitor, Coffee, Users, BarChart2, AlertCircle, Zap } from 'lucide-react';

// Sample data for demonstration - will be replaced with API data
const mockProductivityData = [
  { name: 'Mon', deepWork: 4.5, distracted: 2.5, idle: 1 },
  { name: 'Tue', deepWork: 5, distracted: 1.5, idle: 1.5 },
  { name: 'Wed', deepWork: 6, distracted: 1, idle: 1 },
  { name: 'Thu', deepWork: 3.5, distracted: 3.5, idle: 1 },
  { name: 'Fri', deepWork: 4, distracted: 2, idle: 2 },
];

const appUsageData = [
  { name: 'VS Code', value: 35, color: '#2563eb' },
  { name: 'Browser', value: 25, color: '#7c3aed' },
  { name: 'Slack', value: 15, color: '#8b5cf6' },
  { name: 'Zoom', value: 10, color: '#a855f7' },
  { name: 'Others', value: 15, color: '#d1d5db' },
];

const breakTimeData = [
  { name: '9 AM', time: 5 },
  { name: '10 AM', time: 0 },
  { name: '11 AM', time: 15 },
  { name: '12 PM', time: 30 },
  { name: '1 PM', time: 5 },
  { name: '2 PM', time: 0 },
  { name: '3 PM', time: 10 },
  { name: '4 PM', time: 5 },
  { name: '5 PM', time: 0 },
];

const distractionData = [
  { hour: '9 AM', socialMedia: 5, email: 8, slack: 12 },
  { hour: '10 AM', socialMedia: 0, email: 2, slack: 5 },
  { hour: '11 AM', socialMedia: 3, email: 5, slack: 8 },
  { hour: '12 PM', socialMedia: 15, email: 3, slack: 7 },
  { hour: '1 PM', socialMedia: 12, email: 6, slack: 4 },
  { hour: '2 PM', socialMedia: 2, email: 4, slack: 9 },
  { hour: '3 PM', socialMedia: 4, email: 7, slack: 11 },
  { hour: '4 PM', socialMedia: 8, email: 9, slack: 6 },
];

const COLORS = ['#2563eb', '#7c3aed', '#8b5cf6', '#a855f7', '#d1d5db'];

const EmployeeDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [recentActivity, setRecentActivity] = useState([]);
  const [appSwitches, setAppSwitches] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [activityData, setActivityData] = useState([]);
  const [username, setUsername] = useState('');
  const [userInitials, setUserInitials] = useState('');
  const [jobRole, setJobRole] = useState('Employee');

  // Get username from localStorage on component mount
  useEffect(() => {
    const storedUsername = localStorage.getItem("username") || '';
    setUsername(storedUsername);
    
    // Generate initials from username
    if (storedUsername) {
      const initials = storedUsername
        .split(' ')
        .map(word => word.charAt(0).toUpperCase())
        .join('')
        .slice(0, 2);
      setUserInitials(initials);
      
      // You could also fetch the job role from localStorage or an API
      const storedJobRole = localStorage.getItem("jobRole") || 'Employee';
      setJobRole(storedJobRole);
    }
  }, []);

  // Calculate productivity score
  const totalHours = mockProductivityData.reduce((acc, day) => acc + day.deepWork + day.distracted + day.idle, 0);
  const deepWorkHours = mockProductivityData.reduce((acc, day) => acc + day.deepWork, 0);
  const productivityScore = Math.round((deepWorkHours / totalHours) * 100);

  // Track user activity and send data to backend
  useEffect(() => {
    const storedUsername = localStorage.getItem("username");
    if (!storedUsername) return; // Ensure user is logged in

    let keyboardActivity = 0;
    let mouseClicks = 0;

    // Track keyboard presses
    const handleKeyPress = () => {
      keyboardActivity += 1;
    };

    // Track mouse clicks
    const handleMouseClick = () => {
      mouseClicks += 1;
    };

    // Add event listeners
    window.addEventListener("keydown", handleKeyPress);
    window.addEventListener("click", handleMouseClick);

    const sendActivityData = async () => {
      try {
        const response = await fetch("http://localhost:5000/update_activity", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: storedUsername,
            keyboard_activity: keyboardActivity,
            mouse_clicks: mouseClicks,
            timestamp: Date.now(),
          }),
        });

        if (!response.ok) {
          console.error("Failed to send activity data");
        }
      } catch (error) {
        console.error("Error sending activity data:", error);
      }

      // Reset counters after sending data
      keyboardActivity = 0;
      mouseClicks = 0;
    };

    // Send data every 1 minute
    const intervalId = setInterval(sendActivityData, 60000);

    // Cleanup event listeners and interval
    return () => {
      window.removeEventListener("keydown", handleKeyPress);
      window.removeEventListener("click", handleMouseClick);
      clearInterval(intervalId);
    };
  }, []);

  // Fetch data from Flask backend
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch recent activity
        const activityResponse = await fetch('/api/activity');
        if (activityResponse.ok) {
          const activityData = await activityResponse.json();
          setRecentActivity(activityData);
        }

        // Fetch app switches
        const switchesResponse = await fetch('/api/switches');
        if (switchesResponse.ok) {
          const switchesData = await switchesResponse.json();
          setAppSwitches(switchesData.count);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    // Initial fetch
    fetchData();

    // Set up a polling interval for real-time updates
    const intervalId = setInterval(fetchData, 60000); // Poll every minute

    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  // Render different content based on active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab 
          productivityScore={productivityScore} 
          deepWorkHours={deepWorkHours} 
          appSwitches={appSwitches}
          mockProductivityData={mockProductivityData}
          appUsageData={appUsageData}
          recentActivity={recentActivity}
          isLoading={isLoading}
        />;
      case 'productivity':
        return <ProductivityTab 
          productivityData={mockProductivityData} 
          distractionData={distractionData}
        />;
      case 'applications':
        return <ApplicationsTab 
          appUsageData={appUsageData} 
          appSwitches={appSwitches}
        />;
      case 'breaks':
        return <BreaksTab breakTimeData={breakTimeData} />;
      default:
        return <OverviewTab />;
    }
  };

  useEffect(() => {
    const fetchActivity = async () => {
        try {
            const response = await fetch(`http://127.0.0.1:5000/get_activity/JohnDoe`); // replace JohnDoe
            const data = await response.json();
            setActivityData(data);
        } catch (error) {
            console.error('Error fetching activity data:', error);
        }
    };
    fetchActivity();
}, []);
 
 return (
 <div className="flex h-screen bg-gray-50">
 {/* Sidebar */}
 <div className="w-64 bg-white shadow-lg">
 <div className="p-4 border-b">
 <h2 className="text-xl font-bold text-gray-800">Time Tracker</h2>
 <p className="text-sm text-gray-500">Employee Dashboard</p>
 </div>
 
 <div className="p-4">
 <div className="flex items-center space-x-3 mb-6">
 <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
 {userInitials || '--'}
 </div>
 <div>
 <h3 className="font-medium text-black">{username || 'Loading...'}</h3>
 <p className="text-sm text-gray-500">{jobRole}</p>
 </div>
 </div>
 
 <nav>
 <button 
 onClick={() => setActiveTab('overview')}
 className={`flex items-center space-x-2 w-full p-2 rounded-md mb-1 ${activeTab === 'overview' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
 >
 <Activity size={18} />
 <span>Overview</span>
 </button>
 
 <button 
 onClick={() => setActiveTab('productivity')}
 className={`flex items-center space-x-2 w-full p-2 rounded-md mb-1 ${activeTab === 'productivity' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
 >
 <BarChart2 size={18} />
 <span>Productivity</span>
 </button>
 
 <button 
 onClick={() => setActiveTab('applications')}
 className={`flex items-center space-x-2 w-full p-2 rounded-md mb-1 ${activeTab === 'applications' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
 >
 <Monitor size={18} />
 <span>Applications</span>
 </button>
 
 <button 
 onClick={() => setActiveTab('breaks')}
 className={`flex items-center space-x-2 w-full p-2 rounded-md mb-1 ${activeTab === 'breaks' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
 >
 <Coffee size={18} />
 <span>Breaks</span>
 </button>
 </nav>
 </div>
 </div>
 
 {/* Main Content */}
 <div className="flex-1 overflow-auto">
 {/* Header */}
 <header className="bg-white p-4 border-b flex items-center justify-between">
 <h1 className="text-xl font-semibold text-black">{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Dashboard</h1>
 <div className="flex items-center space-x-2">
 <span className="text-sm text-gray-500">March 8, 2025</span>
 <button className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm">
 Generate Report
 </button>
 </div>
 </header>
 
 {/* Dashboard Content */}
 <main className="p-6">
 {renderTabContent()}
 </main>
 </div>
 </div>
 );
};

// Tab Components
const OverviewTab = ({ productivityScore, deepWorkHours, appSwitches, mockProductivityData, appUsageData, recentActivity, isLoading }) => {
 return (
 <>
 {/* Overview Cards */}
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
 <div className="bg-white p-4 rounded-lg shadow">
 <div className="flex items-center justify-between">
 <h3 className="text-gray-500 text-sm">Productivity Score</h3>
 <span className={`text-sm px-2 py-1 rounded ${productivityScore >= 70 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
 {productivityScore >= 70 ? 'Good' : 'Average'}
 </span>
 </div>
 <div className="mt-2 flex items-end justify-between text-black">
 <span className="text-3xl font-bold">{productivityScore}%</span>
 <Activity className="text-blue-500" size={24} />
 </div>
 </div>
 
 <div className="bg-white p-4 rounded-lg shadow">
 <div className="flex items-center justify-between">
 <h3 className="text-gray-500 text-sm">Deep Work Hours</h3>
 <span className="text-sm px-2 py-1 rounded bg-blue-100 text-blue-800">This Week</span>
 </div>
 <div className="mt-2 flex items-end justify-between text-black">
 <span className="text-3xl font-bold">{deepWorkHours.toFixed(1)}h</span>
 <Clock className="text-blue-500" size={24} />
 </div>
 </div>
 
 <div className="bg-white p-4 rounded-lg shadow">

<div className="flex items-center justify-between">

<h3 className="text-gray-500 text-sm">App Switches</h3>

<span className="text-sm px-2 py-1 rounded bg-purple-100 text-purple-800">Today</span>

</div>

<div className="mt-2 flex items-end justify-between text-black">

<span className="text-3xl font-bold">42</span>

<Monitor className="text-purple-500" size={24} />

</div>

</div>
 
 <div className="bg-white p-4 rounded-lg shadow">
 <div className="flex items-center justify-between">
 <h3 className="text-gray-500 text-sm">Break Time</h3>
 <span className="text-sm px-2 py-1 rounded bg-orange-100 text-orange-800">Today</span>
 </div>
 <div className="mt-2 flex items-end justify-between text-black">
 <span className="text-3xl font-bold">45m</span>
 <Coffee className="text-orange-500" size={24} />
 </div>
 </div>
 </div>
 
 {/* Charts Section */}
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
 {/* Weekly Productivity Chart */}
 <div className="bg-white p-4 rounded-lg shadow">
 <h3 className="font-medium mb-4">Weekly Work Pattern</h3>
 <ResponsiveContainer width="100%" height={300}>
 <BarChart
 data={mockProductivityData}
 margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
 barSize={20}
 >
 <CartesianGrid strokeDasharray="3 3" />
 <XAxis dataKey="name" />
 <YAxis label={{ value: 'Hours', angle: -90, position: 'insideLeft' }} />
 <Tooltip />
 <Legend />
 <Bar dataKey="deepWork" name="Deep Work" fill="#2563eb" />
 <Bar dataKey="distracted" name="Distracted" fill="#8b5cf6" />
 <Bar dataKey="idle" name="Idle" fill="#d1d5db" />
 </BarChart>
 </ResponsiveContainer>
 </div>
 
 {/* App Usage Chart */}
 <div className="bg-white p-4 rounded-lg shadow">
 <h3 className="font-medium mb-4">App Usage Distribution</h3>
 <ResponsiveContainer width="100%" height={300}>
 <PieChart>
 <Pie
 data={appUsageData}
 cx="50%"
 cy="50%"
 labelLine={false}
 outerRadius={100}
 fill="#8884d8"
 dataKey="value"
 label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
 >
 {appUsageData.map((entry, index) => (
 <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
 ))}
 </Pie>
 <Tooltip />
 </PieChart>
 </ResponsiveContainer>
 </div>
 </div>
 
 {/* Recent Activity */}
 <div className="bg-white p-4 rounded-lg shadow">
 <div className="flex justify-between items-center mb-4">
 <h3 className="font-medium">Recent Activity</h3>
 {isLoading && <span className="text-sm text-blue-500">Refreshing data...</span>}
 </div>
 <div className="overflow-x-auto">
 <table className="min-w-full divide-y divide-gray-200">
 <thead>
 <tr>
 <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
 <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Application</th>
 <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
 <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Activity Type</th>
 </tr>
 </thead>
 <tbody className="bg-white divide-y divide-gray-200">
 {recentActivity && recentActivity.length > 0 ? (
 recentActivity.map((activity, index) => (
 <tr key={index}>
 <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{activity.time}</td>
 <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{activity.application}</td>
 <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{activity.duration}</td>
 <td className="px-6 py-4 whitespace-nowrap text-sm">
 <span className={`px-2 py-1 text-xs rounded-full ${
 activity.type === 'Deep Work' ? 'bg-green-100 text-green-800' : 
 activity.type === 'Communication' ? 'bg-blue-100 text-blue-800' :
 activity.type === 'Break' ? 'bg-yellow-100 text-yellow-800' :
 'bg-gray-100 text-gray-800'
 }`}>
 {activity.type}
 </span>
 </td>
 </tr>
 ))
 ) : (
 <>
 <tr>
 <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">10:30 AM</td>
 <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">VS Code</td>
 <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">45m</td>
 <td className="px-6 py-4 whitespace-nowrap text-sm">
 <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Deep Work</span>
 </td>
 </tr>
 <tr>
 <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">11:15 AM</td>
 <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">Slack</td>
 <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">15m</td>
 <td className="px-6 py-4 whitespace-nowrap text-sm">
 <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">Communication</span>
 </td>
 </tr>
 <tr>
 <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">11:30 AM</td>
 <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">Browser - Github</td>
 <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">25m</td>
 <td className="px-6 py-4 whitespace-nowrap text-sm">
 <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Deep Work</span>
 </td>
 </tr>
 <tr>
 <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">11:55 AM</td>
 <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">No Activity</td>
 <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">20m</td>
 <td className="px-6 py-4 whitespace-nowrap text-sm">
 <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">Break</span>
 </td>
 </tr>
 </>
 )}
 </tbody>
 </table>
 </div>
 </div>
 </>
 );
};

const ProductivityTab = ({ productivityData, distractionData }) => {
 return (
 <>
 <div className="mb-6">
 <h2 className="text-xl font-medium mb-4">Productivity Analysis</h2>
 <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
 <div className="bg-white p-4 rounded-lg shadow">
 <h3 className="text-gray-500 text-sm mb-1">Focus Time</h3>
 <div className="text-3xl font-bold">4.5h</div>
 <div className="text-sm text-gray-500 mt-1">Average per day</div>
 </div>
 <div className="bg-white p-4 rounded-lg shadow">
 <h3 className="text-gray-500 text-sm mb-1">Distracted Time</h3>
 <div className="text-3xl font-bold">2.1h</div>
 <div className="text-sm text-gray-500 mt-1">Average per day</div>
 </div>
 <div className="bg-white p-4 rounded-lg shadow">
 <h3 className="text-gray-500 text-sm mb-1">Focus Sessions</h3>
 <div className="text-3xl font-bold">8</div>
 <div className="text-sm text-gray-500 mt-1">Average per day</div>
 </div>
 </div>
 </div>
 
 {/* Productivity Charts */}
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
 {/* Deep Work vs Distraction */}
 <div className="bg-white p-4 rounded-lg shadow">
 <h3 className="font-medium mb-4">Focus vs Distraction Ratio</h3>
 <ResponsiveContainer width="100%" height={300}>
 <BarChart
 data={productivityData}
 margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
 barSize={20}
 >
 <CartesianGrid strokeDasharray="3 3" />
 <XAxis dataKey="name" />
 <YAxis label={{ value: 'Hours', angle: -90, position: 'insideLeft' }} />
 <Tooltip />
 <Legend />
 <Bar dataKey="deepWork" name="Focus Time" fill="#10b981" />
 <Bar dataKey="distracted" name="Distracted" fill="#f43f5e" />
 </BarChart>
 </ResponsiveContainer>
 </div>
 
 {/* Distraction Sources */}
 <div className="bg-white p-4 rounded-lg shadow">
 <h3 className="font-medium mb-4">Distraction Sources</h3>
 <ResponsiveContainer width="100%" height={300}>
 <LineChart
 data={distractionData}
 margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
 >
 <CartesianGrid strokeDasharray="3 3" />
 <XAxis dataKey="hour" />
 <YAxis label={{ value: 'Minutes', angle: -90, position: 'insideLeft' }} />
 <Tooltip />
 <Legend />
 <Line type="monotone" dataKey="socialMedia" name="Social Media" stroke="#f43f5e" />
 <Line type="monotone" dataKey="email" name="Email" stroke="#8b5cf6" />
 <Line type="monotone" dataKey="slack" name="Slack" stroke="#0ea5e9" />
 </LineChart>
 </ResponsiveContainer>
 </div>
 </div>
 
 {/* Productivity Tips */}
 <div className="bg-white p-4 rounded-lg shadow">
 <h3 className="font-medium mb-4">Productivity Insights</h3>
 <div className="space-y-4">
 <div className="flex items-start space-x-3">
 <AlertCircle className="text-amber-500 mt-1 flex-shrink-0" size={20} />
 <div>
 <p className="font-medium">Excessive App Switching</p>
 <p className="text-sm text-gray-600">You switch between applications 42 times today, which is 15% higher than your average.</p>
 </div>
 </div>
 <div className="flex items-start space-x-3">
 <Zap className="text-green-500 mt-1 flex-shrink-0" size={20} />
 <div>
 <p className="font-medium">Peak Productivity Time</p>
 <p className="text-sm text-gray-600">Your most productive hours are between 9AM-11AM. Consider scheduling deep work during this time.</p>
 </div>
 </div>
 <div className="flex items-start space-x-3">
 <Activity className="text-blue-500 mt-1 flex-shrink-0" size={20} />
 <div>
 <p className="font-medium">Break Patterns</p>
 <p className="text-sm text-gray-600">You tend to work for 90 minutes straight without breaks. Consider taking short breaks every 50-60 minutes.</p>
 </div>
 </div>
 </div>
 </div>
 </>
 );
};

const ApplicationsTab = ({ appUsageData, appSwitches }) => {
 // Top applications by time spent
 const topApps = [
 { name: 'VS Code', time: '3h 45m', category: 'Development', trend: '+12%' },
 { name: 'Chrome', time: '2h 10m', category: 'Browser', trend: '-8%' },
 { name: 'Slack', time: '1h 25m', category: 'Communication', trend: '+5%' },
 { name: 'Zoom', time: '45m', category: 'Communication', trend: '-15%' },
 { name: 'Terminal', time: '32m', category: 'Development', trend: '+3%' },
 ];

 return (
 <>
 <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
 <div className="bg-white p-4 rounded-lg shadow">
 <h3 className="text-gray-500 text-sm mb-1">App Switches</h3>
 <div className="text-3xl font-bold">{appSwitches || 42}</div>
 <div className="text-sm text-gray-500 mt-1">Today</div>
 </div>
 <div className="bg-white p-4 rounded-lg shadow">
 <h3 className="text-gray-500 text-sm mb-1">Most Used App</h3>
 <div className="text-xl font-bold">VS Code</div>
 <div className="text-sm text-gray-500 mt-1">3h 45m (42% of work time)</div>
 </div>
 <div className="bg-white p-4 rounded-lg shadow">
 <h3 className="text-gray-500 text-sm mb-1">Multitasking Score</h3>
 <div className="text-3xl font-bold">68%</div>
 <div className="text-sm text-gray-500 mt-1">Moderate</div>
 </div>
 </div>
 
 {/* App Usage Distribution */}
 <div className="bg-white p-4 rounded-lg shadow mb-6">
 <h3 className="font-medium mb-4">Application Usage Distribution</h3>
 <ResponsiveContainer width="100%" height={300}>
 <PieChart>
 <Pie
 data={appUsageData}
 cx="50%"
 cy="50%"
 labelLine={false}
 outerRadius={120}
 fill="#8884d8"
 dataKey="value"
 label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
 >
 {appUsageData.map((entry, index) => (
 <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
 ))}
 </Pie>
 <Tooltip />
 </PieChart>
 </ResponsiveContainer>
 </div>
 
 {/* Top Applications Table */}
 <div className="bg-white p-4 rounded-lg shadow">
 <h3 className="font-medium mb-4">Top Applications</h3>
 <div className="overflow-x-auto">
 <table className="min-w-full divide-y divide-gray-200">
 <thead>
 <tr>
 <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Application</th>
 <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time Spent</th>
 <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
 <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trend</th>
 </tr>
 </thead>
 <tbody className="bg-white divide-y divide-gray-200">
 {topApps.map((app, index) => (
 <tr key={index}>
 <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{app.name}</td>
 <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{app.time}</td>
 <td className="px-6 py-4 whitespace-nowrap text-sm">
 <span className={`inline-flex items-center ${
 app.trend.startsWith('+') ? 'text-green-600' : 'text-red-600'
 }`}>
 {app.trend}
 {app.trend.startsWith('+') ? 
 <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
 </svg> : 
 <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
 </svg>
 }
 </span>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>
 </>
 );
};

const BreaksTab = ({ breakTimeData }) => {
 // Break distribution by day
 const breaksByDay = [
 { day: 'Monday', scheduled: 35, unscheduled: 25 },
 { day: 'Tuesday', scheduled: 30, unscheduled: 20 },
 { day: 'Wednesday', scheduled: 30, unscheduled: 15 },
 { day: 'Thursday', scheduled: 40, unscheduled: 30 },
 { day: 'Friday', scheduled: 45, unscheduled: 35 },
 ];

 // Break metrics
 const breakMetrics = {
 totalToday: '45 minutes',
 avgBreakLength: '12 minutes',
 longestPeriodWithoutBreak: '120 minutes',
 recommendedBreakTime: '55 minutes',
 };

 return (
 <>
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
 <div className="bg-white p-4 rounded-lg shadow">
 <h3 className="text-gray-500 text-sm mb-1">Total Break Time</h3>
 <div className="text-3xl font-bold">{breakMetrics.totalToday}</div>
 <div className="text-sm text-gray-500 mt-1">Today</div>
 </div>
 <div className="bg-white p-4 rounded-lg shadow">
 <h3 className="text-gray-500 text-sm mb-1">Average Break Length</h3>
 <div className="text-3xl font-bold">{breakMetrics.avgBreakLength}</div>
 <div className="text-sm text-gray-500 mt-1">Per break</div>
 </div>
 <div className="bg-white p-4 rounded-lg shadow">
 <h3 className="text-gray-500 text-sm mb-1">Longest Without Break</h3>
 <div className="text-3xl font-bold">{breakMetrics.longestPeriodWithoutBreak}</div>
 <div className="text-sm text-gray-500 mt-1">Today</div>
 </div>
 <div className="bg-white p-4 rounded-lg shadow">
 <h3 className="text-gray-500 text-sm mb-1">Recommended</h3>
 <div className="text-3xl font-bold">{breakMetrics.recommendedBreakTime}</div>
 <div className="text-sm text-gray-500 mt-1">Per 8-hour day</div>
 </div>
 </div>
 
 {/* Break Time Trend Chart */}
 <div className="bg-white p-4 rounded-lg shadow mb-6">
 <h3 className="font-medium mb-4">Break Time Distribution (Today)</h3>
 <ResponsiveContainer width="100%" height={300}>
 <LineChart
 data={breakTimeData}
 margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
 >
 <CartesianGrid strokeDasharray="3 3" />
 <XAxis dataKey="name" />
 <YAxis label={{ value: 'Minutes', angle: -90, position: 'insideLeft' }} />
 <Tooltip />
 <Legend />
 <Line type="monotone" dataKey="time" name="Break Time" stroke="#f97316" strokeWidth={2} dot={{ r: 4 }} />
 </LineChart>
 </ResponsiveContainer>
 </div>
 
 {/* Break Distribution by Day */}
 <div className="bg-white p-4 rounded-lg shadow mb-6">
 <h3 className="font-medium mb-4">Weekly Break Patterns</h3>
 <ResponsiveContainer width="100%" height={300}>
 <BarChart
 data={breaksByDay}
 margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
 barSize={20}
 >
 <CartesianGrid strokeDasharray="3 3" />
 <XAxis dataKey="day" />
 <YAxis label={{ value: 'Minutes', angle: -90, position: 'insideLeft' }} />
 <Tooltip />
 <Legend />
 <Bar dataKey="scheduled" name="Scheduled Breaks" fill="#f97316" />
 <Bar dataKey="unscheduled" name="Unscheduled Breaks" fill="#fbbf24" />
 </BarChart>
 </ResponsiveContainer>
 </div>
 
 {/* Break Recommendations */}
 <div className="bg-white p-4 rounded-lg shadow">
 <h3 className="font-medium mb-4">Break Recommendations</h3>
 <div className="space-y-4">
 <div className="flex items-start space-x-3">
 <AlertCircle className="text-amber-500 mt-1 flex-shrink-0" size={20} />
 <div>
 <p className="font-medium">Extended Work Period Detected</p>
 <p className="text-sm text-gray-600">You worked for 120 minutes straight from 9:00 AM to 11:00 AM without taking a break. Consider shorter work intervals.</p>
 </div>
 </div>
 <div className="flex items-start space-x-3">
 <Coffee className="text-orange-500 mt-1 flex-shrink-0" size={20} />
 <div>
 <p className="font-medium">Optimal Break Schedule</p>
 <p className="text-sm text-gray-600">Research suggests taking a 5-minute break every 25 minutes, or a 15-minute break every 90 minutes of focused work.</p>
 </div>
 </div>
 <div className="flex items-start space-x-3">
 <Users className="text-blue-500 mt-1 flex-shrink-0" size={20} />
 <div>
 <p className="font-medium">Break Activity Suggestion</p>
 <p className="text-sm text-gray-600">Consider spending breaks away from screens. Short walks, stretching, or brief meditation can improve focus when you return to work.</p>
 </div>
 </div>
 <div className="flex items-start space-x-3">
 <Calendar className="text-purple-500 mt-1 flex-shrink-0" size={20} />
 <div>
 <p className="font-medium">Schedule Adjustment</p>
 <p className="text-sm text-gray-600">Your break pattern suggests you may benefit from scheduling longer breaks around 12 PM and 3 PM when your energy naturally dips.</p>
 </div>
 </div>
 </div>
 </div>
 </>
 );
};

export default EmployeeDashboard;