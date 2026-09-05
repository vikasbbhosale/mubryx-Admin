"use client";

import { Users, UserCheck, FileCheck, CheckCircle2, Clock, Eye } from 'lucide-react';
import { useEffect, useState } from 'react';
import { MOCK_TECHNICIANS, getStatusBadgeColor } from '@/lib/mock-data';
import Link from 'next/link';

export default function DashboardPage() {
  const [adminName, setAdminName] = useState('Admin');

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user.fullName || user.name) {
          setAdminName(user.fullName || user.name);
        }
      } catch (e) {
        // ignore
      }
    }
  }, []);

  const totalTechs = MOCK_TECHNICIANS.length;
  const pendingCount = MOCK_TECHNICIANS.filter(t => t.onboardingStatus === 'SUBMITTED' || t.onboardingStatus === 'UNDER_REVIEW').length;
  const approvedCount = MOCK_TECHNICIANS.filter(t => t.onboardingStatus === 'APPROVED').length;
  const totalDocs = MOCK_TECHNICIANS.reduce((acc, curr) => acc + curr.documents.length, 0);

  const stats = [
    { name: 'Total Technicians', value: totalTechs.toString(), icon: Users, change: '+12%', changeType: 'positive' },
    { name: 'Pending Approvals', value: pendingCount.toString(), icon: UserCheck, change: '+2', changeType: 'negative' },
    { name: 'Approved Technicians', value: approvedCount.toString(), icon: CheckCircle2, change: '+5', changeType: 'positive' },
    { name: 'Verification Documents', value: totalDocs.toString(), icon: FileCheck, change: '+8', changeType: 'positive' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Welcome back, {adminName}. Here is the current technician verification overview.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((item) => (
          <div
            key={item.name}
            className="relative bg-white pt-5 px-4 pb-12 sm:pt-6 sm:px-6 shadow-xs rounded-xl overflow-hidden border border-gray-200"
          >
            <dt>
              <div className="absolute bg-blue-600 rounded-lg p-3">
                <item.icon className="h-6 w-6 text-white" aria-hidden="true" />
              </div>
              <p className="ml-16 text-xs font-semibold text-gray-500 uppercase tracking-wider truncate">{item.name}</p>
            </dt>
            <dd className="ml-16 pb-6 flex items-baseline sm:pb-7">
              <p className="text-2xl font-bold text-gray-900">{item.value}</p>
            </dd>
          </div>
        ))}
      </div>

      {/* Recent Applications Section */}
      <div className="bg-white shadow-xs rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-gray-900">Recent Technician Applications</h3>
            <p className="text-xs text-gray-500">Overview of latest onboarding requests submitted by technicians</p>
          </div>
          <Link
            href="/verifications"
            className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            View Verification Hub &rarr;
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-left text-xs">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 font-semibold text-gray-500 uppercase">Technician</th>
                <th className="px-4 py-3 font-semibold text-gray-500 uppercase">City</th>
                <th className="px-4 py-3 font-semibold text-gray-500 uppercase">Skills</th>
                <th className="px-4 py-3 font-semibold text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 font-semibold text-gray-500 uppercase text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {MOCK_TECHNICIANS.slice(0, 4).map((tech) => (
                <tr key={tech.id} className="hover:bg-gray-50/80">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-2.5">
                      <img src={tech.profilePhoto} alt={tech.fullName} className="w-8 h-8 rounded-full object-cover border" />
                      <div>
                        <div className="font-bold text-gray-900">{tech.fullName}</div>
                        <div className="text-gray-400">{tech.phone}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap font-medium text-gray-700">{tech.currentCity}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex gap-1">
                      {tech.skills.slice(0, 2).map(s => (
                        <span key={s.id} className="px-1.5 py-0.5 bg-gray-100 text-gray-700 text-[10px] rounded font-medium">
                          {s.name}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`px-2 py-0.5 text-[11px] font-semibold rounded-full border ${getStatusBadgeColor(tech.onboardingStatus)}`}>
                      {tech.onboardingStatus.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right">
                    <Link
                      href="/technicians"
                      className="inline-flex items-center gap-1 text-blue-600 font-bold hover:underline"
                    >
                      <Eye className="w-3 h-3" /> View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
