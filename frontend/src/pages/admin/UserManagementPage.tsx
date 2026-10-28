import React, { useState } from 'react';
import { PageHeader, Pagination } from '../../components/common';
import { DEMO_USERS } from '../../utils/demoData';
import { formatDate } from '../../utils/helpers';

type DemoUser = typeof DEMO_USERS[0];

const ROLES = ['all', 'citizen', 'lawyer', 'admin'];

const UserManagementPage: React.FC = () => {
  const [roleFilter, setRoleFilter] = useState('all');
  const [search, setSearch]   = useState('');
  const [page, setPage]       = useState(1);
  const PER_PAGE = 8;

  const filtered = DEMO_USERS.filter((u: DemoUser) =>
    (roleFilter === 'all' || u.role === roleFilter) &&
    (!search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()))
  );

  const total = Math.ceil(filtered.length / PER_PAGE);
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <div className="p-8 max-w-5xl">
      <PageHeader breadcrumb="Admin / User management" section="ADMIN WORKSPACE" title="User management" subtitle="View and manage all registered users." />

      <div className="bg-white border border-gray-200 rounded-xl mb-0 overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 px-5 py-4 border-b border-gray-100">
          <input id="user-search" type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search name or email…"
            className="flex-1 min-w-48 bg-gray-50 border border-gray-200 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-900 placeholder-gray-400"
          />
          <div className="flex gap-1">
            {ROLES.map((r) => (
              <button key={r} onClick={() => { setRoleFilter(r); setPage(1); }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-colors ${roleFilter === r ? 'bg-gray-900 text-white' : 'border border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
                {r === 'all' ? 'All' : r}
              </button>
            ))}
          </div>
        </div>

        <div className="divide-y divide-gray-100">
          <div className="grid grid-cols-5 px-5 py-2.5">
            {['Name', 'Email', 'Role', 'Joined', 'Status'].map((h) => (
              <p key={h} className="text-xs font-semibold uppercase tracking-wide text-gray-400">{h}</p>
            ))}
          </div>
          {paged.map((u: DemoUser) => (
            <div key={u.id} className="grid grid-cols-5 items-center px-5 py-3.5 hover:bg-gray-50 transition-colors">
              <p className="text-sm font-medium text-gray-900 truncate">{u.name}</p>
              <p className="text-sm text-gray-500 truncate">{u.email}</p>
              <span className={`w-fit px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                u.role === 'admin' ? 'bg-purple-100 text-purple-700' : u.role === 'lawyer' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
              }`}>{u.role}</span>
              <p className="text-xs text-gray-500">{formatDate(u.createdAt)}</p>
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 w-fit">Active</span>
            </div>
          ))}
        </div>
        <div className="px-5 py-4 border-t border-gray-100">
          <Pagination page={page} totalPages={total} onPageChange={setPage} />
        </div>
      </div>
    </div>
  );
};

export default UserManagementPage;
