import React, { useState } from 'react';
import { UsersIcon, SettingsIcon, ToolsIcon } from '../../utils/icons';
import { ParticipantTypeManager } from './ParticipantTypeManager';

type ParticipantTab = 'types' | 'devices' | 'programs' | 'operators';

export const ParticipantManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ParticipantTab>('types');

  return (
    <div className="space-y-6">
      {/* Sub-navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('types')}
            className={`${
              activeTab === 'types'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
          >
            <SettingsIcon className="h-5 w-5 mr-2" />
            Participant Types
          </button>
          <button
            onClick={() => setActiveTab('devices')}
            className={`${
              activeTab === 'devices'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
          >
            <ToolsIcon className="h-5 w-5 mr-2" />
            Devices
          </button>
          <button
            onClick={() => setActiveTab('programs')}
            className={`${
              activeTab === 'programs'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
          >
            <SettingsIcon className="h-5 w-5 mr-2" />
            Programs
          </button>
          <button
            onClick={() => setActiveTab('operators')}
            className={`${
              activeTab === 'operators'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
          >
            <UsersIcon className="h-5 w-5 mr-2" />
            Operators
          </button>
        </nav>
      </div>

      {/* Tab content */}
      {activeTab === 'types' && <ParticipantTypeManager />}

      {activeTab === 'devices' && (
        <div>
          <h3 className="text-lg font-medium text-gray-900">Devices</h3>
          <p className="mt-1 text-sm text-gray-500">
            Manage your production line devices and their attributes.
          </p>
          {/* We'll add the DeviceManager component here */}
        </div>
      )}

      {activeTab === 'programs' && (
        <div>
          <h3 className="text-lg font-medium text-gray-900">Programs</h3>
          <p className="mt-1 text-sm text-gray-500">
            Manage your production line programs and their configurations.
          </p>
          {/* We'll add the ProgramManager component here */}
        </div>
      )}

      {activeTab === 'operators' && (
        <div>
          <h3 className="text-lg font-medium text-gray-900">Operators</h3>
          <p className="mt-1 text-sm text-gray-500">
            Manage your production line operators and their permissions.
          </p>
          {/* We'll add the OperatorManager component here */}
        </div>
      )}
    </div>
  );
}; 