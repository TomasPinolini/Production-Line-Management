import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import toast from 'react-hot-toast';
import type { Screwdriver } from '../types';

export function ScrewdriverForm() {
  const [formData, setFormData] = useState<Omit<Screwdriver, 'id' | 'created_at'>>({
    hall: '',
    department: '',
    tool_number: '',
    mac_address: '',
    ip_address: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { error } = await supabase
        .from('screwdrivers')
        .insert([formData]);

      if (error) throw error;

      toast.success('Screwdriver added successfully!');
      setFormData({
        hall: '',
        department: '',
        tool_number: '',
        mac_address: '',
        ip_address: '',
      });
    } catch (error) {
      toast.error('Error adding screwdriver');
      console.error('Error:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="hall" className="block text-sm font-medium text-gray-700">
            Hall (Halle)
          </label>
          <input
            type="text"
            id="hall"
            value={formData.hall}
            onChange={(e) => setFormData({ ...formData, hall: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            required
          />
        </div>

        <div>
          <label htmlFor="department" className="block text-sm font-medium text-gray-700">
            Department (Abteilung)
          </label>
          <input
            type="text"
            id="department"
            value={formData.department}
            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            required
          />
        </div>

        <div>
          <label htmlFor="tool_number" className="block text-sm font-medium text-gray-700">
            Tool Number (Prüfmittelnummer)
          </label>
          <input
            type="text"
            id="tool_number"
            value={formData.tool_number}
            onChange={(e) => setFormData({ ...formData, tool_number: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            required
          />
        </div>

        <div>
          <label htmlFor="mac_address" className="block text-sm font-medium text-gray-700">
            MAC Address
          </label>
          <input
            type="text"
            id="mac_address"
            value={formData.mac_address}
            onChange={(e) => setFormData({ ...formData, mac_address: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            required
          />
        </div>

        <div>
          <label htmlFor="ip_address" className="block text-sm font-medium text-gray-700">
            IP Address
          </label>
          <input
            type="text"
            id="ip_address"
            value={formData.ip_address}
            onChange={(e) => setFormData({ ...formData, ip_address: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            required
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Add Screwdriver
        </button>
      </div>
    </form>
  );
}