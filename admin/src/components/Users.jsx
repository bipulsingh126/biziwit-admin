import { useState } from 'react'

const Users = () => {
  const [searchTerm, setSearchTerm] = useState('')

  const users = [
    { id: 1, name: 'John Smith', email: 'john.smith@example.com', role: 'Admin', status: 'Active' },
    { id: 2, name: 'Sarah Johnson', email: 'sarah.johnson@example.com', role: 'Manager', status: 'Active' },
    { id: 3, name: 'Mike Wilson', email: 'mike.wilson@example.com', role: 'User', status: 'Inactive' },
    { id: 4, name: 'Emma Davis', email: 'emma.davis@example.com', role: 'User', status: 'Active' },
    { id: 5, name: 'Alex Brown', email: 'alex.brown@example.com', role: 'Manager', status: 'Active' }
  ]

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Users</h1>
        <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          Add User
        </button>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search users..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full max-w-md px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="bg-white border rounded overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Name</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Email</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Role</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredUsers.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{user.name}</td>
                <td className="px-4 py-3 text-gray-600">{user.email}</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-1 text-xs rounded bg-gray-100">{user.role}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 text-xs rounded ${
                    user.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {user.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button className="text-blue-600 hover:text-blue-800 text-sm mr-3">Edit</button>
                  <button className="text-red-600 hover:text-red-800 text-sm">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default Users
