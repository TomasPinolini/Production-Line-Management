import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import toast from 'react-hot-toast';
import type { ScrewingCase, Screwdriver } from '../types';

export function ScrewingCaseForm() {
  const [screwdrivers, setScrewdrivers] = useState<Screwdriver[]>([]);
  const [formData, setFormData] = useState<Omit<ScrewingCase, 'id' | 'created_at'>>({
    screwdriver_id: '',
    description: '',
    target_torque: 0,
    tolerance_center: 0,
    lsl: 0,
    usl: 0,
    tolerance_percentage: 0,
    departments: [],
    workstation: '',
    comments: '',
  });

  useEffect(() => {
    fetchScrewdrivers();
  }, []);

  const fetchScrewdrivers = async () => {
    try {
      const { data, error } = await supabase
        .from('screwdrivers')
        .select('*');

      if (error) throw error;
      setScrewdrivers(data || []);
    } catch (error) {
      console.error('Error fetching screwdrivers:', error);
      toast.error('Error loading screwdrivers');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { error } = await supabase
        .from('screwing_cases')
        .insert([formData]);

      if (error) throw error;

      toast.success('Screwing case added successfully!');
      setFormData({
        screwdriver_id: '',
        description: '',
        target_torque: 0,
        tolerance_center: 0,
        lsl: 0,
        usl: 0,
        tolerance_percentage: 0,
        departments: [],
        workstation: '',
        comments: '',
      });
    } catch (error) {
      toast.error('Error adding screwing case');
      console.error('Error:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="screwdriver" className="block text-sm font-medium text-gray-700">
            Screwdriver
          </label>
          <select
            id="screwdriver"
            value={formData.screwdriver_id}
            onChange={(e) => setFormData({ ...formData, screwdriver_id: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            required
          >
            <option value="">Select a screwdriver</option>
            {screwdrivers.map((screwdriver) => (
              <option key={screwdriver.id} value={screwdriver.id}>
                {screwdriver.tool_number} - {screwdriver.department}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <input
            type="text"
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            required
          />
        </div>

        <div>
          <label htmlFor="target_torque" className="block text-sm font-medium text-gray-700">
            Target Torque (Soll Drehmoment)
          </label>
          <input
            type="number"
            id="target_torque"
            value={formData.target_torque}
            onChange={(e) => setFormData({ ...formData, target_torque: parseFloat(e.target.value) })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            required
          />
        </div>

        <div>
          <label htmlFor="tolerance_center" className="block text-sm font-medium text-gray-700">
            Tolerance Center (Toleranzmitte)
          </label>
          <input
            type="number"
            id="tolerance_center"
            value={formData.tolerance_center}
            onChange={(e) => setFormData({ ...formData, tolerance_center: parseFloat(e.target.value) })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            required
          />
        </div>

        <div>
          <label htmlFor="lsl" className="block text-sm font-medium text-gray-700">
            LSL
          </label>
          <input
            type="number"
            id="lsl"
            value={formData.lsl}
            onChange={(e) => setFormData({ ...formData, lsl: parseFloat(e.target.value) })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            required
          />
        </div>

        <div>
          <label htmlFor="usl" className="block text-sm font-medium text-gray-700">
            USL
          </label>
          <input
            type="number"
            id="usl"
            value={formData.usl}
            onChange={(e) => setFormData({ ...formData, usl: parseFloat(e.target.value) })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            required
          />
        </div>

        <div>
          <label htmlFor="tolerance_percentage" className="block text-sm font-medium text-gray-700">
            Tolerance Percentage (%)
          </label>
          <input
            type="number"
            id="tolerance_percentage"
            value={formData.tolerance_percentage}
            onChange={(e) => setFormData({ ...formData, tolerance_percentage: parseFloat(e.target.value) })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            required
          />
        </div>

        <div>
          <label htmlFor="workstation" className="block text-sm font-medium text-gray-700">
            Workstation (Arbeitsplatz)
          </label>
          <input
            type="text"
            id="workstation"
            value={formData.workstation}
            onChange={(e) => setFormData({ ...formData, workstation: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            required
          />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="comments" className="block text-sm font-medium text-gray-700">
            Comments
          </label>
          <textarea
            id="comments"
            value={formData.comments}
            onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
            rows={3}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Add Screwing Case
        </button>
      </div>
    </form>
  );
}