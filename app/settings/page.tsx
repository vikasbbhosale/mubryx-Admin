"use client";

import { Settings } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
      </div>

      <div className="bg-white shadow rounded-lg border border-gray-100 p-8 text-center flex flex-col items-center justify-center">
        <div className="bg-gray-100 p-4 rounded-full mb-4 text-gray-600">
          <Settings className="h-8 w-8" />
        </div>
        <h3 className="text-lg font-medium text-gray-900">Settings Configuration</h3>
        <p className="mt-2 text-gray-500 max-w-md">
          Dashboard settings, profile management, and system configurations will appear here.
        </p>
      </div>
    </div>
  );
}
