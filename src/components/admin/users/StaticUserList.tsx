'use client';
import React from 'react';

const users = [
  {
    "id": 1,
    "name": "Fastum",
    "email": "inester@gmail.com",
    "status": "user",
    "phoneNumbers": null
  },
  {
    "id": 5,
    "name": "name",
    "email": "inester80@gmail.com",
    "status": "admin",
    "phoneNumbers": null
  },
  {
    "id": 10,
    "name": "Tetiana Rudenko Olegivna",
    "email": "tetianarudenko@gmail.com",
    "status": "user",
    "phoneNumbers": "+380681285512"
  },
  // ... додай інші користувачі за потреби
];

const StaticUserList = () => (
  <div style={{ maxWidth: 600, margin: '0 auto' }}>
    <h2>Список користувачів (статичний)</h2>
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr>
          <th style={{ border: '1px solid #ccc', padding: 8 }}>ID</th>
          <th style={{ border: '1px solid #ccc', padding: 8 }}>Ім'я</th>
          <th style={{ border: '1px solid #ccc', padding: 8 }}>Email</th>
          <th style={{ border: '1px solid #ccc', padding: 8 }}>Статус</th>
          <th style={{ border: '1px solid #ccc', padding: 8 }}>Телефон</th>
        </tr>
      </thead>
      <tbody>
        {users.map(user => (
          <tr key={user.id}>
            <td style={{ border: '1px solid #ccc', padding: 8 }}>{user.id}</td>
            <td style={{ border: '1px solid #ccc', padding: 8 }}>{user.name}</td>
            <td style={{ border: '1px solid #ccc', padding: 8 }}>{user.email}</td>
            <td style={{ border: '1px solid #ccc', padding: 8 }}>{user.status || '—'}</td>
            <td style={{ border: '1px solid #ccc', padding: 8 }}>{user.phoneNumbers || '—'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default StaticUserList;
