import React from 'react'
import '../page.module.css'
import AdminHeader from '@/components/admin/header/admin-header'
import Panel from '@/components/admin/admin-panel/panel'
import './admin.styles.css'
import SideBar from '@/components/admin/side-bar/side-bar'

export default function page() {
  return (
      <div>
        <AdminHeader />
        <SideBar />
        <Panel />
      </div>
    )
  }


