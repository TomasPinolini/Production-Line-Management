import React, { useState, useEffect } from 'react';
import { Wrench, WrenchIcon, Settings } from 'lucide-react';
import { DynamicForm } from './components/DynamicForm';
import { AttributeManager } from './components/AttributeManager';
import { ParticipantTable } from './components/ParticipantTable';
import { ParticipantTypes, VariableAttribute, DynamicFormData, Participant } from './types';
import toast from 'react-hot-toast';

function App() {
  const [activeTab, setActiveTab] = useState<'devices' | 'programs' | 'attributes'>('devices');
  const [deviceAttributes, setDeviceAttributes] = useState<VariableAttribute[]>([]);
  const [programAttributes, setProgramAttributes] = useState<VariableAttribute[]>([]);
  const [devices, setDevices] = useState<Participant[]>([]);
  const [programs, setPrograms] = useState<Participant[]>([]);

  // In a real implementation, these would be fetched from your MSSQL database
  const participantTypes = [
    { id: ParticipantTypes.Device, name: 'Device' },
    { id: ParticipantTypes.Program, name: 'Program' },
  ];

  const handleAddAttribute = async (attribute: Omit<VariableAttribute, 'id'>) => {
    // This would normally be handled by your database
    const newAttribute: VariableAttribute = {
      ...attribute,
      id: Math.random(), // Temporary ID generation
    };

    if (attribute.type_id === ParticipantTypes.Device) {
      setDeviceAttributes([...deviceAttributes, newAttribute]);
    } else {
      setProgramAttributes([...programAttributes, newAttribute]);
    }
  };

  const handleSubmitForm = async (data: DynamicFormData) => {
    // This would normally send the data to your MSSQL database
    const newParticipant: Participant = {
      id: Math.random(),
      name: data.participant_name,
      type_id: activeTab === 'devices' ? ParticipantTypes.Device : ParticipantTypes.Program,
      attributes: data.attributes,
      created_at: new Date().toISOString(),
    };

    if (activeTab === 'devices') {
      setDevices([...devices, newParticipant]);
    } else {
      setPrograms([...programs, newParticipant]);
    }

    toast.success('Data saved successfully!');
  };

  const handleEdit = (participant: Participant) => {
    // Implement edit functionality
    console.log('Edit participant:', participant);
  };

  const handleDelete = (participant: Participant) => {
    if (participant.type_id === ParticipantTypes.Device) {
      setDevices(devices.filter(d => d.id !== participant.id));
    } else {
      setPrograms(programs.filter(p => p.id !== participant.id));
    }
    toast.success('Entry deleted successfully');
  };

  return (
    <div className="min-h-screen bg-gray-50">
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
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('devices')}
              className={`${
                activeTab === 'devices'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
            >
              <WrenchIcon className="h-5 w-5 mr-2" />
              Devices
            </button>
            <button
              onClick={() => setActiveTab('programs')}
              className={`${
                activeTab === 'programs'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Programs
            </button>
            <button
              onClick={() => setActiveTab('attributes')}
              className={`${
                activeTab === 'attributes'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
            >
              <Settings className="h-5 w-5 mr-2" />
              Manage Attributes
            </button>
          </nav>
        </div>

        {activeTab === 'attributes' ? (
          <div className="bg-white shadow rounded-lg p-6">
            <AttributeManager
              participantTypes={participantTypes}
              onAddAttribute={handleAddAttribute}
            />
          </div>
        ) : (
          <>
            <div className="bg-white shadow rounded-lg p-6 mb-8">
              <DynamicForm
                participantTypeId={activeTab === 'devices' ? ParticipantTypes.Device : ParticipantTypes.Program}
                attributes={activeTab === 'devices' ? deviceAttributes : programAttributes}
                onSubmit={handleSubmitForm}
                title={activeTab === 'devices' ? 'Device' : 'Program'}
              />
            </div>
            
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <ParticipantTable
                participants={activeTab === 'devices' ? devices : programs}
                attributes={activeTab === 'devices' ? deviceAttributes : programAttributes}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default App;