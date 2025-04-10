import React, { useState } from 'react';
import { Wrench, Settings, Users } from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import { ParticipantManager } from './components/participants/ParticipantManager';

function App() {
  const [activeTab, setActiveTab] = useState<'overview' | 'participants' | 'processes' | 'settings'>('overview');

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <Wrench className="h-8 w-8 text-blue-600" />
              <h1 className="ml-2 text-xl font-semibold text-gray-900">
                Screwdriver Management System
              </h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
            >
              <Wrench className="h-5 w-5 mr-2" />
              Overview
            </button>
            <button
              onClick={() => setActiveTab('participants')}
              className={`${
                activeTab === 'participants'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
            >
              <Users className="h-5 w-5 mr-2" />
              Participants
            </button>
            <button
              onClick={() => setActiveTab('processes')}
              className={`${
                activeTab === 'processes'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
            >
              <Settings className="h-5 w-5 mr-2" />
              Processes
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`${
                activeTab === 'settings'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
            >
              <Settings className="h-5 w-5 mr-2" />
              Settings
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900">Welcome to the Screwdriver Management System</h2>
            <p className="mt-1 text-sm text-gray-500">
              This system helps you manage your production line participants and processes.
            </p>
          </div>
        )}

        {activeTab === 'participants' && (
          <div className="bg-white shadow rounded-lg p-6">
            <ParticipantManager />
          </div>
        )}

        {activeTab === 'processes' && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900">Process Management</h2>
            <p className="mt-1 text-sm text-gray-500">
              Configure and monitor your production processes and steps.
            </p>
            {/* We'll add the ProcessManager component here */}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900">System Settings</h2>
            <p className="mt-1 text-sm text-gray-500">
              Configure system settings and manage participant types.
            </p>
            {/* We'll add the SettingsManager component here */}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;